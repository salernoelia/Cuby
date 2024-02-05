<template>
    <div>
      <div ref="my_dataviz"></div>
      <button v-for="(status, habitat) in filters" :key="habitat" @click="toggleFilter(habitat)">
        {{ habitat }}: {{ status ? 'ON' : 'OFF' }}
      </button>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import data from '~/static/data/data.json';
  
  export default {
    data() {
      return {
        filters: {},
      };
    },
    mounted() {
      this.createTreemap();
      this.create3DScene();
    },
    methods: {
      createTreemap() {
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };
      const width = 445 - margin.left - margin.right;
      const height = 445 - margin.top - margin.bottom;

      const svg = d3
        .select('#my_dataviz')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Use your data instead of data from the example
      const root = d3
        .stratify()
        .id(function (d) {
          return d.Habitat_name;
        })
        .parentId(function (d) {
          // Provide the parent ID property based on your data structure
          return d.parent;
        })(data);

      root.sum(function (d) {
        return +d.Normalized_above_ground_potential_storage;
      });

      d3.treemap().size([width, height]).padding(4)(root);

      svg
        .selectAll('rect')
        .data(root.leaves())
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return d.x0;
        })
        .attr('y', function (d) {
          return d.y0;
        })
        .attr('width', function (d) {
          return d.x1 - d.x0;
        })
        .attr('height', function (d) {
          return d.y1 - d.y0;
        })
        .style('stroke', 'black')
        .style('fill', '#69b3a2');

      svg
        .selectAll('text')
        .data(root.leaves())
        .enter()
        .append('text')
        .attr('x', function (d) {
          return d.x0 + 10;
        })
        .attr('y', function (d) {
          return d.y0 + 20;
        })
        .text(function (d) {
          return d.data.Habitat_name;
        })
        .attr('font-size', '15px')
        .attr('fill', 'white');
      },
      create3DScene() {
        const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.getElementById('my_dataviz').appendChild(renderer.domElement);

      // Your Three.js code for scene creation

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = true;

      // Handle window resize
      window.addEventListener('resize', function () {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      });

      // Animate the scene
      const animate = function () {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();
      },
      toggleFilter(habitat) {
        this.filters[habitat] = !this.filters[habitat];
        // Update your treemap and three.js scene based on filters
      },
    },
  };
  </script>
  
  <style>
  /* Add your styles here */
  </style>
  