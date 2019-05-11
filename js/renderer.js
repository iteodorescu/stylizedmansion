"use strict";
var Reflection = Reflection || {
  ambient: new Pixel(0, 0, 0),
  diffuse: new Pixel(1.0, 1.0, 1.0),
  specular: new Pixel(1.0, 1.0, 1.0),
  shininess: 20,
};

Reflection.phongReflectionModel = function(vertex, view, normal, lightPos, phongMaterial) {
  var color = new Pixel(0, 0, 0);
  normal.normalize();

  // diffuse
  var light_dir = new THREE.Vector3().subVectors(lightPos, vertex).normalize();
  var ndotl = normal.dot(light_dir);
  color.plus(phongMaterial.diffuse.copy().multipliedBy(ndotl));

  // Ambient color and specular color
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 12 lines of code.
  // const v = new THREE.Vector3().subVectors(vertex, view).normalize();
  // const r = light_dir.reflect(normal)

  // const vdotrton = Math.pow(v.dot(r), phongMaterial.shininess);

  // color = color.plus(phongMaterial.specular.copy().multipliedBy(vdotrton))
  // //color.clamp();

  // color = color.plus(phongMaterial.ambient)

  // color.clamp();
  // ----------- STUDENT CODE END ------------

  return color;
};

var Renderer = Renderer || {
  meshInstances: new Set(),
  width: window.innerWidth,
  height: window.innerHeight,
  negNear: 0.3,
  negFar: 1000,
  fov: 45,
  lightPos: new THREE.Vector3(10, 10, -10),
  shaderMode: "",
  cameraLookAtVector: new THREE.Vector3(0, 0, 0),
  cameraPosition: new THREE.Vector3(0, 0, -10),
  cameraUpVector: new THREE.Vector3(0, -1, 0),
  cameraUpdated: true,
};

Renderer.updateCameraParameters = function() {
  this.camera.position.copy(this.cameraPosition);
  this.camera.up.copy(this.cameraUpVector);
  this.camera.lookAt(this.cameraLookAtVector);
};

Renderer.initialize = function() {
  this.buffer = new Image(this.width, this.height);
  this.zBuffer = [];

  // set camera
  this.camera = new THREE.PerspectiveCamera(
    this.fov,
    this.width / this.height,
    this.negNear,
    this.negFar
  );
  this.updateCameraParameters();

  this.clearZBuffer();
  this.buffer.display(); // initialize canvas
};

Renderer.clearZBuffer = function() {
  for (var x = 0; x < this.width; x++) {
    this.zBuffer[x] = new Float32Array(this.height);
    for (var y = 0; y < this.height; y++) {
      this.zBuffer[x][y] = 1; // z value is in [-1 1];
    }
  }
};

Renderer.addMeshInstance = function(meshInstance) {
  assert(meshInstance.mesh, "meshInstance must have mesh to be added to renderer");
  this.meshInstances.add(meshInstance);
};

Renderer.removeMeshInstance = function(meshInstance) {
  this.meshInstances.delete(meshInstance);
};

Renderer.clear = function() {
  this.buffer.clear();
  this.clearZBuffer();
  Main.context.clearRect(0, 0, Main.canvas.width, Main.canvas.height);
};

Renderer.displayImage = function() {
  this.buffer.display();

};

