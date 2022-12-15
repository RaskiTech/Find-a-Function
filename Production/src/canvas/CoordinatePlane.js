import  { React, Component } from 'react'
import ScreenView from './ScreenView.js'
import COLORS from '../colors.js'

import { zeros, multiply } from "mathjs";

const minSpaceBetweenLines = 20;
const maxSpaceBetweenLine = 50;
const zoomSpeed = 0.003;
const startZoom = 50;
const maxScale = 1_000_000_000_000;
const minScale = 0.000_000_0015;

const pointRadius = 6;
const samplesInFunction = 200;
const functionLineWidth = 5;
// From colors.js blended halfway with white
const functionColor = [
    '#F8E287'/*Yellow*/, '#8DDECE'/*turquoise*/, 
    '#9ACCED'/*Blue*/, '#CDACDB'/*Purple*/,
    '#F3BF91'/*Orange*/, '#F3A69E'/*Red*/,
    '#97E6B8'/*Green*/, '#9AA4AF'/*Gray*/
]

const textXOffsetFromCenter = 0;
const textYOffsetFromCenter = -5;
const linesBetweenTexts = 5;

const maxShowFuncAmount = 3;
const leastSquaresTreshold = 1;
const decimals = 5;

/* 
f[0] = function as a map, 
f[1] = function - normal version, 
f[2] = method to find best-fit, 
f[3] = string formula (params with _)
f[4] = least squares multiplier
f[5] = smallest sample (use if function is not defined everywhere)
f[6] = biggest sample (use if function is not defined everywhere)
f[7] = min amount of data points required

Least Squares multiplier:
If many curves get the same evaluation, the program will pick the one that has
smaller least square multiplier. For example if both Order 5 polynomial 
and a line get the same evaluation, a line is better

*/
const functions = [ 
    [ /* Line */
        function(a, P) { return a.map(function(x) { return P[0] + x * P[1] })},
        function(x, P)                            { return P[0] + x * P[1] },
        function(x, y) { return calculateBestPolynomial(2, x, y) },
        "_x + _",
        1,
        -Infinity,
        Infinity,
        2
    ],
    [ /* Order 2 polynomial */
        function(a, P) { return a.map(function(x) { return P[0] + x * P[1] + x * x * P[2] })},
        function(x, P)                            { return P[0] + x * P[1] + x * x * P[2] },
        function(x, y) { return calculateBestPolynomial(3, x, y) },
        "_x² + _x + _",
        2,
        -Infinity,
        Infinity,
        3
    ],
    [ /* Order 3 polynomial */
        function(a, P) { return a.map(function(x) { return P[0]+x*P[1]+x*x*P[2]+Math.pow(x, 3)*P[3] })},
        function(x, P)                            { return P[0]+x*P[1]+x*x*P[2]+Math.pow(x, 3)*P[3] },
        function(x, y) { return calculateBestPolynomial(4, x, y) },
        "_x³ + _x² + _x + _",
        3,
        -Infinity,
        Infinity,
        4
    ],
    [ /* Order 4 polynomial */
        function(a, P) { return a.map(function(x) { return P[0]+x*P[1]+x*x*P[2]+Math.pow(x, 3)*P[3]+Math.pow(x, 4)*P[4] })},
        function(x, P)                            { return P[0]+x*P[1]+x*x*P[2]+Math.pow(x, 3)*P[3]+Math.pow(x, 4)*P[4] },
        function(x, y) { return calculateBestPolynomial(5, x, y) },
        "_x⁴ + _x³ + _x² + _x + _",
        4,
        -Infinity,
        Infinity,
        5
    ],
    [ /* Order 5 polynomial */
        function(a, P) { return a.map(function(x) { return P[0]+x*P[1]+x*x*P[2]+Math.pow(x, 3)*P[3]+Math.pow(x, 4)*P[4]+Math.pow(x, 5)*P[5] })},
        function(x, P)                            { return P[0]+x*P[1]+x*x*P[2]+Math.pow(x, 3)*P[3]+Math.pow(x, 4)*P[4]+Math.pow(x, 5)*P[5] },
        function(x, y) { return calculateBestPolynomial(6, x, y) },
        "_x⁵ + _x⁴ + _x³ + _x² + _x + _",
        5,
        -Infinity,
        Infinity,
        6
    ],
    [ /* Natural Exponent */
        function(a, P) { return a.map(function(x) { return P[0] * Math.exp(P[1] * x) + P[2] })},
        function(x, P)                            { return P[0] * Math.exp(P[1] * x) + P[2] },
        function(x, y) { return useNonLinearRegression(5, 5000, x, y) },
        "_e^_ + _",
        1,
        -Infinity,
        Infinity,
        1
    ],
    [ /* Sin */
        function(a, P) { return a.map(function(x) { return P[0] * Math.sin(P[1] * x + P[2]) + P[3] })},
        function(x, P)                            { return P[0] * Math.sin(P[1] * x + P[2]) + P[3] },
        function(x, y) { return  useNonLinearRegression(6, 5000, x, y) },
        "_ * sin(_x + _) + _",
        3,
        -Infinity,
        Infinity,
        4
    ],
    [ /* natural logarithmic */
        function(a, P) { return a.map(function(x) { return P[0] * Math.log(P[1] * x) })},
        function(x, P)                            { return P[0] * Math.log(P[1] * x) },
        function(x, y) { return useNonLinearRegression(7, 5000, x, y) },
        "_ * ln(_x)",
        1,
        0.000000000001,
        Infinity,
        1
    ],
];

