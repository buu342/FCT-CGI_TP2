var superquad_points = [];
var superquad_normals = [];
var superquad_faces = [];
var superquad_edges = [];

var superquad_points_buffer;
var superquad_normals_buffer;
var superquad_faces_buffer;
var superquad_edges_buffer;

var SUPERQUAD_E1 = 1;
var SUPERQUAD_E2 = 1;
var SUPERQUAD_LATS = 20;
var SUPERQUAD_LONS = 30;

// Initialize the superquad creation routine
function superquadInit(gl, e1, e2) {
    e1 = e1 | SUPERQUAD_E1;
    e2 = e2 | SUPERQUAD_E2;
    superquadBuild(e1, e2);
}

// Generate the superquad
function superquadBuild(e1, e2) 
{
    var d_phi = Math.PI / SUPERQUAD_LATS;
    var d_theta = 2*Math.PI / SUPERQUAD_LONS;
    var r = 0.5;
    
    // Clean up the arrays
    superquad_points = [];
    superquad_normals = [];
    superquad_faces = [];
    superquad_edges = [];
    
    // Generate north polar cap
    var north = vec3(0, -r, 0);
    superquad_points.push(north);
    superquad_normals.push(vec3(0,-1,0));
    
    // Generate middle
    for(var i=0, phi=0; i<SUPERQUAD_LATS; i++, phi+=d_phi) {
        for(var j=0, the=Math.PI/4; j<SUPERQUAD_LONS; j++, the+=d_theta) {
            var pt = vec3(
                -r * Math.sign(Math.cos(the)) * Math.sign(Math.sin(phi)) * Math.pow(Math.abs(Math.cos(the)), e1) * Math.pow(Math.abs(Math.sin(phi)), e2),
                -r * Math.sign(Math.cos(phi)) * Math.pow(Math.abs(Math.cos(phi)), e2),
                -r * Math.sign(Math.sin(phi)) * Math.sign(Math.sin(the)) * Math.pow(Math.abs(Math.sin(the)), e1) * Math.pow(Math.abs(Math.sin(phi)), e2)
            );
            superquad_points.push(pt);
            var n = vec3(pt);
            superquad_normals.push(normalize(n));
        }
    }
    
    // Generate north/south cap
    var south = vec3(0,r,0);
    superquad_points.push(south);
    superquad_normals.push(vec3(0,1,0));
    
    
    // -- Generate the faces -- \\
    
    // north pole faces
    for(var i=0; i<SUPERQUAD_LONS-1; i++) {
        superquad_faces.push(0);
        superquad_faces.push(i+2);
        superquad_faces.push(i+1);
    }
    superquad_faces.push(0);
    superquad_faces.push(1);
    superquad_faces.push(SUPERQUAD_LONS);
    
    // general middle faces
    var offset=1;
    
    for(var i=0; i<SUPERQUAD_LATS-1; i++) {
        for(var j=0; j<SUPERQUAD_LONS-1; j++) {
            var p = offset+i*SUPERQUAD_LONS+j;
            superquad_faces.push(p);
            superquad_faces.push(p+SUPERQUAD_LONS+1);
            superquad_faces.push(p+SUPERQUAD_LONS);
            
            superquad_faces.push(p);
            superquad_faces.push(p+1);
            superquad_faces.push(p+SUPERQUAD_LONS+1);
        }
        var p = offset+i*SUPERQUAD_LONS+SUPERQUAD_LONS-1;
        superquad_faces.push(p);
        superquad_faces.push(p+1);
        superquad_faces.push(p+SUPERQUAD_LONS);

        superquad_faces.push(p);
        superquad_faces.push(p-SUPERQUAD_LONS+1);
        superquad_faces.push(p+1);
    }
    
    // south pole faces
    var offset = 1 + (SUPERQUAD_LATS-1) * SUPERQUAD_LONS;
    for(var j=0; j<SUPERQUAD_LONS-1; j++) {
        superquad_faces.push(offset+SUPERQUAD_LONS);
        superquad_faces.push(offset+j);
        superquad_faces.push(offset+j+1);
    }
    superquad_faces.push(offset+SUPERQUAD_LONS);
    superquad_faces.push(offset+SUPERQUAD_LONS-1);
    superquad_faces.push(offset);
 
    // Build the edges
    for(var i=0; i<SUPERQUAD_LONS; i++) {
        superquad_edges.push(0);   // North pole 
        superquad_edges.push(i+1);
    }

    for(var i=0; i<SUPERQUAD_LATS; i++, p++) {
        for(var j=0; j<SUPERQUAD_LONS;j++, p++) {
            var p = 1 + i*SUPERQUAD_LONS + j;
            superquad_edges.push(p);   // horizontal line (same latitude)
            if(j!=SUPERQUAD_LONS-1) 
                superquad_edges.push(p+1);
            else superquad_edges.push(p+1-SUPERQUAD_LONS);
            
            if(i!=SUPERQUAD_LATS-1) {
                superquad_edges.push(p);   // vertical line (same longitude)
                superquad_edges.push(p+SUPERQUAD_LONS);
            }
            else {
                superquad_edges.push(p);
                superquad_edges.push(superquad_points.length-1);
            }
        }
    }
    
    superquadUploadData(gl);
}

// Upload data to the buffers
function superquadUploadData(gl)
{
    superquad_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(superquad_points), gl.STATIC_DRAW);
    
    superquad_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(superquad_normals), gl.STATIC_DRAW);
    
    superquad_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superquad_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(superquad_faces), gl.STATIC_DRAW);
    
    superquad_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superquad_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(superquad_edges), gl.STATIC_DRAW);
}

// Draw the points on the model. For debugging
function superquadDrawPoints(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.drawArrays(gl.POINTS, 0, superquad_points.length);
}

// Draw a wireframe mesh of the model
function superquadDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superquad_edges_buffer);
    gl.drawElements(gl.LINES, superquad_edges.length, gl.UNSIGNED_SHORT, 0);
}

// Draw the model with visible faces
function superquadDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, superquad_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, superquad_faces_buffer);
    gl.drawElements(gl.TRIANGLES, superquad_faces.length, gl.UNSIGNED_SHORT, 0);
}

// Draw the model
function superquadDraw(gl, program, filled=false) {
	if(filled) superquadDrawFilled(gl, program);
	else superquadDrawWireFrame(gl, program);
}