import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { exec } from "child_process";
import fs from "fs";

/**
 * Server initialization and entry point for the VID pipeline backend.
 * Orchestrates Vite middleware for HMR and custom API endpoints for media processing.
 */
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing for inbound API requests
  app.use(express.json());

  /**
   * API Route: Download and Process Video
   * 
   * This endpoint serves as the ingestion gateway for the VID pipeline.
   * It simulates the interaction with heavy media binaries (ffmpeg, yt-dlp)
   * while providing a standard JSON interface for the frontend.
   */
  app.post("/api/process-video", (req, res) => {
    const { url } = req.body;

    // Guard clause: Ensure a valid target URL is provided
    if (!url) {
      return res.status(400).json({ error: "Target URL is strictly required for pipeline ingestion." });
    }

    // Generate a unique identifier for the specific processing job
    const videoId = Math.random().toString(36).substring(7);
    const downloadsDir = path.join(process.cwd(), "downloads");
    const outputPath = path.join(downloadsDir, `${videoId}.mp4`);

    // Ensure persistence directory exists; idempotent check
    if (!fs.existsSync(downloadsDir)) {
      try {
        fs.mkdirSync(downloadsDir, { recursive: true });
      } catch (err) {
        console.error(`[FS_ERROR] Failed to establish downloads directory: ${err}`);
      }
    }

    /**
     * @SIMULATED_PIPELINE
     * 
     * In a live production environment, this node would spawn a child process
     * to execute media extraction and transcription:
     * 
     * 1. youtube-dl --extract-audio --audio-format mp3 -o "%(id)s.%(ext)s" [URL]
     * 2. ffmpeg -i [AUDIO] -f segments -segment_time 10 [PROBES]
     * 3. Send segments to OpenAI Whisper for local transcription.
     */
    console.log(`[PIPELINE_INIT] Source: ${url} | Job_ID: ${videoId}`);
    
    // Asynchronous mock response to simulate I/O wait latency
    setTimeout(() => {
      res.json({
        success: true,
        videoId,
        metadata: {
          processedAt: new Date().toISOString(),
          pipelineVersion: "v2.4",
          node: "AIS-VID-SERVER"
        },
        message: "Source ingested successfully. Background extraction triggered.",
        mockData: {
          title: "Stream Pipeline: " + videoId,
          status: "available",
          duration: 1200 + Math.floor(Math.random() * 2400) // 20 to 60 minutes
        }
      });
    }, 2000);
  });

  /**
   * API Route: Export Video Clip (EDL Processor)
   * 
   * This endpoint processes an Edit Decision List (EDL) using ffmpeg 
   * to slice a specific segment with high precision.
   */
  app.post("/api/export-clip", (req, res) => {
    const { videoId, in: inPoint, out: outPoint, title } = req.body;
    
    if (inPoint === undefined || outPoint === undefined) {
      return res.status(400).json({ error: "In/Out points are required for EDL exportation." });
    }

    const jobId = Math.random().toString(36).substring(7);
    console.log(`[EDL_PROCESSOR] Exporting clip: ${title} | Range: ${inPoint}s -> ${outPoint}s | Job: ${jobId}`);

    /**
     * @SIMULATED_FFMPEG_EDL
     * 
     * command: ffmpeg -ss [inPoint] -i [input_source] -to [outPoint - inPoint] -c copy [outputPath]
     */
    
    setTimeout(() => {
      res.json({
        success: true,
        jobId,
        exportUrl: `https://storage.googleapis.com/vid-suite-exports/${jobId}.mp4`,
        metadata: {
          originalId: videoId,
          duration: outPoint - inPoint,
          precision: "accurate-frame"
        }
      });
    }, 1500);
  });

  /**
   * Environment Routing Logic
   * 
   * PRODUCTION: Serves pre-compiled static assets from the /dist directory.
   * DEVELOPMENT: Injects Vite HMR middleware for ultra-fast component iterations.
   */
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Vite middleware MUST be applied after custom API routes to avoid path shadowing
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback: Routes all non-file requests to index.html for client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server to all network interfaces for container compatibility
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BOOT] VID Suite operational at http://localhost:${PORT}`);
  });
}

startServer();
