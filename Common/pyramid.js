pyramid_vertices = [
    vec3(-0.5, -0.5, +0.5),     // 0
    vec3(-0.5, -0.5, -0.5),     // 1
    vec3(+0.5, -0.5, -0.5),     // 2
    vec3(+0.5, -0.5, +0.5),     // 3
    vec3(+0.0, +0.5, +0.0),     // 4
];

var pyramid_points = [];
var pyramid_normals = [];
var pyramid_faces = [];
var pyramid_edges = [];

var pyramid_points_buffer;
var pyramid_normals_buffer;
var pyramid_faces_buffer;
var pyramid_edges_buffer;

function pyramidInit(gl) {
    pyramidBuild();
    pyramidUploadData(gl);
}

function pyramidBuild()
{
    // Add the verticies
    pyramid_points.push(pyramid_vertices[0]);
    pyramid_points.push(pyramid_vertices[1]);
    pyramid_points.push(pyramid_vertices[2]);
    pyramid_points.push(pyramid_vertices[3]);
    pyramid_points.push(pyramid_vertices[4]);
    for(var i=0; i<4; i++)
        pyramid_normals.push(vec3(0, -1, 0));
    pyramid_normals.push(vec3(0, 1, 0));
    
    // Add the edges
    pyramid_edges.push(0);    
    pyramid_edges.push(1);    
    pyramid_edges.push(1);    
    pyramid_edges.push(2);    
    pyramid_edges.push(2);    
    pyramid_edges.push(3);    
    pyramid_edges.push(3);    
    pyramid_edges.push(0);
    for(var i=0; i<4; i++)
    {
        pyramid_edges.push(i);
        pyramid_edges.push(4);
    }
    
    // Add the faces
    pyramid_faces.push(0);
    pyramid_faces.push(1);
    pyramid_faces.push(2);
    pyramid_faces.push(0);
    pyramid_faces.push(2);
    pyramid_faces.push(3);
    
    pyramid_faces.push(2);
    pyramid_faces.push(3);
    pyramid_faces.push(4);
    
    pyramid_faces.push(3);
    pyramid_faces.push(0);
    pyramid_faces.push(4);
    
    pyramid_faces.push(0);
    pyramid_faces.push(1);
    pyramid_faces.push(4);    
    
    pyramid_faces.push(1);
    pyramid_faces.push(2);
    pyramid_faces.push(4);
}

function pyramidUploadData(gl)
{
    pyramid_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramid_points), gl.STATIC_DRAW);
    
    pyramid_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pyramid_normals), gl.STATIC_DRAW);
    
    pyramid_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(pyramid_faces), gl.STATIC_DRAW);
    
    pyramid_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(pyramid_edges), gl.STATIC_DRAW);
}

function pyramidDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_edges_buffer);
    gl.drawElements(gl.LINES, pyramid_edges.length, gl.UNSIGNED_BYTE, 0);
}

function pyramidDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pyramid_faces_buffer);
    gl.drawElements(gl.TRIANGLES, pyramid_faces.length, gl.UNSIGNED_BYTE, 0);
}