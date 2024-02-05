<template>
  <div>
    <div class="main">
      <!-- <BoxGraph></BoxGraph> -->
      <treeMap/>
    </div>
  </div>
</template>

<style scoped>
body {
  top: 0;
  overflow: hidden;
  overflow-y: hidden;
  overflow-x: hidden;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: relative;
}

.gui {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none; /* Let pointer events pass through initially */
}

.gui button {
  /* Specific styling for your buttons */
  margin: 20px;
  pointer-events: auto; /* Enable pointer events for buttons within the GUI */
}

/* Capture pointer events for the BoxGraph when not hovering over the GUI */
.main:hover .BoxGraph {
  pointer-events: auto;
}

.BoxGraph {
  pointer-events: none; /* Initially let pointer events pass through */
}
</style>

<script>
export default {
  methods: {
    handleButtonClick() {
      // Handle button click event
      console.log('Button clicked!');
    },
  },
};
</script>
