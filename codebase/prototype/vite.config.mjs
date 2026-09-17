import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { aiReviewPlugin } from "./server/vite-ai-plugin.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    build: {
      outDir: "dist/client",
    },
    optimizeDeps: {
      include: ["react", "react-dom/client"],
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      warmup: {
        clientFiles: ["./src/main.jsx"],
      },
    },
    plugins: [
      aiReviewPlugin({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || "gpt-5-mini",
        logPath: path.resolve(env.AI_LOG_PATH || "./logs/ai-calls.jsonl"),
        fetchImpl: fetch,
      }),
      react(),
    ],
  };
});