class CoordinatePlane extends Component {
    ctx = undefined;
    scale = startZoom;
    drawEveryNthLine = 1;
    xOrigin = undefined;
    yOrigin = undefined;

    /* [ ... [func, i, stringFormula, error], [func, i, stringFormula, error] ... ] */
    renderingFunctionObjects = [];

    initCanvas = (ctx) => {
        this.ctx = ctx;
        this.xOrigin = ctx.canvas.width / 2;
        this.yOrigin = ctx.canvas.height / 2;
    }

    canvasDrag = (differenceX, differenceY) => {
        this.xOrigin -= differenceX;
        this.yOrigin -= differenceY;
    }

    componentDidUpdate = (prevProps, prevState) => {
        // Clear update incoming
        if (this.props.clearBoardFlag !== prevProps.clearBoardFlag) {
            this.renderingFunctionObjects = []
        }

        // Start finding best line
        if (this.props.findingBestLine === true && prevProps.findingBestLine === false) {
            this.renderingFunctionObjects = []
            this.renderingFunctionObjects = GetBestFuncs(this.props.points);
            this.props.stopFunctionFind();
        }
    }

    planeToScreenSpace = (x, y) => {
        // Multiply by the scale to get the pixel difference from the middle
		let xPDifference = x * this.scale;
		let yPDifference = y * -this.scale; // Use minus because the y axis is flipped in pixels

		// Add it to the pixel center coors to get the coords
		let xP = this.xOrigin + xPDifference;
		let yP = this.yOrigin + yPDifference; 

		return [xP, yP];
    }
    screenToPlaneSpace = (x, y) => {
        // Set the planes 0 0 point to pixel 0 0.
        let normalizedX = x - this.xOrigin;
        let normalizedY = y - this.yOrigin;
        // Divide by the scale to get the coordinates
        let xScr = normalizedX / this.scale;
        let yScr = normalizedY / -this.scale; // Use minus because the y axis is flipped in pixels
        return [xScr, yScr];
    }

