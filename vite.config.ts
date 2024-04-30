/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  build: {
    lib: {
      entry: "./src/main.ts",
      name: "web-storage-cache-crypto",
      fileName: "web-storage-cache-crypto",
    },
  },
});
