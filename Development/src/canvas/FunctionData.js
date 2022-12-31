import { zeros, multiply } from "mathjs";

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

export const FunctionData = [ 
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
        "_e^(_x) + _",
        1,
        -Infinity,
        Infinity,
        1
    ],
    [ /* Sin */
        function(a, P) { return a.map(function(x) { return P[0] * Math.sin(P[1] * x + P[2]) + P[3] })},
        function(x, P)                            { return P[0] * Math.sin(P[1] * x + P[2]) + P[3] },
        function(x, y) { return  useNonLinearRegression(6, 5000, x, y) },
        "_ · sin(_x + _) + _",
        3,
        -Infinity,
        Infinity,
        4
    ],
    [ /* natural logarithmic */
        function(a, P) { return a.map(function(x) { return P[0] * Math.log(P[1] * x) })},
        function(x, P)                            { return P[0] * Math.log(P[1] * x) },
        function(x, y) { return useNonLinearRegression(7, 5000, x, y) },
        "_ · ln(_x)",
        1,
        0.000000000001,
        Infinity,
        1
    ],
];

export default FunctionData;



function calculateBestPolynomial(coefficentAmount, x, y) {
    let matrix_invert = (M) => {
		if(M.length !== M[0].length){return;}
		
		var i=0, ii=0, j=0, dim=M.length, e=0;
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
    let variableCount = FunctionData[funcIndex][3].split('_').length - 1;
    let initialValues = Array(variableCount).fill(1);

    return nonLinearRegression(FunctionData[funcIndex][0], initialValues, x, y, {maxIter: iteration,display:false});
}

function nonLinearRegression(fun,Parm0,x,y,Opt) {
	if(!Opt){Opt={}};
	if(!Opt.maxIter){Opt.maxIter=1000};
	if(!Opt.step){// initial step is 1/100 of initial value (remember not to use zero in Parm0)
		Opt.step=Parm0.map(function(p){return p/100});
		Opt.step=Opt.step.map(function(si){if(si===0){return 1}else{ return si}}); // convert null steps into 1's
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