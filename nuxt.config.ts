// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  modules: ["@pinia/nuxt"],
  css: ["/assets/css/global.scss"],
});
