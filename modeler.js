/**
 * CGI Project 2 - Model Viewer
 * By Lourenço Soares (54530)
 */
 
/*====================================
           Global Variables
====================================*/

// WebGL globals
var gl;
var objectDrawFunc;
var modelMTX = mat4();
var mView, mProjection;

// Camera globals
var zoom = 1;
var camera_pitch = -45;
var camera_yaw = 35.2645;
var mouse_down = false;

// Render settings globals
var wireframe_enabled = true;
var zbuffer_enabled = false;
var culling_enabled = false;


/*====================================
          Program Constants
 Change if you know what you're doing
====================================*/

const DEFAULT_TAB = "Transformations"; // Initial tab
const DEFAULT_OBJECT = "cubeDraw";     // Initial object to draw
const MENU_SIZE = 0.33                 // Size of the bottom menu (percentage)

const ROTATE_SPEED = 0.3 // Speed of camera rotation (multiplier)
const ZOOM_SPEED = 0.9   // Speed of camera zoom (multiplier)


/*====================================
            HTML Functions
====================================*/

// Tab buttons handler
function openTab(tabName) 
{
    // Hide all tabs
    var tabContent = document.getElementsByClassName("tabContent");
    var tabLinks = document.getElementsByClassName("tabLinks");
    for (var i=0; i<tabContent.length; i++)
        tabContent[i].style.display = "none";
    for (var i=0; i<tabLinks.length; i++)
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");

    // Activate the requested tab and append 'active' to their class name
    document.getElementById(tabName+"Tab").style.display = "block";
    var elems = document.getElementsByClassName("tabLinks")
    for (var i=0; i<elems.length; i++)
    {
        if (elems[i].innerHTML == tabName)
        {
            elems[i].className += " active";
            break;
        }
    }
}

// Object radio button handler
function setDrawObject(func)
{
    objectDrawFunc = window[func];
    var elems = document.getElementsByName("objectSelect")
    for (var i=0; i<elems.length; i++)
    {
        if (elems[i].value == func)
        {
            elems[i].checked = "checked";
            break;
        }
    }
}

// Transformation sliders handler
function updateObjectMatrix()
{
    var sliderPosX = document.getElementById('objPosX').value
    var sliderPosY = document.getElementById('objPosY').value
    var sliderPosZ = document.getElementById('objPosZ').value
    var sliderAngX = document.getElementById('objAngX').value
    var sliderAngY = document.getElementById('objAngY').value
    var sliderAngZ = document.getElementById('objAngZ').value
    var sliderSclX = document.getElementById('objSclX').value
    var sliderSclY = document.getElementById('objSclY').value
    var sliderSclZ = document.getElementById('objSclZ').value
    
    modelMTX = mult(translate(sliderPosX, sliderPosY, sliderPosZ), 
                        mult(rotateX(sliderAngX),
                        mult(rotateY(sliderAngY),
                        mult(rotateZ(sliderAngZ),
                        scalem(sliderSclX, sliderSclY, sliderSclZ)
               ))));
}

// Reset transformations button handler
function resetObjectMatrix()
{
    document.getElementById('objPosX').value = 0;
    document.getElementById('objPosY').value = 0;
    document.getElementById('objPosZ').value = 0;
    document.getElementById('objAngX').value = 0;
    document.getElementById('objAngY').value = 0;
    document.getElementById('objAngZ').value = 0;
    document.getElementById('objSclX').value = 1;
    document.getElementById('objSclY').value = 1;
    document.getElementById('objSclZ').value = 1;
        
    updateObjectMatrix();
}

// Super quad slider handler
function updateSuperQuad()
{
    var e1 = document.getElementById('superQuadE1').value
    var e2 = document.getElementById('superQuadE2').value
    superquadBuild(e1, e2)
}


/*====================================
            Event Handlers
====================================*/

