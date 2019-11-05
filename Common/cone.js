const CONE_RESOLUTION = 32;
const CONE_SCALE = 0.5;

var cone_points = [];
var cone_normals = [];
var cone_edges = [];

var cone_points_buffer;
var cone_normals_buffer;
var cone_edges_buffer;

function coneInit(gl) {
    coneBuild();
    coneUploadData(gl);
}

function coneBuild()
{
    // Generate cone bottom
    for (i=0; i<CONE_RESOLUTION; i++)
        cone_points.push(vec3(Math.cos((i/CONE_RESOLUTION)*Math.PI*2)*CONE_SCALE, -0.5, Math.sin((i/CONE_RESOLUTION)*Math.PI*2)*CONE_SCALE));
    cone_points.push(vec3(0, 0.5, 0));
    for (i=0; i<CONE_RESOLUTION; i++)
    {
        cone_edges.push(i)
        cone_edges.push((i+1)%CONE_RESOLUTION)
        cone_edges.push(i)
        cone_edges.push(cone_points.length-1)
    }
    
    // Generate normals
    for(var i=0; i<cone_points.length; i++)
        cone_normals.push(vec3(0,0,0));
}

function coneUploadData(gl)
{
    cone_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cone_points), gl.STATIC_DRAW);
    
    cone_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(cone_normals), gl.STATIC_DRAW);
    
    cone_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cone_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(cone_edges), gl.STATIC_DRAW);
}

function coneDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, cone_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cone_edges_buffer);
    gl.drawElements(gl.LINES, cone_edges.length, gl.UNSIGNED_BYTE, 0);
}
