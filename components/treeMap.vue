<template>
  
  <div>
    <!-- Create a div where the graph will take place -->
    <div class="myDataviz" ref="myDataviz"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import data from '~/static/data/data.json';

const myDataviz = ref(null);

onMounted(async () => {
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 445 - margin.left - margin.right;
  const height = 445 - margin.top - margin.bottom;

  // Wait for the element to be available in the DOM
  await new Promise((resolve) => {
    const checkElement = () => {
      if (myDataviz.value) {
        resolve();
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    checkElement();
  });

  // append the svg object to the body of the page
  const svg = d3
    .select(myDataviz.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

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
      .selectAll('rect')
      .data(root.leaves())
      .enter()
      .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .style('stroke', 'black')
      .style('fill', '#69b3a2');

    // Call the create3D function in onMounted after appending the SVG
 create3D(root.leaves(), rects);
  } catch (error) {
    console.error('Error loading JSON data:', error);
  }
});

const create3D = (data, svgRects) => {
  const cubeMap = new Map();
  // Initialize Three.js scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Create extrusion material
  const material = new THREE.MeshBasicMaterial({ color: 0x69b3a2, wireframe: true });

  renderer.setClearColor(0xffffff);

// Set up lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);

scene.add(ambientLight);
scene.add(directionalLight);

// Extrude the rectangles based on "Above_ground_current_storage"
data.forEach((d, index) => {
  const extrusionHeight = d.data.Above_ground_current_storage / 100000;
  const geometry = new THREE.BoxGeometry(d.x1 - d.x0, extrusionHeight, d.y1 - d.y0);
  const cube = new THREE.Mesh(geometry, material);

  // Position the cubes in 3D space
  cube.position.set(d.x0 + (d.x1 - d.x0) / 2, extrusionHeight / 2, d.y0 + (d.y1 - d.y0) / 2);

  // Add the cube to the scene
  scene.add(cube);

  // Store the association in the map
  cubeMap.set(svgRects._groups[0][index], cube);
});

  // Set up orbit controls for interaction
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = true;

  // Set up camera position
  camera.position.z = 5;

   // Render loop
   const animate = () => {
    requestAnimationFrame(animate);
    controls.update();

    // Sync D3 rectangles with corresponding Three.js cubes
    svgRects.each((d, index) => {
      const cube = cubeMap.get(svgRects._groups[0][index]);
      if (cube) {
        cube.scale.y = d.data.Above_ground_current_storage / 100000;
        cube.position.y = cube.scale.y / 2; // Adjust position based on scale
      }
    });

    renderer.render(scene, camera);
  };

  animate();
};



</script>


<style scoped>
/* Add any additional styles if needed */
</style>
