"use strict";

var canvas;
var gl;
var numVertices  = 36;
var numChecks = 8;
var program;
var c;
var flag = true;
var near = 1.0;
var far = 5.0;
var radius = 6.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;
var fScaler = 0.5;
var fTranslateX = 0.0;
var fTranslateY = 0.0;
var fTranslateZ = 0.0;

var modeViewMatrix, projectionMatrix, translateMatrix, scaleMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, translateMatrixLoc, scaleMatrixLoc;

var pointsArray = [];
var colorsArray = [];

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);


var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);
 
     pointsArray.push(vertices[b]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[a]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[c]);
     colorsArray.push(vertexColors[a]);

     pointsArray.push(vertices[d]);
     colorsArray.push(vertexColors[a]);
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
	
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    translateMatrixLoc = gl.getUniformLocation( program, "translateMatrix" );
	scaleMatrixLoc = gl.getUniformLocation( program, "scaleMatrix" );
	// Setup listeners
	
    document.getElementById("increaseThetaButton").onclick = function(){theta += dr;};
    document.getElementById("decreaseThetaButton").onclick = function(){theta -= dr;};
    document.getElementById("increasePhiButton").onclick = function(){phi += dr;};
    document.getElementById("decreasePhiButton").onclick = function(){phi -= dr;};
    document.getElementById("widerButton").onclick = function(){left  *= 0.9; right *= 0.9;};
    document.getElementById("narrowerButton").onclick = function(){left *= 1.1; right *= 1.1;};
    document.getElementById("higherButton").onclick = function(){ytop  *= 0.9; bottom *= 0.9;};
    document.getElementById("shorterButton").onclick = function(){ytop *= 1.1; bottom *= 1.1;};
    document.getElementById("nearSlider").onchange = function() {
        if (this.valueAsNumber == far) return;
        near = this.valueAsNumber;
    };
    document.getElementById("farSlider").onchange = function() {
        if (this.valueAsNumber == near) return;
        far = this.valueAsNumber;
    };
	document.getElementById("fScaler").onchange = function(event) {
        fScaler = event.target.value;
    };
	document.getElementById("fTranslateX").onchange = function(event) {
        fTranslateX = event.target.value;
    };
	document.getElementById("fTranslateY").onchange = function(event) {
        fTranslateY = event.target.value;
    };
	document.getElementById("fTranslateZ").onchange = function(event) {
        fTranslateY = event.target.value;
    };
    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    	
	var scaleMatrix = [
		fScaler, 0.0, 0.0, 0.0,
		0.0, fScaler, 0.0, 0.0,
		0.0, 0.0, fScaler, 0.0,
		0.0, 0.0, 0.0, 1.0];
		
	var translateMatrix = [
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		fTranslateX, fTranslateY, fTranslateZ, 1.0];
        
        
	var eye = vec3( radius*Math.sin(theta)*Math.cos(phi),
                    radius*Math.sin(theta)*Math.sin(phi),
                    radius*Math.cos(theta));
    var modelViewMatrix = lookAt( eye, at, up );
    var projectionMatrix = ortho( left, right, bottom, ytop, near, far );
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix4fv( scaleMatrixLoc, false, flatten(scaleMatrix) );
    gl.uniformMatrix4fv( translateMatrixLoc, false, flatten(translateMatrix) );

    gl.enable(gl.SCISSOR_TEST);
    var width = gl.canvas.width;
    var height = gl.canvas.height;
    gl.scissor(0,  height/2, width / 2, height/2);
    gl.viewport(0,  height/2, width / 2, height/2); 
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    //PERSPECTIVE
    var aspect = canvas.width/canvas.height;
    var fovy = 21.0;


    projectionMatrix=perspective(fovy,aspect,near,far);
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    gl.scissor(width / 2, height/2, width/2, height/2);
    gl.viewport(width / 2, height/2, width/2, height/2);

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimFrame(render);
}
