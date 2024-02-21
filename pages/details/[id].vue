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

import data from "~/static/data/data.json";
import { userStore } from "../store/ustore.js";

/*-------------------*/
// Fetching Link and building Datapointer

const ustore = userStore();

const currentURL = window.location.href;
const lastPartOfURL = currentURL.substring(currentURL.lastIndexOf("/") + 1);
const selectedData = data.find((p) => p.Habitat_link === lastPartOfURL);

/*-------------------*/
// Three.js
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
  padding: 3em;
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
