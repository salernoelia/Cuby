<template>
  <div>
    <div class="controls">
      <div class="storageControls">
        <label
          class="storage-button"
          :class="{ active: selectedStorage === 'currentStorage' }"
        >
          <input
            class="storage-radio"
            type="radio"
            name="selectedStorage"
            value="currentStorage"
            v-model="selectedStorage"
          />
          Current Storage
        </label>

        <label
          class="storage-button"
          :class="{ active: selectedStorage === 'potentialStorage' }"
        >
          <input
            class="storage-radio"
            type="radio"
            name="selectedStorage"
            value="potentialStorage"
            v-model="selectedStorage"
          />
          Potential Storage
        </label>
      </div>
      <div class="filterControls">
        <button
          v-for="habitat in data"
          :key="habitat.Habitat_name"
          :style="{
            backgroundColor: isHabitatSelected(habitat.Habitat_name)
              ? habitat.colorAbove
              : 'white',
          }"
          :class="[
            'filter-button',
            { 'filter-button-active': isHabitatSelected(habitat.Habitat_name) },
          ]"
          @click="filterData(habitat.Habitat_name)"
        >
          {{ habitat.Habitat_name }}
        </button>
      </div>
      <div class="infoControls">
        <button @click="popup()" class="infoButton">About</button>
      </div>
      <div class="popupContainer" v-if="popupBol">
        <div class="popup">
          <div class="popup-content">
            <div class="popup-header">
              <button @click="closePopup" class="popup-close">Close</button>
              <h1>Cuby</h1>
            </div>
            <p>
              is a 3D visualization of the carbon storage of different biomes.
            </p>
            <p class="popup-title"><br />Visualization</p>
            <ul>
              <li>Jin Hyejin</li>
              <li>Basil Egger</li>
              <li>Irina Lezaic</li>
              <li>Elia Salerno</li>
            </ul>
            <p class="popup-title"><br />Development</p>
            <ul>
              <li>Elia Salerno</li>
            </ul>
            <p class="popup-title"><br />Data</p>
            <ul>
              <li>ETH Crowther Lab</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="canvas" ref="canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "~/static/data/data.json";
import _ from "lodash";
import { userStore } from "../store/ustore.js";
const ustore = userStore();

const cloneDeep = _.cloneDeep;

const filteredData = ref(cloneDeep(data));
const filterData = (habitatName) => {
  const index = filteredData.value.findIndex(
    (item) => item.Habitat_name === habitatName
  );
  if (index === -1) {
    const habitat = data.find((item) => item.Habitat_name === habitatName);
    if (habitat) {
      filteredData.value.push(habitat);
    }
  } else {
    filteredData.value.splice(index, 1);
  }
  // console.log(filteredData.value);
  resetView();
};

const isHabitatSelected = (habitatName) => {
  return filteredData.value.some((item) => item.Habitat_name === habitatName);
};

let zIndex = 2;

const router = useRouter();
const canvas = ref(null);
let selectedStorage = ref("currentStorage");
let rectangles = [];
let nodes = [];
let popupBol = ref(false);

let rectAbove,
  rectBelow,
  camera,
  scene,
  renderer,
  animate,
  storageOptionSelected,
  geometryPositive,
  geometryNegative,
  resetView,
  color,
  colorBelow,
  controls,
  raycaster,
  pointer;

let meshMap = new Map(); // Map to store references to meshes

watch(selectedStorage, () => {
  resetView();
});

const popup = () => {
  popupBol.value = !popupBol.value;
  console.log("current:", popupBol.value);
};

function closePopup(event) {
  // Stop event propagation to prevent triggering onObjectClick
  event.stopPropagation();

  // Close the popup
  popup();
}

resetView = () => {
  geometryPositive.dispose();
  geometryNegative.dispose();

  scene.children.length = 0;

  createTreemap();
  color();
  filteredData.value.forEach((item) => {
    const meshes = meshMap.get(item);
    if (meshes) {
      scene.remove(meshes.meshPositive);
      scene.remove(meshes.meshNegative);
      meshMap.delete(item);
    }
  });
};

