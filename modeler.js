/**
 * CGI Project 2 - Model Viewer
 * By Lourenço Soares (54530)
 */
 
 
/*====================================
           Global Variables
====================================*/

// WebGL    
var gl;
var aspect;
var drawFunc;
var projectionFunc, projectionArgs;
var mModel = mat4();
var mView, mProjection;

// Camera globals
var zoom;
var camera_pitch;
var camera_yaw;
var camera_free;
var mouse_down = false;

// Render settings globals
var wireframe_enabled = true;
var zbuffer_enabled = false;
var culling_enabled = false;


/*====================================
          Program Constants
   Change to customize the program
====================================*/

const DEFAULT_TAB = "TransformationsTab";  // Initial tab (tabContent id)
const DEFAULT_VIEW = "AxonometricDimetric";// Initial view (ProjectionsTab radio name)
const DEFAULT_OBJECT = "cubeDraw";         // Initial object to draw (ModelsTab radio value)

const MENU_SIZE = 0.33;    // Size of the bottom menu (percentage)
const SELECT_FREE = false; // Select the "Free" mode automatically if a slider is changed

const DEFAULT_ZOOM = 1;       // Default amount of zoom
const ZOOM_SPEED = 0.9;       // Speed of camera zoom (multiplier)
const CAMERA_FREEMOVE = true; // Allow free camera movement with the mouse?
const ROTATE_SPEED = 0.3;     // Speed of camera rotation (multiplier)


/*====================================
           Helper Functions
====================================*/

// Convert a radian angle to degrees
function degrees(angle)
{
    return angle*180/Math.PI;
}


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
    document.getElementById(tabName).style.display = "block";
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

// Tab buttons handler
function openView(viewName) 
{
    // Hide all tabs
    var viewContent = document.getElementsByClassName("viewContent");
    var viewLinks = document.getElementsByClassName("viewLinks");
    for (var i=0; i<viewContent.length; i++)
        viewContent[i].style.display = "none";
    for (var i=0; i<viewLinks.length; i++)
        viewLinks[i].className = viewLinks[i].className.replace(" active", "");
    
    // Activate the requested tab and append 'active' to their class name
    document.getElementById(viewName).style.display = "block";
    var elems = document.getElementsByClassName("viewLinks")
    for (var i=0; i<elems.length; i++)
    {
        if (elems[i].innerHTML == viewName)
        {
            elems[i].className += " active";
            break;
        }
    }
    
    // Execute the requested tab
    var views = document.getElementById(viewName).childNodes[1].childNodes[1].childNodes
    for (var i=0; i<views.length; i+=2)
        if (views[i].childNodes[0].childNodes[0].type === "radio" && views[i].childNodes[0].childNodes[0].checked)
            views[i].childNodes[0].childNodes[0].oninput();
}

// Axonometric slider limiter
function axonSliderLimit(sliderName)
{
    var thisSlider = document.getElementById(sliderName);
    var otherSlider = document.getElementById(sliderName === "AxonometricFreeA" ? "AxonometricFreeB" : "AxonometricFreeA");

    // Force the sum of the two sliders to be 90 or less
    if ((+thisSlider.value) + (+otherSlider.value) > 90)
        otherSlider.value = 90-thisSlider.value;
}

// Object radio button handler
function setDrawFunction(func)
{
    // Assign the draw function based on the input
    drawFunc = window[func];
    
    // Select the radio button that corresponds to the input
    var elems = document.getElementsByName("drawSelect")
    for (var i=0; i<elems.length; i++)
    {
        if (elems[i].value === drawFunc.name)
        {
            elems[i].checked = true;
            break;
        }
    }
}

// View radio button handler
function setProjectionFunction(func, args, resetCam)
{
	// Reset the camera
    if (resetCam == null || !resetCam)
    {
        camera_pitch = 0;
        camera_yaw = 0;
    }
	
	// Assign the function to call
    projectionFunc = func;
    projectionArgs = args;
	
    // Update the view
    updateCanvas()
}

