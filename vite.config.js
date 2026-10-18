// vite.config.js - Vite Configuration for "A Date in Dhaka"
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

function staticAssetsPlugin(dirs = ["audio", "images", "css"]) {
  return {
    name: "static-assets-handler",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const decodedUrl = decodeURIComponent(req.url.split("?")[0]);
        for (const dir of dirs) {
          if (decodedUrl === `/${dir}` || decodedUrl.startsWith(`/${dir}/`)) {
            const relPath = decodedUrl.replace(/^\//, "");
            const filePath = path.resolve(process.cwd(), relPath);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap = {
                ".m4a": "audio/mp4",
                ".mp3": "audio/mpeg",
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".svg": "image/svg+xml",
                ".css": "text/css",
                ".js": "text/javascript",
                ".json": "application/json"
              };
              if (mimeMap[ext]) {
                res.setHeader("Content-Type", mimeMap[ext]);
              }
              const stream = fs.createReadStream(filePath);
              return stream.pipe(res);
            }
          }
        }
        next();
      });
    },
    closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      for (const dir of dirs) {
        const srcDir = path.resolve(process.cwd(), dir);
        const destDir = path.resolve(outDir, dir);
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true });
        }
      }
      const phaserSrc = path.resolve(process.cwd(), "js/phaser.min.js");
      const phaserDestDir = path.resolve(outDir, "js");
      if (fs.existsSync(phaserSrc)) {
        fs.mkdirSync(phaserDestDir, { recursive: true });
        fs.copyFileSync(phaserSrc, path.resolve(phaserDestDir, "phaser.min.js"));
      }
    }
  };
}

export default defineConfig({
  plugins: [staticAssetsPlugin()],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext"
  }
});