onMounted(async () => {
  initCamera();
  createRaycaster();
  createTreemap();
});

const createTreemap = async () => {
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 1000 - margin.left - margin.right;
  const height = 1000 - margin.top - margin.bottom;

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

  color = () => {
    return d3.scaleOrdinal(d3.schemeCategory10);
  };

  const svg = d3
    .select(canvas.value)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  try {
    const root = d3
      .hierarchy({ children: filteredData.value })
      .sum((d) => +d.Area_Habitat)
      .sort((a, b) => b.Area_Habitat - a.Area_Habitat); // Sort by highest to lowest value;

    d3.treemap().size([width, height]).padding(0)(root);

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

    rectangles = svg.selectAll("rect").nodes();

    nodes = root.descendants();

    create3D(rectangles, nodes);
    return { rectangles, nodes };
  } catch (error) {
    console.error("Error loading JSON data:", error);
  }
};

const initCamera = () => {
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;
  const left = -width / 2;
  const right = width / 2;
  const top = height / 2;
  const bottom = -height / 2;
  const near = 0.1;
  const far = 50000;

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
  camera.zoom = 0.12208654873684852;

  // Ensure the camera is looking at the center of the scene
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Update the camera's projection matrix with the new zoom level
  camera.updateProjectionMatrix();
};

const createRaycaster = () => {
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
};

function onPointerMove(event) {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, false);
  // console.log(intersects);
}

function onObjectClick(event) {
  if (
    raycaster.intersectObjects(scene.children, false).length > 0 &&
    !popupBol.value
  ) {
    const clickedMesh = raycaster.intersectObjects(scene.children, false)[0]
      .object;
    const clickedData = clickedMesh.userData.meshData.id;
    ustore.clickedData = clickedData;
    console.log("Clicked data:", ustore.clickedData);
    router.push(`/details/${clickedData}`);
  }
}

const create3D = (rectangles, nodes) => {
  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  zIndex++;
  canvas.value.appendChild(renderer.domElement);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.zIndex = zIndex;

  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera);

  // const axesHelper = new THREE.AxesHelper(100);
  // scene.add(axesHelper);
  scene.background = new THREE.Color(0xfafafa);

  rectangles.forEach((rectangle, index) => {
    let rectWidth = parseFloat(rectangle.getAttribute("width"));
    let rectHeight = parseFloat(rectangle.getAttribute("height"));

    switch (selectedStorage.value) {
      case "currentStorage":
        rectAbove =
          filteredData.value[index].Above_ground_current_storage / 1000000000;
        rectBelow =
          filteredData.value[index].Below_ground_current_storage / 1000000000;
        break;
      case "potentialStorage":
        rectAbove =
          filteredData.value[index].Above_ground_potential_storage / 1000000000;
        rectBelow =
          filteredData.value[index].Below_ground_potential_storage / 1000000000;
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

    const centroid = new THREE.Vector3();

    rectangles.forEach((rectangle) => {
      let posX = parseFloat(rectangle.getAttribute("x"));
      let posY = parseFloat(rectangle.getAttribute("y"));
      centroid.x += posX;
      centroid.y += posY;
    });
    centroid.divideScalar(rectangles.length);

    const materialAbove = new THREE.MeshPhongMaterial({
      color: filteredData.value[index].colorAbove,
    });
    const materialBelow = new THREE.MeshPhongMaterial({
      color: filteredData.value[index].colorBelow,
    });
    const meshPositive = new THREE.Mesh(geometryPositive, materialAbove);
    const meshNegative = new THREE.Mesh(geometryNegative, materialBelow);

    const meshData = filteredData.value[index];
    meshPositive.userData = { meshData };
    meshNegative.userData = { meshData };

    const posX = parseFloat(rectangle.getAttribute("x")) - centroid.x;
    const posY = parseFloat(rectangle.getAttribute("y")) - centroid.y;

    meshPositive.position.set(posX, posY, 0);
    meshNegative.position.set(posX, posY, -Math.abs(rectBelow));

    const existingMeshPositive = scene.getObjectByName(`meshPositive${index}`);
    const existingMeshNegative = scene.getObjectByName(`meshNegative${index}`);

    if (existingMeshPositive) scene.remove(existingMeshPositive);
    if (existingMeshNegative) scene.remove(existingMeshNegative);

    meshPositive.name = `meshPositive${index}`;
    meshNegative.name = `meshNegative${index}`;

    scene.add(meshPositive);
    scene.add(meshNegative);
    meshMap.set(filteredData.value[index], { meshPositive, meshNegative });
  });

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  scene.rotation.z = 0;
  scene.rotation.x = -Math.PI / 2;
  scene.rotation.y = 0;

  controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxDistance = 15000;

  controls.minPolarAngle = 0; // 0 degrees
  controls.maxPolarAngle = Math.PI; // 90 degrees

  // controls.minAzimuthAngle = -Infinity;
  // controls.maxAzimuthAngle = Infinity;

  animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
  };

  animate();

  /*console.log(
    camera.position.x.toString(),
    camera.position.y.toString(),
    camera.position.z.toString(),
    camera.rotation.x.toString(),
    camera.rotation.y.toString(),
    camera.rotation.z.toString(),
    camera.zoom.toString()
  );*/
};

