/*
    Basic OBJ file parser
    
    Requires:
        - Triangulated faces
        - Vertex normals to be provided in the file
*/

var OBJ_points = [];
var OBJ_normals = [];
var OBJ_faces = [];
var OBJ_edges = [];

var OBJ_points_buffer;
var OBJ_normals_buffer;
var OBJ_faces_buffer;
var OBJ_edges_buffer;

var error_points = [];
var error_normals = [];
var error_faces = [];
var error_edges = [];

var error_points_buffer;
var error_normals_buffer;
var error_faces_buffer;
var error_edges_buffer;

var OBJ_ImportSuccess = false;

// Initialize the file and begin the object creation routine
function OBJInit(gl, file) {
    if (file == null)
        return;
    
    // Read the file
    read = new FileReader();
    read.readAsBinaryString(file)
    read.onloadend = function(){
        
        OBJ_points = [];
        OBJ_normals = [];
        OBJ_faces = [];
        OBJ_edges = [];
        
        // Build the model and check it was successful
        OBJ_ImportSuccess = false;
        if (OBJBuild(read.result) == true)
        {
            // If all is good, upload the data
            OBJ_ImportSuccess = true;
            OBJUploadData(gl);
            setDrawFunction("OBJDraw");
        }
        
    }
}

// Initialize the placeholder ERROR object
function errorInit(gl) {
    errorBuild()
    errorUploadData(gl);
}

// Build the object
function OBJBuild(file) 
{
    var i;
    var tempverts = [];
    var tempnorms = [];
    var tempedges = [];
    var tempfaces = [];
    
    // Split the file by lines
    lines = file.match(/[^\r\n]+/g);
    for (var i=0; i<lines.length; i++)
        lines[i] = lines[i].split(" ");
    
    // Read the file and store the data
    for (var i=0; i<lines.length; i++)
    {
        switch (lines[i][0])
        {
            case "v":
                tempverts.push(vec3(+lines[i][1],+lines[i][2],+lines[i][3]));
                break;            
            case "vn":
                tempnorms.push(vec3(+lines[i][1],+lines[i][2],+lines[i][3]));
                break;            
            case "f":
                var face = []
                
                // Check that there are three faces
                if (lines[i].length != 4)
                {
                    alert("This model is not triangulated!");
                    return false;
                }
                  
                // Read the input and split the data
                face[0] = lines[i][1].split("/");
                face[1] = lines[i][2].split("/");
                face[2] = lines[i][3].split("/");
                
                // Check that there are 3 values in the face (vertex, texture, and normal)
                if (face[0].length != 3)
                {
                    alert("This model is missing data! Did you export with normal coordinates enabled?");
                    return false;
                }

                // Push the data to the temp faces list
                tempfaces.push({vert: +face[0][0]-1, norm: +face[0][2]-1});
                tempfaces.push({vert: +face[1][0]-1, norm: +face[1][2]-1});
                tempfaces.push({vert: +face[2][0]-1, norm: +face[2][2]-1});
                break;
        }
    }
    
    // Build the points
    for (var i=0; i<tempfaces.length; i++)
    {
        OBJ_points.push(tempverts[tempfaces[i].vert]);
        OBJ_normals.push(tempnorms[tempfaces[i].norm]);
    }
    
    // Build the faces
    for (var i=0; i<tempfaces.length; i++)
    {
        for (var j=0; j<OBJ_points.length; j++)
        {
            if (tempverts[tempfaces[i].vert][0] == OBJ_points[j][0] && tempverts[tempfaces[i].vert][1] == OBJ_points[j][1] && tempverts[tempfaces[i].vert][2] == OBJ_points[j][2])
            {
                OBJ_faces.push(j);
                break;
            }
        }
    }
        
    // Read the edge data from the faces
    for (var i=0; i<OBJ_faces.length; i+=3)
    {
        tempedges.push(vec2(OBJ_faces[i], OBJ_faces[i+1]));
        tempedges.push(vec2(OBJ_faces[i+1], OBJ_faces[i+2]));
        tempedges.push(vec2(OBJ_faces[i+2], OBJ_faces[i]));
    }       

    // Build the edges, culling duplicate edges
    OBJ_edges.push(tempedges[0]);
    for (var i=1; i<tempedges.length; i++)
    {
        var dup = false;
        for (var j=0; j<OBJ_edges.length; j++)
        {
            if (((tempedges[i][0] == OBJ_edges[j][0] && tempedges[i][1] == OBJ_edges[j][1]) || (tempedges[i][0] == OBJ_edges[j][1] && tempedges[i][1] == OBJ_edges[j][0])))
            {
                dup = true;
                break;
            }
        }
        if (!dup)
            OBJ_edges.push(tempedges[i]);
    }
    OBJ_edges = flatten(OBJ_edges);
    
    // Check for problems
    if (OBJ_points.length == 0 || OBJ_faces.length == 0)
    {
        alert("This is not an OBJ model.");
        return false;
    }
    
    // Return success!
    return true;
}