Renderer.render = function() {
  this.clear();

  var eps = 0.01;
  if (
    !(
      this.cameraUpVector.distanceTo(this.camera.up) < eps &&
      this.cameraPosition.distanceTo(this.camera.position) < eps &&
      this.cameraLookAtVector.distanceTo(Main.controls.target) < eps
    )
  ) {
    this.cameraUpdated = false;
    // update camera position
    this.cameraLookAtVector.copy(Main.controls.target);
    this.cameraPosition.copy(this.camera.position);
    this.cameraUpVector.copy(this.camera.up);
  } else {
    // camera's stable, update url once
    if (!this.cameraUpdated) {
    //   Gui.updateUrl();
      this.cameraUpdated = true; //update one time
    }
  }

  this.camera.updateMatrixWorld();
  this.camera.matrixWorldInverse.getInverse(this.camera.matrixWorld);

  // light goes with the camera, COMMENT this line for debugging if you want
  this.lightPos = this.camera.position;

  for (var meshInst of this.meshInstances) {
    var mesh = meshInst.mesh;
    if (mesh !== undefined) {
      for (var faceIdx = 0; faceIdx < mesh.faces.length; faceIdx++) {
        var face = mesh.faces[faceIdx];
        var verts = [mesh.vertices[face.a], mesh.vertices[face.b], mesh.vertices[face.c]];
        var vert_normals = [
          mesh.vertex_normals[face.a],
          mesh.vertex_normals[face.b],
          mesh.vertex_normals[face.c],
        ];

        // camera's view matrix = K * [R | t] where K is the projection matrix and [R | t] is the inverse of the camera pose
        var viewMat = new THREE.Matrix4().multiplyMatrices(
          this.camera.projectionMatrix,
          this.camera.matrixWorldInverse
        );

        Renderer.drawTriangle(verts, vert_normals, mesh.uvs[faceIdx], meshInst.material, viewMat);
      }
    }
  }
//   this.buffer.blur(3);
  this.displayImage();
  // if(painterly){
    //call blur on buffer
   
  // }
   //this.displayImage();
};

Renderer.getPhongMaterial = function(uv_here, material) {
  var phongMaterial = {};
  phongMaterial.ambient = Reflection.ambient;

  if (material.diffuse === undefined || uv_here === undefined) {
    phongMaterial.diffuse = Reflection.diffuse;
  } else if (Pixel.prototype.isPrototypeOf(material.diffuse)) {
    phongMaterial.diffuse = material.diffuse;
  } else {
    // note that this function uses point sampling. it would be better to use bilinear
    // subsampling and mipmaps for area sampling, but this good enough for now...
    phongMaterial.diffuse = material.diffuse.getPixel(
      Math.floor(uv_here.x * material.diffuse.width),
      Math.floor(uv_here.y * material.diffuse.height)
    );
  }

  if (material.specular === undefined || uv_here === undefined) {
    phongMaterial.specular = Reflection.specular;
  } else if (Pixel.prototype.isPrototypeOf(material.specular)) {
    phongMaterial.specular = material.specular;
  } else {
    phongMaterial.specular = material.specular.getPixel(
      Math.floor(uv_here.x * material.specular.width),
      Math.floor(uv_here.y * material.specular.height)
    );
  }

  phongMaterial.shininess = Reflection.shininess;

  return phongMaterial;
};

Renderer.projectVerticesNaive = function(verts) {
  // this is a naive orthogonal projection that does not even consider camera pose
  var projectedVerts = [];

  var orthogonalScale = 5;
  for (var i = 0; i < 3; i++) {
    projectedVerts[i] = new THREE.Vector4(verts[i].x, verts[i].y, verts[i].z, 1.0);

    projectedVerts[i].x /= orthogonalScale;
    projectedVerts[i].y /= (orthogonalScale * this.height) / this.width;

    projectedVerts[i].x = (projectedVerts[i].x * this.width) / 2 + this.width / 2;
    projectedVerts[i].y = (projectedVerts[i].y * this.height) / 2 + this.height / 2;
  }

  return projectedVerts;
};