console.log("current:", popupBol.value);

window.requestAnimationFrame(() => {
  const event = new Event("pointermove");
  window.dispatchEvent(event);
});

//disable on orbit
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", onObjectClick);
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
  font-family: Arial, Helvetica, sans-serif;
  overflow: hidden; /* Hide scrollbars */
}
.canvas {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 2;
  top: -8px;
  left: -8px;
  margin: none;
  padding: none;
  position: absolute;
}

.controls {
  width: 100%;
  padding: 40px;
  position: fixed; /* Fixed position */
  bottom: 0;
  left: 0; /* Ensure it's aligned to the left */
  z-index: 3;
  display: flex;
  flex-direction: row;
  align-items: flex-end; /* Changed to flex-end */
  justify-content: space-between;
}

.storageControls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  left: 0;
  z-index: 3;
}

.storage-button {
  width: 150px;
  height: 35px;
  padding: 10px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 2px solid #000;
  transition: background-color 0.3s ease-in-out; /* Add transition property */
}

.active {
  background-color: #ccc; /* Change the background color for active button */
}

.storage-radio {
  position: absolute; /* Position the radio button */
  opacity: 0; /* Make the radio button transparent */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.filterControls {
  position: relative;
  width: 50%;
  left: 0;
  z-index: 3;
  display: flex;
  flex-direction: row;
  justify-content: flex-start; /* Changed to flex-start */
  align-items: flex-start; /* Changed to flex-start */
  flex-wrap: wrap; /* Added */
  gap: 10px; /* Added */
}

.filter-button {
  display: flex;
  height: 35px;
  font-size: 16px;
  padding: 10px;
  align-items: center;
  border: 2px solid #000;
  transition: background-color 0.3s ease-in-out; /* Add transition property */
}

.filter-button-active {
  background-color: #ccc; /* Change the background color for active buttons */
}

@media (max-width: 50%) {
  .filterControls {
    justify-content: center;
  }
}

.infoControls {
  position: relative;
  right: 0;
  z-index: 3;
  display: flex;
  flex-direction: row;
  justify-content: flex-end; /* Changed to flex-end */

  gap: 10px; /* Added */
}

.infoButton {
  height: 35px;
  padding: 10px;
  background-color: white;
  display: flex;
  font-size: 16px;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 2px solid #000;
  transition: background-color 0.3s ease-in-out; /* Add transition property */
}

.popupContainer {
  z-index: 5;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4); /* Adjust opacity here */
  display: flex;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
}

.popup {
  padding: 25px;
  z-index: 6;
  width: 300px;
  height: 400px;
  border: solid 2px black;
  background-color: white;
}

.popup-header {
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  width: 100%;
  background-color: white;
}

.popup-close {
  background-color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.popup-title {
  font-weight: bold;
}
</style>