// Transformation sliders handler
function updateObjectMatrix()
{
    var sliderPosX = +document.getElementById('objPosX').value
    var sliderPosY = +document.getElementById('objPosY').value
    var sliderPosZ = +document.getElementById('objPosZ').value
    var sliderAngX = +document.getElementById('objAngX').value
    var sliderAngY = +document.getElementById('objAngY').value
    var sliderAngZ = +document.getElementById('objAngZ').value
    var sliderSclX = +document.getElementById('objSclX').value
    var sliderSclY = +document.getElementById('objSclY').value
    var sliderSclZ = +document.getElementById('objSclZ').value
    
    mModel = mult(translate(sliderPosX, sliderPosY, sliderPosZ), 
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
    var e1 = +document.getElementById('superQuadE1').value
    var e2 = +document.getElementById('superQuadE2').value
    superquadBuild(e1, e2)
}

// File picker handler
function handleOBJImport(evt)
{
    OBJInit(gl, evt.target.files[0]);
}


/*====================================
            Event Handlers
====================================*/

// Update the canvas to fit the window
function updateCanvas() 
{
    // Get the current window size
    var program = gl.getParameter(gl.CURRENT_PROGRAM);
    var canvas = document.getElementById("gl-canvas");
    var w = window.innerWidth;
    var h = window.innerHeight*(1-MENU_SIZE);
    aspect = w/h;

    // Resize the canvas and viewport
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);

    // Setup the view and projection matricies
    var newView = projectionFunc(projectionArgs);
    mView = (newView != null) ? newView : mView;
    mView = mult(mView, mult(rotateX(camera_yaw), rotateY(camera_pitch)));
    mProjection = orthographicCube();
    
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
	if (key == " " && CAMERA_FREEMOVE)
        camera_free = !camera_free;
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
    updateCanvas();
    
    // Prevent the page from scrolling
    return false;
}

// What to do when the mouse is pressed
function handleMouseDown(e)
{
    var leftclick = e.button == 0;
    var midclick = e.button == 1;
    var rightclick = e.button == 2;
    
    if (leftclick && CAMERA_FREEMOVE)
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
    if (mouse_down && camera_free)
    {
        camera_pitch += e.movementX*ROTATE_SPEED;
        camera_yaw += e.movementY*ROTATE_SPEED;
        updateCanvas();
    }
}

// What to do when the mouse leaves the window
function handleMouseOut(e)
{
    mouse_down = false;
}


/*====================================
        Program Initialization
====================================*/

// Initialize the view tabs and select the default value
function InitializeViewTabs()
{
    var projectTab = document.getElementById("ProjectionsTab");
    var innerTabs = [];
    
    // Get a list of all the view tabs
    for (var i=0; i<projectTab.childNodes.length; i++)
        if (document.getElementById("ProjectionsTab").childNodes[i].tagName === "BUTTON")
            innerTabs.push(document.getElementById("ProjectionsTab").childNodes[i]);
    
    // Check the default radio buttons for each category
    for (var i=0; i<innerTabs.length; i++)
        document.getElementById(innerTabs[i].value).checked = true
    
    // Open the default view tab (this code looks really silly)
    openView(document.getElementById(DEFAULT_VIEW).parentNode.parentNode.parentNode.parentNode.parentNode.id);
}


// Initialize the page
window.onload = function init() 
{
    // Create the canvas which we will be rendering into
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl)
        alert("WebGL isn't available");
    
    // Hide all tabs
    var tabContent = document.getElementsByClassName("tabContent");
    var tabLinks = document.getElementsByClassName("tabLinks");
    for (var i=0; i<tabContent.length; i++)
        tabContent[i].style.display = "none";
    for (var i=0; i<tabLinks.length; i++)
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    tabContent = document.getElementsByClassName("viewContent");
    tabLinks = document.getElementsByClassName("viewLinks");
    for (var i=0; i<tabContent.length; i++)
        tabContent[i].style.display = "none";
    for (var i=0; i<tabLinks.length; i++)
        tabLinks[i].className = tabLinks[i].className.replace(" active", "");
    
    // Configure the viewport and wipe the framebuffer with a color
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.25, 0.25, 0.25, 1.0);
    
    // Attach the vertex and fragment shader to our program
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    // Set the global variables
	camera_free = CAMERA_FREEMOVE;
	zoom = DEFAULT_ZOOM;

    // Set the initial program settings
    resetObjectMatrix();
    openTab(DEFAULT_TAB);
    setDrawFunction(DEFAULT_OBJECT);
    InitializeViewTabs();
    
    // Initialize the 3D shapes
    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);
    torusInit(gl);
    bunnyInit(gl);
    superquadInit(gl);
    errorInit(gl);
    
    // Setup event listeners
    window.addEventListener('resize', updateCanvas);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('wheel', handleCameraZoom);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    document.getElementById('objFilePicker').addEventListener('change', handleOBJImport);
    
    // Render the model
    render();
}


/*====================================
             Camera Views
====================================*/

