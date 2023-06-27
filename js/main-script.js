import * as THREE from '../js/lib/three.module.js';
import { OrbitControls } from '../js/lib/jsm/OrbitControls.js';
import CSG from "../js/three-csg.js"
import { OBJLoader } from "../js/OBJLoader.js";
import { Mesh } from "../js/lib/three.module.js";
import { OBJExporter } from "../js/OBJExporter.js";

var isPhone = false;

if (window.innerWidth < 600) {
  isPhone = true;
}
var isRotating = false;
var scene = new THREE.Scene();
if (window.innerWidth < 600) {
  var camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight/2), 0.1, 1000);
} else {
  var camera = new THREE.PerspectiveCamera(75, (window.innerWidth/2) / window.innerHeight, 0.1, 1000);
}

var renderer = new THREE.WebGLRenderer({ antialias: true });
var canvasWrapper = document.getElementById("canvasWrapper");

renderer.setClearColor("#e5e5e5");
canvasWrapper.appendChild(renderer.domElement);
renderer.setClearColor("#e5e5e5");



if (isPhone) {
  renderer.setSize(window.innerWidth, window.innerHeight/2);
  camera.aspect = (window.innerWidth*2) / window.innerHeight;
} else {
  renderer.setSize(window.innerWidth / 2, window.innerHeight);
}

//Button Click Handlers
var generateButton = document.getElementById('generateButton');   //generate
generateButton.addEventListener('click', calculateCube);
var centerButton = document.getElementById('centerButton');   //center view
centerButton.addEventListener('click', cameraCenter);
var rotationButton = document.getElementById('rotationCheckbox');   //rotation checkbox
rotationButton.addEventListener('change', rotationToggle);
var downloadButton = document.getElementById('downloadButton');   //download
downloadButton.addEventListener('click', downloadMesh);
var helpButton = document.getElementById('helpButton');
var pictureContainer = document.getElementById('pictureContainer');

helpButton.addEventListener('click', function() {
  if (pictureContainer.style.display === 'none') {
    pictureContainer.style.display = 'block';
  } else {
    pictureContainer.style.display = 'none';
  }
});


//resize handler
window.addEventListener('resize', () => {
  if (window.innerWidth < 601) {
    isPhone = true;
  } else {
    isPhone = false;
  }
  if (isPhone) {
    renderer.setSize(window.innerWidth, window.innerHeight/2);
    camera.aspect = (window.innerWidth) / (window.innerHeight/2);
  } else if (!isPhone) {
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    camera.aspect = (window.innerWidth / 2) / window.innerHeight;
  }
  camera.updateProjectionMatrix();
});

var material = new THREE.MeshLambertMaterial({ color: 0X72BF6A });

var geometry = new THREE.BoxGeometry(2, 2, 2);  //box created here
var box = new THREE.Mesh(geometry, material);
scene.add(box);
box.visible = false;
box.position.set(-27.775, 0, 0);


var bracket = null;
var loader = new OBJLoader();

var i = 0;
var elem = null;
var parentBar = null;
function barMove(vpos = 0, setwide = 1, rate = 10) {
  if (i == 0) {
    i = 1;
    elem = document.getElementById("myBar");
    parentBar = document.getElementById("myProgress");
    var width = 1;
    parentBar.style.top = 50 + vpos + "%";
    parentBar.style.width = 25/setwide + "%";
    var id = setInterval(frame, rate);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        width = 1;
        i = 0;
      } else {
        width++;
        elem.style.width = width + "%";
      }
    }
  }
}


loader.load(
  './assets/model.obj',
  function (object) {
    barMove();
    var mesh = object.children.find(child => child instanceof Mesh);
    bracket = mesh;
    console.log(bracket);
  }
);


setTimeout(() => {
    scene.add(bracket);
    bracket.position.set(-27.775, 0, 0);
    elem.style.display = "none"; // Hide the loading bar
    calculateCube();
}, 2000);
console.log("Bracket Added to Scene");
console.log(bracket);

//light created here
var light = new THREE.PointLight(0xFFFFFF, 1, 500);
light.position.set(10, 0, 25);
scene.add(light);

// Define light target
var lightTarget = new THREE.Object3D();
scene.add(lightTarget);
light.target = lightTarget;

// OrbitControls initialization
var controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotateSpeed = 10.0;
rotationToggle();

//rotation control
function rotationToggle() {
    if (!isRotating) {
        controls.autoRotate = true;
        controls.enablePan = false;
    } else {
        controls.autoRotate = false;
        controls.enablePan = true;
    }
    isRotating = document.getElementById('rotationCheckbox').checked;
}

//center camera function
function cameraCenter() {
    controls.reset();
    camera.position.x = -75;
    camera.position.y = -31.5;
    camera.position.z = 60;
}
cameraCenter();     //initial centering of camera
scene.remove(box);

async function doCSG(a, b, op) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bspA = CSG.fromMesh(a);
        const bspB = CSG.fromMesh(b);
        const bspC = bspA[op](bspB);
        const result = CSG.toMesh(bspC, a.matrix);
        result.material = material;
        resolve(result); // Resolve the promise with the result
      }, 500); // Simulating a delayed operation with a timeout
    });
  }

//rendering here
function animate() {
    requestAnimationFrame(animate);
    light.position.copy(camera.position);
    light.target.position.set(0, 0, 0);
    if (isRotating) {
        controls.target = new THREE.Vector3(0, 0, 0);
    }
    controls.update(); // Update the controls
    renderer.render(scene, camera);
}
animate();  //calling render function


var results;
// submit button handler
async function calculateCube() {
    barMove(40, 2, 1);
    elem.style.display = "block"; // Hide the loading bar
    var length = parseFloat(document.getElementById('inputC').value);
    var breadth = parseFloat(document.getElementById('inputA').value);
    var height = parseFloat(document.getElementById('inputB').value);
    scene.remove(results);
    scene.add(box);
    scene.add(bracket);
    box.scale.set(length*2, breadth, height);   //update the cube's size based on input values
    results = await doCSG(bracket, box, 'subtract', material);    // Wait for the result
    scene.add(results);
    results.position.set(-27.775, 0, 0);
    scene.remove(box);
    scene.remove(bracket);
    elem.style.display = "none"; // Hide the loading bar
}

function downloadMesh() {
  if (results) {
    var exporter = new OBJExporter();
    var objData = exporter.parse(results);

    // Create a temporary <a> element to initiate the download
    var link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(objData);
    link.download = 'mesh.obj';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
