<template>
  <div>
    <div class="controls">
      <label>
        <input
          type="radio"
          name="selectedStorage"
          @change="storageSelected('currentStorage')"
        />
        Current Storage
      </label>

      <label>
        <input
          type="radio"
          name="selectedStorage"
          @change="storageSelected('potentialStorage')"
        />
        Potential Storage
      </label>
    </div>
    <div class="filterbuttons">
      <button
        v-for="habitat in data"
        :class="{ 'button-main-active': isSelected(habitat.Habitat_name) }"
        class="button-main"
        @click="filterData(habitat.Habitat_name)"
      >
        {{ habitat.Habitat_name }}
      </button>
    </div>
    <div class="canvas" ref="canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "~/static/data/data.json";

const filteredData = ref([]);
const filterData = (habitatName) => {
  const index = filteredData.value.findIndex(
    (item) => item.Habitat_name === habitatName
  );
  if (index === -1) {
    filteredData.value.push(
      data.find((item) => item.Habitat_name === habitatName)
    );
  } else {
    filteredData.value.splice(index, 1);
  }
  console.log(filteredData.value);
  resetView();
};

const isSelected = (habitatName) => {
  return filteredData.value.some((item) => item.Habitat_name === habitatName);
};

let zIndex = 2;

const canvas = ref(null);
let selectedStorage = ref("currentStorage");
let storageOption = ref();
let rectangles = [];
let nodes = [];
let rectAbove,
  rectBelow,
  camera,
  scene,
  renderer,
  animate,
  storageSelected,
  geometryPositive,
  geometryNegative,
  resetView;

storageSelected = (storage) => {
  selectedStorage.value = storage;
  resetView();
};

resetView = () => {
  geometryPositive.dispose();
  geometryNegative.dispose();

  // Remove existing meshes from the scene
  scene.children.length = 0;
  // Recreate the treemap and update the 3D representation
  createTreemap();
};

onMounted(async () => {
  initCamera();
  createTreemap();
});

const createTreemap = async () => {
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 1000 - margin.left - margin.right;
  const height = 1000 - margin.top - margin.bottom;

  // Wait for the element to be available in the DOM
  await new Promise((resolve) => {
    const checkElement = () => {
      if (canvas.value) {
        resolve();
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    checkElement();
  });

  // Create color scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // append the svg object to the body of the page
  const svg = d3
    .select(canvas.value)
    // .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  try {
    // Create hierarchy
    const root = d3
      .hierarchy({ children: data }) // Wrapping data in a "children" property
      .sum((d) => +d.Area_Habitat)
      .sort((a, b) => b.value - a.value);

    // Create treemap
    d3.treemap().size([width, height]).padding(0)(root);

    console.log(root.leaves());
    // use this information to add rectangles:
    const rects = svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
      .style("fill", (d) => color(d.data.Habitat_name))
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0);

    // Read out d3.js generated rectangles and import them to Three.js
    rectangles = svg.selectAll("rect").nodes();

    // Apply the layout to our data
    nodes = root.descendants();

    create3D(rectangles, nodes);
    console.log(rectangles);
    return { rectangles, nodes };
  } catch (error) {
    console.error("Error loading JSON data:", error);
  }
};

const initCamera = () => {
  // Create a camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );
  camera.position.set(1500, 0, 1500);
  camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the left of the scene
};

