// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ["@pinia/nuxt"],
  generate: {
    nojekyll: true, //not working on this version
    fallback: "404.html",
  },
  router: {
    base: "/Cuby/",
  },
  target: "static", // and static, nuxt generates a SPA
});
