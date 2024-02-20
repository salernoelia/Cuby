import { defineStore } from "pinia";

export const userStore = defineStore("useUserStore", {
  state: () => {
    return {
      clickedData: null,
    };
  },
  actions: {},
});
