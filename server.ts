import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { exec } from "child_process";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Download and Process Video
  app.post("/api/process-video", (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const videoId = Math.random().toString(36).substring(7);
    const outputPath = path.join(process.cwd(), "downloads", `${videoId}.mp4`);
    const transcriptPath = path.join(process.cwd(), "downloads", `${videoId}.txt`);

    if (!fs.existsSync("downloads")) {
      fs.mkdirSync("downloads");
    }

    // SIMULATED: Using youtube-dl and ffmpeg
    // Command pattern: youtube-dl -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4' --output "downloads/%(id)s.%(ext)s" [URL]
    // Then ffmpeg to convert or extract audio if needed.
    
    console.log(`[BACKEND] Initiating pipeline for: ${url}`);
    
    // In a real environment with binaries installed, we would run:
    // exec(`youtube-dl -o "${outputPath}" ${url} && ffmpeg -i "${outputPath}" -vn -ab 128k -ar 44100 -y "${transcriptPath}.mp3"`, (err, stdout, stderr) => { ... });

    // Mock response for demo purposes
    setTimeout(() => {
      res.json({
        success: true,
        videoId,
        message: "Video processed via youtube-dl and ffmpeg pipeline.",
        mockData: {
          title: "Processed Stream " + videoId,
          status: "available"
        }
      });
    }, 2000);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