    // Zoom works like this: if the first non-zero number is a two, multiply by 5/2, else 2
    zoomMultiplyCounter = 2;
    zoom = (delta, mouseX, mouseY) => {
        const change = delta * this.scale * zoomSpeed;
        if ((this.scale > maxScale && change < 0) || (this.scale < minScale && change > 0)) {
            console.log("Returning cause scale is", this.scale, "and delta is", change);
            return;
        }

        let mouseBefore = this.screenToPlaneSpace(mouseX, mouseY);
        this.scale -= change;
        let mouseBeforeScreen = this.planeToScreenSpace(mouseBefore[0], mouseBefore[1]);

        this.xOrigin -= mouseBeforeScreen[0] - mouseX;
        this.yOrigin -= mouseBeforeScreen[1] - mouseY;

        // Scale text
        if (this.drawEveryNthLine * this.scale < minSpaceBetweenLines) {
            this.zoomMultiplyCounter--;
            if (this.zoomMultiplyCounter < 0) {
                this.zoomMultiplyCounter += 3;
                this.drawEveryNthLine *= 5/2;
            }
            else this.drawEveryNthLine *= 2;
        }
        else if (this.drawEveryNthLine * this.scale > maxSpaceBetweenLine) {
            this.zoomMultiplyCounter++;
            if (this.zoomMultiplyCounter > 2) {
                this.zoomMultiplyCounter -= 3;
                this.drawEveryNthLine /= 5/2;
            }
            else this.drawEveryNthLine /= 2;
        }

        this.draw();
    }

