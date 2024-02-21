// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ["@pinia/nuxt"],
  css: ["/assets/css/global.scss"],
});