// Build the error
function errorBuild() 
{
    var tempedges = [];
    
    // Build the verts and normals
    for (var i=0; i<errormdl_verts.length; i+=3)
    {
        error_points.push(vec3(errormdl_verts[i], errormdl_verts[i+1], errormdl_verts[i+2]));
        error_normals.push(vec3(1.0*Math.abs(errormdl_verts[i+2]/0.228643), 0.0, 0.0)); // Always red, because red is scary and errors are scary!
    }
    
    // Build the faces
    for (var i=0; i<errormdl_faces.length; i++)
        error_faces.push(errormdl_faces[i]);
    
     // Read the edge data from the faces
    for (var i=0; i<error_faces.length; i+=3)
    {
        tempedges.push(vec2(error_faces[i], error_faces[i+1]));
        tempedges.push(vec2(error_faces[i+1], error_faces[i+2]));
        tempedges.push(vec2(error_faces[i+2], error_faces[i]));
    }       

    // Build the edges, culling duplicate edges
    error_edges.push(tempedges[0]);
    for (var i=1; i<tempedges.length; i++)
    {
        var dup = false;
        for (var j=0; j<error_edges.length; j++)
        {
            if (((tempedges[i][0] == error_edges[j][0] && tempedges[i][1] == error_edges[j][1]) || (tempedges[i][0] == error_edges[j][1] && tempedges[i][1] == error_edges[j][0])))
            {
                dup = true;
                break;
            }
        }
        if (!dup)
            error_edges.push(tempedges[i]);
    }
    error_edges = flatten(error_edges);
}

// Upload object data to the buffers
function OBJUploadData(gl)
{
    OBJ_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(OBJ_points), gl.STATIC_DRAW);
    
    OBJ_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(OBJ_normals), gl.STATIC_DRAW);
    
    OBJ_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, OBJ_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(OBJ_faces), gl.STATIC_DRAW);
    
    OBJ_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, OBJ_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(OBJ_edges), gl.STATIC_DRAW);
}

// Upload error data to the buffers
function errorUploadData(gl)
{
    error_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, error_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(error_points), gl.STATIC_DRAW);
    
    error_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, error_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(error_normals), gl.STATIC_DRAW);
    
    error_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, error_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(error_faces), gl.STATIC_DRAW);
    
    error_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, error_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(error_edges), gl.STATIC_DRAW);
}

// Draw the points on the model. For debugging
function OBJDrawPoints(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.drawArrays(gl.POINTS, 0, OBJ_points.length);
}

// Draw a wireframe mesh of the model
function OBJDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, OBJ_edges_buffer);
    gl.drawElements(gl.LINES, OBJ_edges.length, gl.UNSIGNED_SHORT, 0);
}

// Draw a wireframe mesh of the error
function errorDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, error_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, error_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, error_edges_buffer);
    gl.drawElements(gl.LINES, error_edges.length, gl.UNSIGNED_SHORT, 0);
}

// Draw the model with visible faces
function OBJDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, OBJ_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, OBJ_faces_buffer);
    gl.drawElements(gl.TRIANGLES, OBJ_faces.length, gl.UNSIGNED_SHORT, 0);
}

// Draw the error with visible faces
function errorDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, error_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, error_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, error_faces_buffer);
    gl.drawElements(gl.TRIANGLES, error_faces.length, gl.UNSIGNED_SHORT, 0);
}

// Draw the model
function OBJDraw(gl, program, filled=false) {
    // Show the model if the import was successful, otherwise show the ERROR model
    if (OBJ_ImportSuccess)
    {
        if(filled) OBJDrawFilled(gl, program);
        else  OBJDrawWireFrame(gl, program);
    }
    else
    {
        if(filled) errorDrawFilled(gl, program);
        else  errorDrawWireFrame(gl, program);
    }
}