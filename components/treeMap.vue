<template>
  <div>
    <!-- Create a div where the graph will take place -->
    <div class="canvas" ref="canvas"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import data from "~/static/data/data.json";

const canvas = ref(null);

onMounted(async () => {
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
    .append("svg")
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
    const rectangles = svg.selectAll("rect").nodes();

    // Apply the layout to our data
    const nodes = root.descendants();

    create3D(rectangles, nodes);
    console.log(rectangles);
  } catch (error) {
    console.error("Error loading JSON data:", error);
  }
});

const colors = [0x2194ce, 0xff6347, 0x8a2be2, 0x00fa9a, 0xffd700];

const create3D = (rectangles, nodes) => {
  // Create a Three.js scene
  const scene = new THREE.Scene();
  // Create three.js renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  // Set the pixel ratio for better quality on high-density displays
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Append the renderer's DOM element to the canvas div
  canvas.value.appendChild(renderer.domElement);

  const axesHelper = new THREE.AxesHelper(100);
  scene.add(axesHelper);
  scene.background = new THREE.Color(0xffffff); // Set background color to white

  rectangles.forEach((rectangle, index) => {
    let rectWidth = parseFloat(rectangle.getAttribute("width"));
    let rectHeight = parseFloat(rectangle.getAttribute("height"));

    // Use the depth value from the data for extrusion
    let rectDepth = nodes[index].data.depth;

    if (rectDepth === null || rectDepth === undefined) {
      rectDepth = 1;
    }

    console.log("rectWidth:", rectWidth);
    console.log("rectHeight:", rectHeight);
    console.log("rectDepth:", rectDepth);

    // Extrude in the positive direction if the value is positive
    const geometryPositive = new THREE.ExtrudeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(rectWidth, 0),
        new THREE.Vector2(rectWidth, rectHeight),
        new THREE.Vector2(0, rectHeight),
        new THREE.Vector2(0, 0),
      ]),
      { depth: rectDepth, bevelEnabled: false }
    );

    // Extrude in the negative direction if the value is negative
    const geometryNegative = new THREE.ExtrudeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(rectWidth, 0),
        new THREE.Vector2(rectWidth, rectHeight),
        new THREE.Vector2(0, rectHeight),
        new THREE.Vector2(0, 0),
      ]),
      { depth: Math.abs(rectDepth), bevelEnabled: false }
    );

    // Create meshes for positive and negative extrusions
    const material = new THREE.MeshPhongMaterial({
      color: colors[index % colors.length],
    });
    const meshPositive = new THREE.Mesh(geometryPositive, material);
    const meshNegative = new THREE.Mesh(geometryNegative, material);

    // Position the meshes to "kiss" each other
    meshPositive.position.set(
      parseFloat(rectangle.getAttribute("x")),
      parseFloat(rectangle.getAttribute("y")),
      0
    );

    meshNegative.position.set(
      parseFloat(rectangle.getAttribute("x")),
      parseFloat(rectangle.getAttribute("y")),
      -rectDepth
    );

    // Add meshes to the scene
    scene.add(meshPositive);
    scene.add(meshNegative);
  });

  // Add ambient light with increased intensity and white color
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increase intensity and set color to white
  scene.add(ambientLight);

  // Add directional light with increased intensity and white color
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Increase intensity and set color to white
  directionalLight.position.set(1, 1, 1).normalize(); // Adjust position
  scene.add(directionalLight);

  // Create a camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(0, 0, 200); // Adjust camera position

  // Rotate the scene so it is flat on X and Y axis
  scene.rotation.x = -Math.PI / 3;

  // Set up OrbitControls with additional features
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.25; // setting damping factor for smoother motion
  controls.screenSpacePanning = false; // enable/disable screen-space panning
  controls.maxPolarAngle = Math.PI / 2; // limit the polar angle to avoid going upside down

  controls.minPolarAngle = 0; // Adjust as needed
  controls.maxPolarAngle = Math.PI; // Adjust as needed

  const animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    // Update the OrbitControls
    controls.update();
  };

  animate();
  camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene
};
</script>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
}
</style>
