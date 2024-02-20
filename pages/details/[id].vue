<template>
  <div>
    <div>
      <div>
        <div>
          <h1>{{ selectedData.Habitat_name }}</h1>
          <p>{{ selectedData.Habitat_type }}</p>
          <p>{{ selectedData.Habitat_description }}</p>
          <p>{{ selectedData.Case_Study_Conservation }}</p>
          <p>{{ selectedData.Case_Study_Regeneration }}</p>
          <p>{{ selectedData.References }}</p>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import data from "~/static/data/data.json";
import { userStore } from "../store/ustore.js";

let selectedData = ref(null);

const ustore = userStore();

selectedData = data.find((p) => p.id === ustore.clickedData);
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, Helvetica, sans-serif;
  overflow: hidden; /* Hide scrollbars */
}
</style>
