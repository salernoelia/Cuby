<template>
  
  <div>
    <!-- Create a div where the graph will take place -->
    <div class="myDataviz" ref="myDataviz"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';
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

  // Read JSON data
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
    svg
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

    // and to add the text labels
    svg
      .selectAll('text')
      .data(root.leaves())
      .enter()
      .append('text')
      .attr('x', (d) => d.x0 + 10)
      .attr('y', (d) => d.y0 + 20)
      .text((d) => d.data.Habitat_name)
      .attr('font-size', '15px')
      .attr('fill', 'white');
  } catch (error) {
    console.error('Error loading JSON data:', error);
  }
});
</script>


<style scoped>
/* Add any additional styles if needed */
</style>