Renderer.projectVertices = function(verts, viewMat) {
  // Vector3/Vector4 array of projected vertices in screen space coordinates
  // (you still need z for z buffering)
  var projectedVerts = [];

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 12 lines of code.
  for (var i = 0; i < 3; i++) {
    projectedVerts[i] = new THREE.Vector4(verts[i].x, verts[i].y, verts[i].z, 1.0);

    projectedVerts[i].applyMatrix4(viewMat);

    if (projectedVerts[i].w < this.negNear || projectedVerts[i].w > this.negFar) return;

    projectedVerts[i].x /= projectedVerts[i].w;
    projectedVerts[i].y /= projectedVerts[i].w;
    projectedVerts[i].z /= projectedVerts[i].w;

    projectedVerts[i].x = (projectedVerts[i].x * this.width) / 2 + this.width / 2;
    projectedVerts[i].y = (projectedVerts[i].y * this.height) / 2 + this.height / 2;
  }
  // ----------- STUDENT CODE END ------------

  return projectedVerts;
};

Renderer.computeBoundingBox = function(projectedVerts) {
  // Compute the screen-space bounding box for the triangle defined in projectedVerts[0-2].
  // We will need to call this helper function in the shading functions
  // to loop over pixel locations in the bounding box for rasterization.

  var box = {};
  box.minX = -1;
  box.minY = -1;
  box.maxX = -1;
  box.maxY = -1;

  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 14 lines of code.
  box.minX = Math.floor(projectedVerts[0].x);
  box.minY = Math.floor(projectedVerts[0].y);
  box.maxX = Math.ceil(projectedVerts[0].x);
  box.maxY = Math.ceil(projectedVerts[0].y);
  for (let i = 1; i < projectedVerts.length; i++) {
    if (box.minX > Math.floor(projectedVerts[i].x)) box.minX = Math.floor(projectedVerts[i].x);
    if (box.minY > Math.floor(projectedVerts[i].y)) box.minY = Math.floor(projectedVerts[i].y);
    if (box.maxX < Math.ceil(projectedVerts[i].x)) box.maxX = Math.ceil(projectedVerts[i].x);
    if (box.maxY < Math.ceil(projectedVerts[i].y)) box.maxY = Math.ceil(projectedVerts[i].y);
  }

  if (box.minX < 0) box.minX = 0;
  if (box.minY < 0) box.minY = 0;
  if (box.maxX > this.width) box.maxX = this.width;
  if (box.maxY > this.height) box.maxY = this.height;
  // ----------- STUDENT CODE END ------------

  return box;
};

Renderer.computeBarycentric = function(projectedVerts, x, y) {
  var triCoords = [];
  // (see https://fgiesen.wordpress.com/2013/02/06/the-barycentric-conspirac/)
  // return undefined if (x,y) is outside the triangle
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 15 lines of code.
  const v0 = projectedVerts[0];
  const v1 = projectedVerts[1];
  const v2 = projectedVerts[2];

  const f01 = (v0.y - v1.y)* x + (v1.x - v0.x) * y + (v0.x*v1.y - v0.y*v1.x);
  const f12 = (v1.y - v2.y)* x + (v2.x - v1.x) * y + (v1.x*v2.y - v1.y*v2.x);
  const f20 = (v2.y - v0.y)* x + (v0.x - v2.x) * y + (v2.x*v0.y - v2.y*v0.x);

  if (f01 < 0 || f12 < 0 || f20 < 0) return undefined;

  const delta = f01 + f12 + f20;

  triCoords.push(f12 / delta);
  triCoords.push(f20 / delta);
  triCoords.push(f01 / delta);
  // ----------- STUDENT CODE END ------------
  return triCoords;
};

Renderer.drawTriangleWire = function(projectedVerts) {
  var color = new Pixel(1.0, 0, 0);
  for (var i = 0; i < 3; i++) {
    var va = projectedVerts[(i + 1) % 3];
    var vb = projectedVerts[(i + 2) % 3];

    var ba = new THREE.Vector2(vb.x - va.x, vb.y - va.y);
    var len_ab = ba.length();
    ba.normalize();
    // draw line
    for (var j = 0; j < len_ab; j += 0.5) {
      var x = Math.round(va.x + ba.x * j);
      var y = Math.round(va.y + ba.y * j);
      this.buffer.setPixel(x, y, color);
    }
  }
};