// Update the canvas to fit the window
function resizeCanvas() 
{
    // Get the current window size
    var program = gl.getParameter(gl.CURRENT_PROGRAM);
    var canvas = document.getElementById("gl-canvas");
    var w = window.innerWidth;
    var h = window.innerHeight*(1-MENU_SIZE);
    var aspect = w/h;

    // Resize the canvas and viewport
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);

    // Setup the view
    var at = [0, 0, 0];
    var eye = [1, 1, 1];
    var up = [0, 1, 0];
    mView = lookAt(eye, at, up);
    mView = mult(rotateX(camera_yaw), rotateY(camera_pitch));
    mProjection = ortho(-1*aspect*zoom, 1*aspect*zoom, -1*zoom, 1*zoom, -10, 10);
    
    // Update the view and projection matricies
    var mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));
    var mViewLoc = gl.getUniformLocation(program, "mView");
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
}

// What to do when a key is pressed
function handleKeyDown(e)
{
    var key = e.key;

    // Toggle autofire if we pressed the spacebar
    if (key == "f")
        wireframe_enabled = false;
    if (key == "w")
        wireframe_enabled = true;
    if (key == "z")
        zbuffer_enabled = !zbuffer_enabled;    
    if (key == "b")
        culling_enabled = !culling_enabled;    
}

// What to do when the mouse is scrolled
function handleCameraZoom(e)
{
    // Update the zoom based on the mouse wheel
    (e.deltaY  > 0) ? zoom /= ZOOM_SPEED : zoom *= ZOOM_SPEED;
    
    // Don't allow for negative zoom
    if (zoom <= 0.001)
        zoom = 0.001;
        
    // Update the view
    resizeCanvas();
    
    // Prevent the page from scrolling
    return false;
}

// What to do when the mouse is pressed
function handleMouseDown(e)
{
    var leftclick = e.button == 0;
    var midclick = e.button == 1;
    var rightclick = e.button == 2;
    
    if (leftclick)
        mouse_down = true;
}

// What to do when the mouse is released
function handleMouseUp(e)
{
    var leftclick = e.button == 0;
    var midclick = e.button == 1;
    var rightclick = e.button == 2;
    
    if (leftclick)
        mouse_down = false;
}

// What to do when the mouse is moved
function handleMouseMove(e)
{
    if (mouse_down)
    {
        camera_pitch += e.movementX*ROTATE_SPEED;
        camera_yaw += e.movementY*ROTATE_SPEED;
        resizeCanvas();
    }
}

// What to do when the mouse leaves the window
function handleMouseOut(e)
{
    mouse_down = false;
}


/*====================================
         WebGL Initialization
====================================*/

// Initialize the page
window.onload = function init() 
{
    // Create the canvas which we will be rendering into
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl)
        alert("WebGL isn't available");
    
    // Set the initial settings
    openTab("Transformations");
    setDrawObject(DEFAULT_OBJECT);
    
    // Configure the viewport and wipe the framebuffer with a color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.25, 0.25, 0.25, 1.0);
    
    // Attach the vertex and fragment shader to our program
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Resive the canvas
    resizeCanvas();
    
    // Initialize the 3D shapes
    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    bunnyInit(gl);
    superquadInit(gl);
    
    // Setup event listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('wheel', handleCameraZoom);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    
    resetObjectMatrix();
    
    // Render the model
    render();
}


/*====================================
              Rendering
====================================*/

// Change the text on the top left
function renderText()
{
    var textElement = document.getElementById("text");
    textElement.textContent = "Zoom: "+zoom.toFixed(3)+"\nWireframe: "+wireframe_enabled+"\nZ-Buffer: "+zbuffer_enabled+"\nCulling: "+culling_enabled;
}

// Render onto the canvas
function render() 
{
    var program = gl.getParameter(gl.CURRENT_PROGRAM);
    
    // Clear the framebuffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use the depth buffer if enabled
    if (zbuffer_enabled)
        gl.enable(gl.DEPTH_TEST);
    else
        gl.disable(gl.DEPTH_TEST);
    
    // Use the depth buffer if enabled
    if (culling_enabled)
        gl.enable(gl.CULL_FACE);
    else
        gl.disable(gl.CULL_FACE);
    gl.cullFace(gl.BACK)
    
    // Transform the shape
    var mModelLoc = gl.getUniformLocation(program, "mModel");
    gl.uniformMatrix4fv(mModelLoc, false, flatten(modelMTX));

    // Draw the shape
    objectDrawFunc(gl, program, !wireframe_enabled)
    renderText()

    // Redraw the scene
    window.requestAnimFrame(render);
}