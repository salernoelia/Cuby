<template>
  <div>
    <div class="main">
      <div
        :style="{ backgroundColor: selectedData.colorAbove, opacity: 0.8 }"
        class="left-half"
      >
        <h1>{{ selectedData.Habitat_name }}</h1>
        <p>Biome Type: {{ selectedData.Habitat_type }}</p>
        <h2>{{ selectedData.Habitat_description }}</h2>

        <h2>Habitat threats</h2>
        <p>{{ selectedData.Habitat_threats }}</p>
        <h2>Habitat management strategies</h2>
        <p>{{ selectedData.Habitat_managment_strategies }}</p>

        <p>{{ selectedData.Case_Study_Conservation }}</p>
        <p>{{ selectedData.Case_Study_Regeneration }}</p>
        <p>{{ selectedData.References }}</p>
      </div>
      <div class="right-half"></div>
    </div>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import data from "~/public/data/data.json";
import { userStore } from "../store/ustore.js";

/*-------------------*/
// Fetching Link and building Datapointer

const ustore = userStore();

const currentURL = window.location.href;
const lastPartOfURL = currentURL.substring(currentURL.lastIndexOf("/") + 1);
const selectedData = data.find((p) => p.Habitat_link === lastPartOfURL);

/*-------------------*/
// Three.js
let camera, scene, renderer, container;

onMounted(async () => {
  container = document.querySelector(".right-half");
  initCamera();
  initRenderer();
  initScene();
  initControls();
  renderObjects(); // Call renderObjects after initializing scene and renderer
});

const initCamera = () => {
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;
  const left = -width / 2;
  const right = width / 2;
  const top = height / 2;
  const bottom = -height / 2;
  const near = 0.1;
  const far = 500000;

  // Create the orthographic camera
  camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

  // Set the camera position to match the perspective camera's position
  camera.position.set(
    -1488.697359746549,
    1492.3078575429806,
    1927.4453334372429
  );

  // Set the camera rotation to match the perspective camera's rotation
  camera.rotation.set(
    -0.6588359167815547,
    -0.5482614334642727,
    -0.3835525580843654
  );

  // Set the zoom level of the camera
  camera.zoom = 5;

  // Ensure the camera is looking at the center of the scene
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  updateCameraAspectRatio(); // Set initial aspect ratio

  // Listen for container resize events to update camera aspect ratio
  window.addEventListener("resize", updateCameraAspectRatio);
};

const updateCameraAspectRatio = () => {
  const width = container.offsetWidth;
  const height = container.offsetHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfafafa);
};

const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({ antialias: true });

  const container = document.querySelector(".right-half");
  if (container) {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
  } else {
    console.error("Container element not found");
  }
};

const initControls = () => {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;

  controls.screenSpacePanning = false;
  controls.maxDistance = 15000;

  controls.minPolarAngle = 0; // 0 degrees
  controls.maxPolarAngle = Math.PI; // 90 degrees
};

const addLight = () => {
  const light = new THREE.AmbientLight(0xffffff, 1);
  light.position.set(0, 0, 1);
  scene.add(light);
};

const addCube = (data) => {
  const cubeGeometry = new THREE.BoxGeometry(
    Math.sqrt(data.Area_Habitat), // Width
    Math.sqrt(data.Area_Habitat), // Length
    data.Above_ground_current_storage + data.Below_ground_current_storage // Height
  );
  const cubeMaterial = new THREE.MeshPhongMaterial({
    color: selectedData.colorAbove,
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  scene.add(cube);
};

const renderObjects = () => {
  addLight();
  // Example data for testing, replace with your actual data
  const data = {
    Area_Habitat: 100, // Example value for area
    Above_ground_current_storage: 50, // Example value for above ground storage
    Below_ground_current_storage: 50, // Example value for below ground storage
  };
  addCube(data);
  animate();
};

const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Hide scrollbars */
}

body {
  height: 100vh;
  margin: 0; /* Ensure no default margin */
}

.main {
  margin: 0;
  padding: 0;
  height: 100vh; /* This should be enough to fill the viewport height */
  display: flex;
  grid-template-columns: 1fr 1fr;
  flex-direction: row;
}

.left-half {
  display: flex;
  flex-direction: column;
  width: 50%;
  padding: 3em;

  background-color: #f2f2f2;
}

.right-half {
  width: 50%;
  background-color: #f2f2f2;
}

h1 {
  font-size: 2em;
  padding-bottom: 0.5em;
  font-weight: 100;
}

h2 {
  font-size: 1.5em;
  padding-bottom: 0.5em;
  font-weight: 100;
}

p {
  white-space: pre-line;
  font-size: 1em;
  padding-bottom: 0.5em;
}
</style>