Renderer.drawTriangleFlat = function(verts, projectedVerts, normals, uvs, material) {
  // Flat shader
  // Color of each face is computed based on the face normal
  // (average of vertex normals) and face centroid.
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 52 lines of code.

  let box = this.computeBoundingBox(projectedVerts)

  let normal = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < normals.length; i++) normal.add(normals[i]);
  normal.divideScalar(normals.length);

  let centroid  = new THREE.Vector3();
  for (let i = 0; i < verts.length; i++) {
      centroid.add(verts[i]);
  }

  centroid.divideScalar(verts.length)

  
  const phongMaterial = this.getPhongMaterial(uvs, material);
  const color = Reflection.phongReflectionModel(centroid, this.cameraPosition, normal, this.lightPos, phongMaterial);


  // Loop over pixels in traingle
  for (let x = box.minX; x < box.maxX; x++) {
      for (let y = box.minY; y < box.maxY; y++) {
          let baryCoords = this.computeBarycentric(projectedVerts, x, y)
          if (baryCoords !== undefined) {
              let zdepth = 0;
              for (let i = 0; i < projectedVerts.length; i++) zdepth += (projectedVerts[i].z * baryCoords[i]);

              if (zdepth < this.zBuffer[x][y]) {
                  this.zBuffer[x][y] = zdepth;
                  this.buffer.setPixel(x, y, color);
              }
          }
      }
  }
  // ----------- STUDENT CODE END ------------
};

Renderer.drawTriangleGouraud = function(verts, projectedVerts, normals, uvs, material) {
  // Gouraud shader
  // Interpolate the color for each pixel in the triangle using the barycentric coordinate.
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 49 lines of code.

  let box = this.computeBoundingBox(projectedVerts)

  const phongMaterial = this.getPhongMaterial(uvs, material);

  var colors = [];

    for (let i = 0; i < verts.length; i++) {
        const color = Reflection.phongReflectionModel(verts[i], this.cameraPosition, normals[i], this.lightPos, phongMaterial);
        colors.push(color)
    }

  // Loop over pixels in traingle
  for (let x = box.minX; x < box.maxX; x++) {
      for (let y = box.minY; y < box.maxY; y++) {
          let baryCoords = this.computeBarycentric(projectedVerts, x, y)
          if (baryCoords !== undefined) {
              let zdepth = 0;
              for (let i = 0; i < projectedVerts.length; i++) zdepth += (projectedVerts[i].z * baryCoords[i]);

              if (zdepth < this.zBuffer[x][y]) {
                this.zBuffer[x][y] = zdepth;
                  let color = new Pixel(0, 0, 0);
                  for (let i = 0; i < colors.length; i++) {
                    color = color.plus(colors[i].copy().multipliedBy(baryCoords[i]));
                  }
                  this.buffer.setPixel(x, y, color);
              }
          }
      }
  }
  // ----------- STUDENT CODE END ------------
};

