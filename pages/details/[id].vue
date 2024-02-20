<template>
  <div>
    <div>
      <div>
        <div>
          <h1>{{ selectedData.Habitat_name }}</h1>
          <p>{{ selectedData.Habitat_type }}</p>
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

<style lang="scss" scoped></style>