    draw = () => {
        let drawBG = (ctx) => {
            ctx.fillStyle = COLORS.white;
            ctx.beginPath();
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.fill();
        }
        let drawScaleLines = (ctx) => {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.strokeStyle = COLORS.gray;
            let lineSpace = this.scale * this.drawEveryNthLine;
            let startDraw = this.xOrigin % lineSpace;// Get the remainder to know where to start drawing the lines

            for (let i = startDraw; i < ctx.canvas.width; i += lineSpace) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i, ctx.canvas.height);
            }
            startDraw = this.yOrigin % lineSpace;
            for (let i = startDraw; i < ctx.canvas.height; i += lineSpace) {
                ctx.moveTo(0, i);
                ctx.lineTo(ctx.canvas.width, i);
            }
            ctx.stroke();
        }
        let drawAxis = (ctx) => {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.strokeStyle = COLORS.black;
            ctx.moveTo(0, this.yOrigin);
            ctx.lineTo(ctx.canvas.width, this.yOrigin);
            ctx.moveTo(this.xOrigin, 0);
            ctx.lineTo(this.xOrigin, ctx.canvas.height);
            ctx.stroke();
        }
        let drawPoints = (ctx) => {
            ctx.beginPath();
            ctx.fillStyle = COLORS.blue;
            for (let i = 0; i < this.props.points.length; i++) {
                const [x, y] = this.planeToScreenSpace(this.props.points[i][0], this.props.points[i][1]);
                ctx.moveTo(x, y);
                ctx.arc(x, y, pointRadius, 0, 2*Math.PI);
            }
            ctx.fill();
        }
        let drawScaleText = (ctx) => {
            let spaceBetweenLines = linesBetweenTexts * this.drawEveryNthLine;

            let screenSide = this.screenToPlaneSpace(0, 0);

            let firstDrawX = Math.floor(screenSide[0] / spaceBetweenLines) * spaceBetweenLines;
            let firstDrawY = Math.floor(screenSide[1] / spaceBetweenLines) * spaceBetweenLines;
            let firstDrawPixel = this.planeToScreenSpace(firstDrawX, firstDrawY);

            ctx.font = "20px Arial";
			ctx.fillStyle = COLORS.blackDark;

            const RoundingFactor = 1_000_000_000_00;

            let i = 0;
            let pos = firstDrawPixel[0] + textXOffsetFromCenter;
            while (pos < ctx.canvas.width) {
                let num = Math.round((firstDrawX + i * spaceBetweenLines) * RoundingFactor) / RoundingFactor;
                if (num !== 0)
                    ctx.fillText(num, pos, textYOffsetFromCenter + this.yOrigin);
                i++;
                pos += this.scale * spaceBetweenLines;
            }
            i = 0;
            pos = firstDrawPixel[1] + textYOffsetFromCenter;
            while (pos < ctx.canvas.height) {
                let num = Math.round((firstDrawY + i * spaceBetweenLines) *  RoundingFactor) / RoundingFactor;
                if (num !== 0)
                    ctx.fillText(num, textXOffsetFromCenter + this.xOrigin, pos);
                i--;
                pos += this.scale * spaceBetweenLines;
            }

            // Points (1, 0) and (0, 1)
            /*
            let point1_1 = this.screenToPlaneSpace(this.xOrigin + this.scale * this.drawEveryNthLine, this.yOrigin - this.scale * this.drawEveryNthLine);
            ctx.fillText(point1_1[0].toString(), this.xOrigin + this.scale * this.drawEveryNthLine + textXOffsetFromCenter, this.yOrigin + textYOffsetFromCenter);
            ctx.fillText(point1_1[1].toString(), this.xOrigin + textXOffsetFromCenter, this.yOrigin - this.scale* this.drawEveryNthLine + textYOffsetFromCenter);
            //*/
        }
        let drawFunction = (ctx, funcObject, color) => {
            ctx.lineWidth = functionLineWidth;
            ctx.strokeStyle = color;
            ctx.beginPath();

            let smallestSample = functions[funcObject[1]][5];
            let biggestSample = functions[funcObject[1]][6];

            let startScreenPos = smallestSample === undefined ? 0 : Math.max(this.planeToScreenSpace(smallestSample, 0)[0], 0);
            let endScreenPos = biggestSample === undefined ? ctx.canvas.width : Math.min(this.planeToScreenSpace(biggestSample, 0)[0], ctx.canvas.width);
            let interval = (endScreenPos-startScreenPos) / samplesInFunction;

		    for (let xP = startScreenPos; xP < endScreenPos; xP += interval) {
			    let x = this.screenToPlaneSpace(xP, 0)[0];
			    let yP = this.planeToScreenSpace(0, funcObject[0](x))[1];
			
			    ctx.lineTo(xP, Math.max(0, Math.min(yP, ctx.canvas.height)));
		    }
		    ctx.stroke();
        }
        let drawFunctionFormula = (ctx, funcObject, color, xPos, yPos) => {

            // Draw error
            ctx.fillStyle = functionColor[7];/*Gray*/
            ctx.font = "15px Arial";
            ctx.fillText("Error " + RoundToDecimals(funcObject[3], Math.pow(10, 10)), xPos, yPos+15);

            // Draw formula
            ctx.font = "25px Arial";
            ctx.fillStyle = functionColor[7];/*Gray*/
            ctx.fillText(funcObject[2], xPos+1, yPos+1); // Backdrop
			ctx.fillStyle = color;
            ctx.fillText(funcObject[2], xPos, yPos);

        }


        let ctx = this.ctx;
        if (ctx === undefined) {
            console.error("Canvas context was undefined!");
            return;
        }
        ctx.lineWidth = 1;
        
        drawBG(ctx);
        drawScaleLines(ctx);
        for (let i = 0; i < this.renderingFunctionObjects.length; i++)
            drawFunction(ctx, this.renderingFunctionObjects[i], functionColor[i]);
        drawAxis(ctx);
        drawPoints(ctx);
        drawScaleText(ctx);
        for (let i = 0; i < this.renderingFunctionObjects.length; i++)
            drawFunctionFormula(ctx, this.renderingFunctionObjects[i], functionColor[i], 30, window.innerHeight - 50*i - 30);
    }

    render() {
        return (
            <ScreenView
                init={this.initCanvas}
                draw={this.draw}
                zoom={this.zoom}
                addDataPoint={() => {}}
                canvasDrag={this.canvasDrag}
            />
        )
    }
}

