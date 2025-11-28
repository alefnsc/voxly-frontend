import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', 
    setupNodeEvents(on, config) {
      config.defaultCommandTimeout = 90000; // 10 segundos
      config.requestTimeout = 95000; // 15 segundos
      config.responseTimeout = 95000; // 15 segundos
      config.pageLoadTimeout = 90000; // 60 segundos
    },
  },
});
