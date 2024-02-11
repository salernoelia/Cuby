// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  modules: ["@pinia/nuxt"],
  app: {
    baseURL: "/cuby/",
  },
  target: "static", // and static, nuxt generates a SPA
});