function GetBestFuncs(points) {
    let x = Array(points.length);
    let y = Array(points.length);
    for (let i = 0; i < points.length; i++) {
        x[i] = points[i][0];
        y[i] = points[i][1];
    }

    /* [ ... [func, i, leastSquares, params] ... ] */
    let functionApproximates = [];
    let functionApproximateIndex = 0;

    for (let i = 0; i < functions.length; i++) {
        if (points.length < functions[i][7])
            continue;

        let params = functions[i][2](x, y);
        
        const leastSquaresMultiplier = functions[i][4];
        functionApproximates[functionApproximateIndex] = [
            function(x) { return functions[i][1](x, params); }, 
            i, 
            -1,/*Placeholder*/
            params
        ];
        functionApproximates[functionApproximateIndex][2] = 
            leastSquaresMultiplier * getLeastSquares(functionApproximates[functionApproximateIndex][0], x, y);

        functionApproximateIndex++
    }

    functionApproximates.sort(function(a, b) { return (a[2] < b[2] ? -1 : 1); })

    /* [ ... [func, i, stringFormula, error], [func, i, stringFormula, error] ... ] */
    let functionsToShow = [];

    for (let i = 0; i < maxShowFuncAmount; i++) {
        if (i !== 0 && functionApproximates[i][2] > leastSquaresTreshold)
            break;

        functionsToShow.push([
            functionApproximates[i][0], 
            functionApproximates[i][1], 
            GetStringFormula(functionApproximates[i][1], functionApproximates[i][3]),
            functionApproximates[i][2]
        ]);
    }

    return functionsToShow;
}

function RoundToDecimals(number, tenthPower) { return Math.round((number + Number.EPSILON) * tenthPower) / tenthPower; }

function GetStringFormula(i, params) {
    const tenthPower = Math.pow(10, decimals);
    let RoundCorrectDecimals = (number) => RoundToDecimals(number, tenthPower);

    let str = functions[i][3]

    let nextParamIndex = params.length - 1;

    for (let i = 0; i < str.length; i++) {
        if (str[i] !== '_') 
            continue;
        
        if (params[nextParamIndex] < 0) {
            // if there is a + before, switch it to -
            if (i - 2 > 0 && str[i - 2] == '+') {
                str = str.slice(0, i-2) + '-' + str.slice(i-1);
                str = str.slice(0, i) + RoundCorrectDecimals(Math.abs(params[nextParamIndex])) + str.slice(i+1);
            }
            else if (i - 1 > 0 && str[i - 1] == '+') {
                str[i - 1] = '-';
                str = str.slice(0, i) + RoundCorrectDecimals(Math.abs(params[nextParamIndex])) + str.slice(i+1);
            }
            else {
                str = str.slice(0, i) + RoundCorrectDecimals(params[nextParamIndex]) + str.slice(i+1);;
            }
        }
        else {
            str = str.slice(0, i) + RoundCorrectDecimals(params[nextParamIndex]) + str.slice(i+1);
        }
        nextParamIndex--;
    }

    return str;
}

