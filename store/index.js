import { createStore } from 'vuex';

export default createStore({
  state() {
    return {
      buttonClicked: false,
    };
  },
  mutations: {
    setButtonClicked(state, value) {
      state.buttonClicked = value;
    },
  },
});