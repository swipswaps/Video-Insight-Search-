import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as pkg from "./node_modules/youtube-transcript/dist/youtube-transcript.esm.js";
const { fetchTranscript: libraryFetchTranscript } = pkg;
import { createServer as createViteServer } from "vite";

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manual fallback to extract transcripts directly from the YouTube page data.
 * This is used when the library scraper is blocked or fails to find tracks.
 */
async function fetchTranscriptManual(videoId: string) {
  // Use desktop URL with high-fidelity headers to mimic a real browser
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Cache-Control": "max-age=0",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1"
    }
  });
  
  const html = await response.text();
  
  // Look for the initial data blob which contains caption tracks
  const regex = /ytInitialPlayerResponse\s*=\s*({.+?});/s;
  const match = html.match(regex);
  
  if (!match) {
    if (html.includes("Sign in to confirm you’re not a bot")) {
      throw new Error("YouTube blocked the automated probe (Bot Challenge). Switch to AI Research mode.");
    }
    throw new Error("Unable to locate player data in source.");
  }

  const data = JSON.parse(match[1]);
  const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
    throw new Error("No caption tracks detected in player response. Subtitles may be restricted.");
  }

  // Prefer English (en) or the first available track
  const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0];
  const trackUrl = track.baseUrl;

  const trackResponse = await fetch(trackUrl);
  const xml = await trackResponse.text();

  // Simple XML parser for the timed text format
  const segments = [];
  const textRegex = /<text start="([\d.]+)" dur="([\d.]+)".*?>(.*?)<\/text>/g;
  let textMatch;
  
  while ((textMatch = textRegex.exec(xml)) !== null) {
    segments.push({
      offset: parseFloat(textMatch[1]) * 1000,
      duration: parseFloat(textMatch[2]) * 1000,
      text: textMatch[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    });
  }

  return segments;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Upgrade / Git Sync Pipeline
  app.get("/api/upgrade/check", async (req, res) => {
    try {
      await execPromise("git fetch --quiet");
      const { stdout: local } = await execPromise("git rev-parse HEAD");
      const { stdout: remote } = await execPromise("git rev-parse @{u}");
      
      res.json({ 
        updatable: local.trim() !== remote.trim(),
        local: local.trim().substring(0, 7),
        remote: remote.trim().substring(0, 7)
      });
    } catch (e) {
      res.status(500).json({ error: "Git environment detached or unavailable." });
    }
  });

  app.post("/api/upgrade/apply", async (req, res) => {
    try {
      const { stdout } = await execPromise("git pull --force && npm install");
      res.json({ success: true, log: stdout });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // API Route to fetch verbatim YouTube transcripts
  app.get("/api/transcript/:videoId", async (req, res) => {
    const { videoId } = req.params;
    console.log(`[VERBATIM_LOG] Fetching transcript for: ${videoId}`);
    
    try {
      let transcript;
      try {
        // Stage 1: Official/Library Scraper
        transcript = await libraryFetchTranscript(videoId);
      } catch (e) {
        console.warn(`[VERBATIM_PIPELINE] Library fetch failed for ${videoId}, attempting manual fallback...`);
        // Stage 2: Manual Browser-like Scraper
        transcript = await fetchTranscriptManual(videoId);
      }
      
      // Map to our internal TranscriptSegment format
      const segments = transcript.map((entry, index) => {
        // Library usually returns seconds, but some sources might return ms.
        // We ensure we have seconds for the frontend Timeline.
        const start = entry.offset > 10000 ? Math.floor(entry.offset / 1000) : Math.floor(entry.offset);
        const duration = entry.duration > 10000 ? Math.floor(entry.duration / 1000) : Math.floor(entry.duration);
        
        return {
          id: `yt-${videoId}-${index}`,
          start,
          duration,
          text: entry.text,
          isStatic: false
        };
      });

      res.json({ success: true, transcripts: segments });
    } catch (error) {
      console.error(`[VERBATIM_ERROR] Failed to fetch transcript:`, error);
      res.status(500).json({ 
        success: false, 
        error: "Verbatim transcript unavailable or disabled for this video." 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR to prevent port 24678 conflicts in this environment
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
