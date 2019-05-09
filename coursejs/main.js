"use strict";

var Main = Main || {
  meshes: {},
  // meshesLoading: 0,
  // imagesLoading: 0,
  itemsToLoad: 0,
  canvas: undefined,
  context: undefined,
  controls: undefined,
  stats: undefined,
};

function Mesh() {
  this.vertices = []; // array of vertex positions
  this.faces = []; // array of lists of vertex indices
  this.vertex_normals = [];
  this.uvs = []; // array of uvs of faces
  this.filename = undefined;
}

Mesh.prototype.computeVertexNormals = function() {
  for (var i = 0; i < this.vertices.length; i++) {
    this.vertex_normals.push(new THREE.Vector3(0.0, 0.0, 0.0));
  }

  for (var faceIdx = 0; faceIdx < this.faces.length; faceIdx++) {
    var face = this.faces[faceIdx];
    var va = new THREE.Vector3();
    va.subVectors(this.vertices[face.b], this.vertices[face.a]);
    var vb = new THREE.Vector3();
    vb.subVectors(this.vertices[face.c], this.vertices[face.a]);
    var n = new THREE.Vector3();
    n.crossVectors(va, vb);
    this.vertex_normals[face.a].add(n);
    this.vertex_normals[face.b].add(n);
    this.vertex_normals[face.c].add(n);
  }

  for (var i = 0; i < this.vertices.length; i++) {
    this.vertex_normals[i].normalize();
  }
};

Main.getMesh = function(filename) {
  var newMesh = new Mesh();

  var filePath = "obj/" + filename; // all obj files are in the obj folder

  var manager = new THREE.LoadingManager();
  var loader = new THREE.OBJLoader(manager);

  loader.load(filePath, function(object) {
    var geometry = new THREE.Geometry().fromBufferGeometry(object.children[0].geometry);
    geometry.mergeVertices(); // otherwise we have duplicated vertices
    newMesh.vertices = geometry.vertices;
    newMesh.faces = geometry.faces;
    newMesh.uvs = geometry.faceVertexUvs[0];

    newMesh.filename = filename;
    newMesh.computeVertexNormals();
    Main.itemsToLoad--;
    if (Main.itemsToLoad === 0) {
      Main.onMeshesLoaded();
    }
  });
  return newMesh;
};

Main.getTexture = function(filename) {
  var imageObj = new Image(0, 0, []);
  var filePath = "textures/" + filename;
  var image = document.createElement("img");

  image.onload = function() {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0);
    var imageData = context.getImageData(0, 0, image.width, image.height);
    context.clearRect(0, 0, canvas.width, canvas.height);

    imageObj.width = image.width; // re-assign imageObj value
    imageObj.height = image.height;
    imageObj.data = imageData.data;

    Main.itemsToLoad--;
    if (Main.itemsToLoad === 0) {
      Main.onMeshesLoaded();
    }
  };
  image.src = filePath;
  return imageObj;
};

function MeshInstance(filename, useMaterial) {
  Main.itemsToLoad = 4;
  this.mesh = filename !== undefined ? Main.getMesh(filename) : undefined;

  this.material = {};
  if (useMaterial) {
    var parts = filename.split(".");
    var jsonFilename = parts[0] + ".json";

    if (UrlExists("json/" + jsonFilename)) {
      var jsonObj = Parser.loadJson("json/" + jsonFilename);
    } else {
      alert(jsonFilename + " does not exist!");
    }

    if (jsonObj !== undefined) {
      if (jsonObj.diffuse !== undefined) {
        if (typeof jsonObj.diffuse === "string") {
          // if it's a diffuse map
          this.material.diffuse = Main.getTexture(jsonObj.diffuse);
        } else {
          // just a color
          this.material.diffuse = new Pixel(
            jsonObj.diffuse[0],
            jsonObj.diffuse[1],
            jsonObj.diffuse[2]
          );
        }
      } else {
        Main.itemsToLoad--;
      }

      if (jsonObj.specular !== undefined) {
        if (typeof jsonObj.specular === "string") {
          // if it's a diffuse map
          this.material.specular = Main.getTexture(jsonObj.specular);
        } else {
          // just a color
          this.material.specular = new Pixel(
            jsonObj.specular[0],
            jsonObj.specular[1],
            jsonObj.specular[2]
          );
        }
      } else {
        Main.itemsToLoad--;
      }

      if (jsonObj.xyzNormal !== undefined) {
        this.material.xyzNormal = Main.getTexture(jsonObj.xyzNormal);
      } else {
        Main.itemsToLoad--;
      }
    }
  } else {
    Main.itemsToLoad -= 3;
  }
}

// when HTML is finished loading, do this
window.onload = function() {
  Student.updateHTML();

  Main.canvas = document.getElementById("canvas");
  Main.context = canvas.getContext("2d");

  Renderer.initialize();
  Gui.init();

  // load new mesh
  Main.controls = new THREE.TrackballControls(Renderer.camera, Main.canvas);

  function snapShot() {
    // get the image data
    try {
      var dataURL = document.getElementById("canvas").toDataURL();
    } catch (err) {
      alert("Sorry, your browser does not support capturing an image.");
      return;
    }
    // this will force downloading data as an image (rather than open in new window)
    var url = dataURL.replace(/^data:image\/[^;]/, "data:application/octet-stream");
    window.open(url); //save as .png
  }

  window.addEventListener("keyup", function(event) {
    if (event.which == 73) {
      //"I"
      snapShot();
    }
  });
};

Main.onMeshesLoaded = function() {
  this.stats = new Stats();
  this.stats.setMode(0); // 0: fps, 1: ms, 2: mb

  var container = document.getElementById("stats");
  this.stats.domElement.style.position = "absolute";
  this.stats.domElement.style.bottom = "0px";
  this.stats.domElement.style.right = "0px";
  container.appendChild(this.stats.domElement);

  console.log("Start rendering...");
  repeatRender();
};

var fpsAve = 0.0;

function repeatRender() {
  Main.stats.begin();
  Renderer.render();
  Main.stats.end();

  Main.controls.update();

  setTimeout(function() {
    repeatRender();
  }, 0);
}

/////////////////////////////////////
// utility functions

function assert(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
  return condition;
}

function CopyVec(vec) {
  return new THREE.Vector3(0, 0, 0).copy(vec);
}

// http://stackoverflow.com/questions/3646914/how-do-i-check-if-file-exists-in-jquery-or-javascript
function UrlExists(url) {
  var http = new XMLHttpRequest();
  http.open("HEAD", url, false);
  http.send(); // still giving unwanted error in console.
  return http.status != 404;
}
