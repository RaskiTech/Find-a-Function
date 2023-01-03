import  { React, Component } from 'react'
import ScreenView from './ScreenView.js'

import { min, max } from "mathjs";
import FunctionData from './FunctionData.js';

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

export const COLORS = {
    white: '#ffffff',
    gray: '#ecf0f1',
    grayDark: '#bdc3c7',
    black: '#34495e',
    blackDark: '#2c3e50',
    yellow: '#f1c40f',
    yellowDark: '#f39c12',
    orange: '#e67e22',
    orangeDark: '#d35400',
    turquoise: '#1abc9c',
    turquoiseDark: '#16a085',
    blue: '#3498db',
    purple: '#9b59b6',
}


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
        if (this.props.findingBestLine === true && prevProps.findingBestLine === false)
        {
            this.renderingFunctionObjects = []

            if (this.props.functionIndex === -1)
                this.renderingFunctionObjects = GetBestFuncs(this.props.points);
            else
                this.renderingFunctionObjects = GetBestFunctionOfType(this.props.points, this.props.functionIndex);

            if (this.renderingFunctionObjects.length === 0)
            {
                let minPointAmount = this.props.functionIndex === -1 ? 
                    1 : /* The least amount of points a any curve has, hardcoded to 1*/
                    FunctionData[this.props.functionIndex][7];

                let possiblePlural = minPointAmount == 1 ? " point." : " points.";

                this.props.showAlertPopup("Make sure to have at least " + minPointAmount + possiblePlural);
            }

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
            console.log("Returning because scale is", this.scale, "and delta is", change);
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

            let smallestSample = FunctionData[funcObject[1]][5];
            let biggestSample = FunctionData[funcObject[1]][6];

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

function GetBestFuncs(points)
{
    if (points.length === 0)
        return []

    let [x, y] = ConvertPointsToXYArrays(points)

    /* [ ... [func, i, leastSquares, params] ... ] */
    let functionApproximates = [];
    let functionApproximateIndex = 0;

    for (let i = 0; i < FunctionData.length; i++)
    {
        if (points.length < FunctionData[i][7])
            continue;

        let params = FunctionData[i][2](x, y);
        
        const leastSquaresMultiplier = FunctionData[i][4];
        functionApproximates[functionApproximateIndex] = [
            function(x) { return FunctionData[i][1](x, params); }, 
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

    for (let i = 0; i < min(maxShowFuncAmount, functionApproximates.length); i++) {
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
function GetBestFunctionOfType(points, functionIndex)
{
    if (points.length < FunctionData[functionIndex][7])
        return [];

    let [x, y] = ConvertPointsToXYArrays(points);
    let params = FunctionData[functionIndex][2](x, y);
    
    const leastSquaresMultiplier = FunctionData[functionIndex][4];
    let functionApproximates = [
        function(x) { return FunctionData[functionIndex][1](x, params); }, 
        functionIndex, 
        -1,/*Placeholder*/
        params
    ];
    functionApproximates[2] = leastSquaresMultiplier * getLeastSquares(functionApproximates[0], x, y);

    return [[functionApproximates[0], functionApproximates[1], GetStringFormula(functionApproximates[1], functionApproximates[3]), functionApproximates[2]]]
}

function ConvertPointsToXYArrays(points)
{
    let x = Array(points.length);
    let y = Array(points.length);
    for (let i = 0; i < points.length; i++)
    {
        x[i] = points[i][0];
        y[i] = points[i][1];
    }

    return [x, y]
}

function RoundToDecimals(number, tenthPower) { return Math.round((number + Number.EPSILON) * tenthPower) / tenthPower; }

function GetStringFormula(i, params) {
    const tenthPower = Math.pow(10, decimals);
    let RoundCorrectDecimals = (number) => RoundToDecimals(number, tenthPower);

    let str = FunctionData[i][3]

    let nextParamIndex = params.length - 1;

    for (let i = 0; i < str.length; i++) {
        if (str[i] !== '_') 
            continue;
        
        if (params[nextParamIndex] < 0) {
            // if there is a + before, switch it to -
            if (i - 2 > 0 && str[i - 2] === '+') {
                str = str.slice(0, i-2) + '-' + str.slice(i-1);
                str = str.slice(0, i) + RoundCorrectDecimals(Math.abs(params[nextParamIndex])) + str.slice(i+1);
            }
            else if (i - 1 > 0 && str[i - 1] === '+') {
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

function getLeastSquares(func, x, y) {
    let total = 0;
    for (let i = 0; i < x.length; i++)
        total += Math.pow(func(x[i]) - y[i], 2);
    return total / x.length;
}

export default CoordinatePlane;