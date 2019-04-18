"use strict";

var canvas;
var gl;

var numVertices  = 36;

var numChecks = 8;

var program;

var c;

var flag = true;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var dr = 5.0 * Math.PI/180.0;
var near = 0.1;
var far = 5.0;
var modelViewMatrix,projectionMatrix, translationMatrix, scalingMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, translationMatrixLoc, scalingMatrixLoc;
var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];
var normalsArray = [];
var fTranslateX = 0.0;
var fTranslateY = 0.0;
var fTranslateZ = 0.0;
var fScaler = 0.5;
var theta  = 0.0;
var phi    = 0.0;
var radius = 1.0;
var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;
var useGouraud = true;
var texSize = 32;

var ambientColor, diffuseColor, specularColor;
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.1, 0.1, 0.1, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4( 0.1745, 0.01175, 0.01175);
var materialDiffuse = vec4( 0.61424, 0.04136, 0.04136);
var materialSpecular = vec4( 0.727811, 0.626959, 0.626959);
var materialShininess = 60.0;

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

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
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
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    pointsArray.push(vertices[a]);
    //colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);
    pointsArray.push(vertices[b]);
    //colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[1]);
    normalsArray.push(normal);
    pointsArray.push(vertices[c]);
    //colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);
    pointsArray.push(vertices[a]);
    //colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[0]);
    normalsArray.push(normal);
    pointsArray.push(vertices[c]);
    //colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[2]);
    normalsArray.push(normal);
    pointsArray.push(vertices[d]);
    //colorsArray.push(vertexColors[a]);
    texCoordsArray.push(texCoord[3]);
    normalsArray.push(normal);
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

var image1 = new Array()
    for (var i =0; i<texSize; i++)  image1[i] = new Array();
    for (var i =0; i<texSize; i++)
        for ( var j = 0; j < texSize; j++)
           image1[i][j] = new Float32Array(4);
    for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
        var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
        image1[i][j] = [c, c, c, 1];
    }

var image2 = new Uint8Array(4*texSize*texSize);
    for ( var i = 0; i < texSize; i++ )
        for ( var j = 0; j < texSize; j++ )
           for(var k =0; k<4; k++)
                image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


                
function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
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

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    //Map matrices
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    scalingMatrixLoc = gl.getUniformLocation( program, "scalingMatrix" );
    translationMatrixLoc = gl.getUniformLocation(program, "translationMatrix");

    // Pass texture
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
    configureTexture(image2);

    // Map light-related variables
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

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
	document.getElementById("scaler").onchange = function(event) {
        fScaler = event.target.valueAsNumber;
    };
	document.getElementById("translateX").onchange = function(event) {
        fTranslateX = event.target.valueAsNumber;
    };
	document.getElementById("translateY").onchange = function(event) {
        fTranslateY = event.target.valueAsNumber;
    };
	document.getElementById("translateZ").onchange = function(event) {
        fTranslateZ = event.target.valueAsNumber;
    };

    render();
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Translation matrix
    var translationMatrix = [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        fTranslateX, fTranslateY, fTranslateZ, 1.0
    ];
    // Scaling matrix
    var scalingMatrix = [
        fScaler, 0.0, 0.0, 0.0,
        0.0, fScaler, 0.0, 0.0,
        0.0, 0.0, fScaler, 0.0,
        0.0, 0.0, 0.0, 1.0
    ];

    // Orthogonal view
    eye = vec3(radius*Math.sin(phi), radius*Math.sin(theta), radius*Math.cos(phi));
    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho( left, right, bottom, ytop, near, far );

    //Map variables
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix4fv(scalingMatrixLoc, false, flatten(scalingMatrix));
    gl.uniformMatrix4fv(translationMatrixLoc, false, translationMatrix);
    gl.uniform1i(gl.getUniformLocation(program, "useGouraud"), useGouraud);

    // Split canvas
    gl.enable(gl.SCISSOR_TEST);
    var width = gl.canvas.width;
    var height = gl.canvas.height;
    gl.scissor(0,  height/2, width / 2, height/2);
    gl.viewport(0,  height/2, width / 2, height/2); 
    
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    
    // Create perspective view of the object
    var aspect = canvas.width/canvas.height;
    var fovy = 95.0;
    projectionMatrix=perspective(fovy,aspect,near,far);
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    gl.scissor(width / 2, height/2, width/2, height/2);
    gl.viewport(width / 2, height/2, width/2, height/2);
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
    requestAnimFrame(render);
}


function selectShading(event) {
    useGouraud = event.value != "phong"
}