const create3D = (rectangles, nodes) => {
  // Create a Three.js scene
  scene = new THREE.Scene();

  // Create three.js renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  zIndex++;
  canvas.value.appendChild(renderer.domElement);
  renderer.domElement.style.position = "absolute"; // oder 'relative', 'fixed', etc., je nach Bedarf
  renderer.domElement.style.zIndex = zIndex;

  console.log("zIndex:", zIndex);

  // Add axes helpers
  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);
  scene.background = new THREE.Color(0xffffff); // Set background color to white

  const centroid = new THREE.Vector3();
  rectangles.forEach((rectangle) => {
    centroid.x += parseFloat(rectangle.getAttribute("x") + 50);
    centroid.y += parseFloat(rectangle.getAttribute("y") + 50);
    centroid.z += 0; // Assuming z-coordinate is 0 for 2D layout
  });
  centroid.divideScalar(rectangles.length);

  rectangles.forEach((rectangle, index) => {
    let rectWidth = parseFloat(rectangle.getAttribute("width"));
    let rectHeight = parseFloat(rectangle.getAttribute("height"));

    switch (selectedStorage.value) {
      case "currentStorage":
        rectAbove = data[index].Above_ground_current_storage / 100000000;
        rectBelow = data[index].Below_ground_current_storage / 100000000;
        break;
      case "potentialStorage":
        rectAbove = data[index].Above_ground_potential_storage / 100000000;
        rectBelow = data[index].Below_ground_potential_storage / 100000000;
        break;
    }

    if (
      rectAbove === null ||
      rectAbove === undefined ||
      rectAbove === 0 ||
      isNaN(rectBelow)
    ) {
      rectAbove = 1;
    }

    if (
      rectBelow === null ||
      rectBelow === undefined ||
      rectBelow === 0 ||
      isNaN(rectBelow)
    ) {
      rectBelow = -1;
    }

    console.log("rectWidth:", rectWidth);
    console.log("rectHeight:", rectHeight);
    console.log("rectAbove:", rectAbove);
    console.log("rectBelow:", rectBelow);

    geometryPositive = new THREE.ExtrudeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(rectWidth, 0),
        new THREE.Vector2(rectWidth, rectHeight),
        new THREE.Vector2(0, rectHeight),
        new THREE.Vector2(0, 0),
      ]),
      { depth: rectAbove, bevelEnabled: false }
    );

    geometryNegative = new THREE.ExtrudeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(rectWidth, 0),
        new THREE.Vector2(rectWidth, rectHeight),
        new THREE.Vector2(0, rectHeight),
        new THREE.Vector2(0, 0),
      ]),
      { depth: Math.abs(rectBelow), bevelEnabled: false }
    );

    const material = new THREE.MeshPhongMaterial({
      color: data[index].color,
    });
    const meshPositive = new THREE.Mesh(geometryPositive, material);
    const meshNegative = new THREE.Mesh(geometryNegative, material);

    meshPositive.position.set(
      parseFloat(rectangle.getAttribute("x")) - centroid.x,
      parseFloat(rectangle.getAttribute("y")) - centroid.y,
      0
    );

    meshNegative.position.set(
      parseFloat(rectangle.getAttribute("x")) - centroid.x,
      parseFloat(rectangle.getAttribute("y")) - centroid.y,
      -Math.abs(rectBelow)
    );

    const existingMeshPositive = scene.getObjectByName(`meshPositive${index}`);
    const existingMeshNegative = scene.getObjectByName(`meshNegative${index}`);

    if (existingMeshPositive) scene.remove(existingMeshPositive);
    if (existingMeshNegative) scene.remove(existingMeshNegative);

    meshPositive.name = `meshPositive${index}`;
    meshNegative.name = `meshNegative${index}`;

    // Add meshes to the scene
    scene.add(meshPositive);
    scene.add(meshNegative);
  });

  // Add ambient light with increased intensity and white color
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Add directional light with increased intensity and white color
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  scene.rotation.x = -Math.PI / 3;

  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxDistance = 15000;

  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;

  controls.minAzimuthAngle = -Infinity;
  controls.maxAzimuthAngle = Infinity;

  animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    // Update the OrbitControls
    controls.update();
  };

  animate();
};
</script>

<style scoped>
body {
  top: 0;
  overflow: hidden;
  overflow-y: hidden;
  overflow-x: hidden;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.canvas {
  width: 100%;
  height: 100%;
  z-index: 2;
  top: 0;
  left: 0;
  margin: none;
  padding: none;
  position: absolute;
}
.controls {
  position: relative;
  top: 0;
  left: 0;
  z-index: 3;
}

.filterbuttons {
  position: relative;
  top: 0;
  left: 0;
  z-index: 3;
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: left;
  margin: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