// Generates a cube matrix for use with orthographic projection
function orthographicCube()
{
    // Define the shape of the cube
    var left = -1*aspect*zoom;
    var right = 1*aspect*zoom;
    var bottom = -1*zoom;
    var top =1*zoom ;
    var near = -10;
    var far = 10;
    var w = right-left;
    var h = top-bottom;
    var d = far-near;

    // Create a matrix for the cube's projection
    var result = mat4();
    result[0][0] = 2.0/w;
    result[1][1] = 2.0/h;
    result[2][2] = -2.0/d;
    result[0][3] = -(left + right)/w;
    result[1][3] = -(top + bottom)/h;
    result[2][3] = -(near + far)/d;
    
    // Return the matrix
    return result;
}

// Orthograpic view matrix generator
// Arguments - A rotation matrix
function viewOrtho(args)
{
    return mult(mat4(), args);
}

// Oblique view matrix generator
// Arguments - An array with the first index being ratio, second being angle
function viewOblique(args)
{
    // If we don't have any arguments, assume we're using "Free" mode
    if (!args)
    {
        args = [+document.getElementById('obliqueFreeRatio').value, +document.getElementById('obliqueFreeAngle').value]

        // Select the radio button that corresponds to "Free"
        var elems = document.getElementsByName("projectionSelectOblique")
        for (var i=0; i<elems.length; i++)
        {
            if (elems[i].id == "ObliqueFree") 
            {
                if (!elems[i].checked && !SELECT_FREE)
                    return;
                elems[i].checked = true;
                document.getElementById('obliqueFreeRatio').disabled = false;
                document.getElementById('obliqueFreeAngle').disabled = false;
                break;
            }
        }
    }
    else if (!SELECT_FREE)
    {
        // Disable the sliders
        document.getElementById('obliqueFreeRatio').disabled = true;
        document.getElementById('obliqueFreeAngle').disabled = true;
    }
    
    // Get the ratio and angle from the arguments
    var ratio = args[0];
    var angle = args[1];

    // Create the matrix
    var oblique = mat4();
    oblique[0][2] = -ratio*Math.cos(radians(angle));
    oblique[1][2] = -ratio*Math.sin(radians(angle));

    // Return the oblique view matrix
    return oblique;
}

// Axonometric view matrix generator
// Arguments - An array with the first index being A, second being B
function viewAxonometric(args)
{
    // If we don't have any arguments, assume we're using "Free" mode
    if (!args)
    {
        args = [+document.getElementById('AxonometricFreeA').value, +document.getElementById('AxonometricFreeB').value]
        
        // Select the radio button that corresponds to "Free"
        var elems = document.getElementsByName("projectionSelectAxonometric")
        for (var i=0; i<elems.length; i++)
        {
            if (elems[i].id == "AxonometricFree") 
            {
                if (!elems[i].checked && !SELECT_FREE)
                    return;
                elems[i].checked = true;
                document.getElementById('AxonometricFreeA').disabled = false;
                document.getElementById('AxonometricFreeB').disabled = false;
                break;
            }
        }
    }
    else if (!SELECT_FREE)
    {
        // Disable the sliders
        document.getElementById('AxonometricFreeA').disabled = true;
        document.getElementById('AxonometricFreeB').disabled = true;
    }
    
    // Get the value of A and B from the arguments
    var A = args[0];
    var B = args[1];
    
    // Calculate theta and gamma
    var theta = Math.atan(Math.sqrt(Math.tan(radians(A))/Math.tan(radians(B))))-Math.PI/2;
    var gamma = Math.asin(Math.sqrt(Math.tan(radians(A))*Math.tan(radians(B))));
    
    // Return the axonometrix view matrix
    return mult(rotateX(degrees(gamma)), rotateY(degrees(theta)));
}

// Perspective view matrix generator
// Arguments - An array with the first index being D
function viewPersp(args)
{
    // Get the value of D from the slider if no argument was provided
    if (!args)
        args = [+document.getElementById('PerspD').value]
    
    // Get the value of D from the arguments
    var d = args[0]+zoom;
    
    // Generate the perspective view matrix
    var result = mat4();
    result[3][2] = -1/d;

    // Return the perspective view matrix
    return result;
}


/*====================================
              Rendering
====================================*/

// Change the text on the top left
function renderText()
{
    var textElement = document.getElementById("text");
    textElement.textContent = "Zoom: "+zoom.toFixed(3)+"\nWireframe: "+wireframe_enabled+"\nZ-Buffer: "+zbuffer_enabled+"\nCulling: "+culling_enabled
    if (CAMERA_FREEMOVE)
        textElement.textContent+="\nFree Camera: "+camera_free;
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
    gl.uniformMatrix4fv(mModelLoc, false, flatten(mModel));

    // Draw the shape
    drawFunc(gl, program, !wireframe_enabled)
    renderText()

    // Redraw the scene
    window.requestAnimFrame(render);
}