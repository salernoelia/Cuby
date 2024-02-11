// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ["@pinia/nuxt"],
  generate: {
    fallback: "404.html",
    dir: ".output",
  },

  target: "static", // and static, nuxt generates a SPA
});