function calculateBestPolynomial(coefficentAmount, x, y) {
    let matrix_invert = (M) => {
		if(M.length !== M[0].length){return;}
		
		var i=0, ii=0, j=0, dim=M.length, e=0, t=0;
		var I = [], C = [];
		for(i=0; i<dim; i+=1){
			I[I.length]=[];
			C[C.length]=[];
			for(j=0; j<dim; j+=1){
				if(i===j){ I[i][j] = 1; }
				else{ I[i][j] = 0; }
				
				C[i][j] = M[i][j];
			}
		}
		
		for(i=0; i<dim; i+=1){
			e = C[i][i];
			
			if(e===0){
				for(ii=i+1; ii<dim; ii+=1){
					if(C[ii][i] !== 0){
						for(j=0; j<dim; j++){
							e = C[i][j];       //temp store i'th row
							C[i][j] = C[ii][j];//replace i'th row by ii'th
							C[ii][j] = e;      //repace ii'th by temp
							e = I[i][j];       //temp store i'th row
							I[i][j] = I[ii][j];//replace i'th row by ii'th
							I[ii][j] = e;      //repace ii'th by temp
						}
						break;
					}
				}
				e = C[i][i];
				if(e===0){return}
			}
			
			for(j=0; j<dim; j++){
				C[i][j] = C[i][j]/e; //apply to original matrix
				I[i][j] = I[i][j]/e; //apply to identity
			}
			
			for(ii=0; ii<dim; ii++){
				if(ii===i){continue;}
				
				e = C[ii][i];
				
				for(j=0; j<dim; j++){
					C[ii][j] -= e*C[i][j]; //apply to original matrix
					I[ii][j] -= e*I[i][j]; //apply to identity
				}
			}
		}
		return I;
	}

	let matrixA = zeros(coefficentAmount, coefficentAmount)
	let matrixB = zeros(1, coefficentAmount);
	let matAValues = [];//Array(2*coefficentAmount-1);
	for (let i = 0; i < 2*coefficentAmount-1; i++) {
		matAValues[i] = 0;
		for (let j = 0; j < x.length; j++)
			matAValues[i] += Math.pow(x[j], i);
	}
	// Set the values to the matrix
	matrixA = matrixA.map(function(value, index) {
		return matAValues[index[0]+index[1]];
	});
	matrixB = matrixB.map(function(value, index, matrix){
		let newValue = 0;
		for (let i = 0; i < x.length; i++)
			newValue += y[i] * Math.pow(x[i], index[1]);
		return newValue
	});
	let matrixAT = matrix_invert(matrixA._data);

	// Then just the final multiply
	let matrixC = multiply(matrixB, matrixAT);
    return matrixC._data[0];
}

function useNonLinearRegression(funcIndex, iteration, x, y) {
    let variableCount = functions[funcIndex][3].split('_').length - 1;
    let initialValues = Array(variableCount).fill(1);

    return nonLinearRegression(functions[funcIndex][0], initialValues, x, y, {maxIter: iteration,display:false});
}

function nonLinearRegression(fun,Parm0,x,y,Opt) {
	if(!Opt){Opt={}};
	if(!Opt.maxIter){Opt.maxIter=1000};
	if(!Opt.step){// initial step is 1/100 of initial value (remember not to use zero in Parm0)
		Opt.step=Parm0.map(function(p){return p/100});
		Opt.step=Opt.step.map(function(si){if(si==0){return 1}else{ return si}}); // convert null steps into 1's
	};
	if(typeof(Opt.display)=='undefined'){Opt.display=true};
	if(!Opt.objFun){Opt.objFun=function(y,yp){return y.map(function(yi,i){return Math.pow((yi-yp[i]),2)}).reduce(function(a,b){return a+b})}} //SSD
	
	var cloneVector=function(V){return V.map(function(v){return v})};
	var P0=cloneVector(Parm0),P1=cloneVector(Parm0);
	var n = P0.length;
	var step=Opt.step;
	var funParm=function(P){return Opt.objFun(y,fun(x,P))}//function (of Parameters) to minimize
	// silly multi-univariate screening
	for(var i=0;i<Opt.maxIter;i++) {
		for(var j=0;j<n;j++){ // take a step for each parameter
			P1=cloneVector(P0);
			P1[j]+=step[j];
			if(funParm(P1)<funParm(P0)) { // if parm value going in the righ direction
				step[j]=1.2*step[j]; // then go a little faster
				P0=cloneVector(P1);
			}
			else{
				step[j]=-(0.5*step[j]); // otherwiese reverse and go slower
			}	
		}
        // display
		//if(Opt.display){if(i>(Opt.maxIter-10)){console.log(i+1,funParm(P0),P0)}}
	}
	return P0;
};
function getLeastSquares(func, x, y) {
    let total = 0;
    for (let i = 0; i < x.length; i++)
        total += Math.pow(func(x[i]) - y[i], 2);
    return total / x.length;
}


export default CoordinatePlane;