Renderer.drawTrianglePhong = function(verts, projectedVerts, normals, uvs, material) {
  // Phong shader
  // (1) Basic Phong shader: Interpolate the normal and vertex for each pixel in the triangle
  //                         using the barycentric coordinate.
  // (2) Texture mapping: If uvs is provided, compute interpolated uv coordinates
  //                      and map the phong material texture (if available)
  //                      at the uv coordinates to the pixel location.
  // (3) XYZ normal mapping: If xyz normal texture exists for the material,
  //                         convert the RGB value of the XYZ normal texture at the uv coordinates
  //                         to a normal vector and apply it at the pixel location.
  // ----------- STUDENT CODE BEGIN ------------
  // ----------- Our reference solution uses 62 lines of code.

  let box = this.computeBoundingBox(projectedVerts)

  // Loop over pixels in traingle
  for (let x = box.minX; x < box.maxX; x++) {
      for (let y = box.minY; y < box.maxY; y++) {
          let baryCoords = this.computeBarycentric(projectedVerts, x, y)
          if (baryCoords !== undefined) {
              let zdepth = 0;
              for (let i = 0; i < projectedVerts.length; i++) zdepth += (projectedVerts[i].z * baryCoords[i]);

              if (zdepth < this.zBuffer[x][y]) {
                this.zBuffer[x][y] = zdepth;

                let vert = new THREE.Vector3();
                
                for (let i = 0; i < verts.length; i++) {
                    let copy = new THREE.Vector3().copy(verts[i])
                    vert = vert.add(copy.multiplyScalar(baryCoords[i]));
                }

                // texture mapping 
                let phongMaterial;
                let normal = new THREE.Vector3();
                if (uvs === undefined) {
                    phongMaterial = this.getPhongMaterial(uvs, material);
                    for (let i = 0; i < normals.length; i++) {
                        let copy = new THREE.Vector3().copy(normals[i])
                        normal = normal.add(copy.multiplyScalar(baryCoords[i]));
                    }
                }
                else {
                    let uv_here = new THREE.Vector2();
                    for (let i = 0; i < uvs.length; i++) {
                        let copy = new THREE.Vector2().copy(uvs[i])
                        uv_here = uv_here.add(copy.multiplyScalar(baryCoords[i]))
                    }
                    phongMaterial = this.getPhongMaterial(uv_here, material);

                    // xyz normal mapping
                    if (material.xyzNormal === undefined) {
                        for (let i = 0; i < normals.length; i++) {
                            let copy = new THREE.Vector3().copy(normals[i])
                            normal = normal.add(copy.multiplyScalar(baryCoords[i]));
                        }
                    }

                    else {
                        let pixel = material.xyzNormal.getPixel(Math.floor(uv_here.x * material.xyzNormal.width), Math.floor(uv_here.y * material.xyzNormal.height))
                        let rgb = new THREE.Vector3(pixel.r, pixel.g, pixel.b)

                        let xyz = rgb.multiplyScalar(2)
                        xyz.subVectors(xyz, new THREE.Vector3(1, 1, 1))
                        normal = xyz.normalize()
                    }
                }
                
                var color = Reflection.phongReflectionModel(vert, this.cameraPosition, normal, this.lightPos, phongMaterial);
                // console.log(color);
                let hsl = color.toHSL();
                // if (hsl.h > 1.0 || hsl.s > 1.0 || hsl.l > 1.0) {
                //   // debugger
                // }
                // if (hsl.h < 0 || hsl.s < 0 || hsl.l < 0) {
                //   // debugger
                // }
                if(hsl.l > 0.8){
                  hsl.l = 0.9;
                }
                else if(hsl.l > 0.5){
                  hsl.l = 0.5;
                }
                else{
                  hsl.l = 0.2;
                }
                color.fromHSL(hsl.h, hsl.s, hsl.l);
                // console.log(color);
                // debugger

                this.buffer.setPixel(x, y, color);
              }
          }
      }
  }
  // ----------- STUDENT CODE END ------------
};

Renderer.drawTriangle = function(verts, normals, uvs, material, viewMat) {
  var projectedVerts = this.projectVertices(verts, viewMat);
  if (projectedVerts === undefined) {
    // not within near and far plane
    return;
  } else if (projectedVerts.length <= 0) {
    projectedVerts = this.projectVerticesNaive(verts);
  }

  switch (this.shaderMode) {
    case "Wire":
      this.drawTriangleWire(projectedVerts);
      break;
    case "Flat":
      this.drawTriangleFlat(verts, projectedVerts, normals, uvs, material);
      break;
    case "Gouraud":
      this.drawTriangleGouraud(verts, projectedVerts, normals, uvs, material);
      break;
    case "Phong":
      this.drawTrianglePhong(verts, projectedVerts, normals, uvs, material);
      break;
    default:
  }
};
