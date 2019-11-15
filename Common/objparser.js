/*
    Basic OBJ file parser
    
    Requires:
        - Vertex normals to be provided in the file
        - Triangulated faces
*/

var OBJ_points = [];
var OBJ_normals = [];
var OBJ_faces = [];
var OBJ_edges = [];

var OBJ_points_buffer;
var OBJ_normals_buffer;
var OBJ_faces_buffer;
var OBJ_edges_buffer;

var OBJ_ImportSuccess = false;

// Initialize the file and begin the object creation routine
function OBJInit(gl, file) {
    read = new FileReader();
    read.readAsBinaryString(file)
    read.onloadend = function(){
        
        OBJ_points = [];
        OBJ_normals = [];
        OBJ_faces = [];
        OBJ_edges = [];
        
        // Build the model and check it was successful
        if (OBJBuild(read.result) == null)
        {
            OBJ_ImportSuccess = false;
            return;
        }
        
        OBJUploadData(gl);
    }
}

// Build the object
function OBJBuild(file) 
{
    // Split the file by lines
    var i;
    lines = file.match(/[^\r\n]+/g);
    for (var i=0; i<lines.length; i++)
        lines[i] = lines[i].split(" ");
    
    // Read the file and store the data
    var tempverts = [];
    var tempnorms = [];
    var tempedges = [];
    var tempfaces = [];
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
                
                // Read the input and split the data
                face[0] = lines[i][1].split("/");
                face[1] = lines[i][2].split("/");
                face[2] = lines[i][3].split("/");
                
                // Check that the face has vertex, texture coordinates, and vertex normals data
                if (flatten(face).length != 9)
                {
                    alert("This model is missing data! Did you export with normals and texture coords enabled?");
                    return null
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

    // Return success!
    return true;
}

// Upload data to the buffers
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

// Draw the model
function OBJDraw(gl, program, filled=false) {
	if(filled) OBJDrawFilled(gl, program);
	else  OBJDrawWireFrame(gl, program);
}