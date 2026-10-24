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
                ".webp": "image/webp",
                ".svg": "image/svg+xml",
                ".css": "text/css",
                ".js": "text/javascript",
                ".json": "application/json"
              };
              if (mimeMap[ext]) {
                res.setHeader("Content-Type", mimeMap[ext]);
              }

              // CDN simulation: CORS and Byte-Range (HTTP 206) support for efficient audio & image streaming
              res.setHeader("Accept-Ranges", "bytes");
              res.setHeader("Access-Control-Allow-Origin", "*");
              res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
              res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

              const stat = fs.statSync(filePath);
              const fileSize = stat.size;
              const range = req.headers.range;

              if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                if (!isNaN(start) && start < fileSize) {
                  const safeEnd = Math.min(end, fileSize - 1);
                  const chunkSize = (safeEnd - start) + 1;
                  res.writeHead(206, {
                    "Content-Range": `bytes ${start}-${safeEnd}/${fileSize}`,
                    "Content-Length": chunkSize
                  });
                  const stream = fs.createReadStream(filePath, { start, end: safeEnd });
                  return stream.pipe(res);
                }
              }

              res.setHeader("Content-Length", fileSize);
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
