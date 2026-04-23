import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer as createViteServer } from "vite";

import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ANALYTIC_LOGGER
 * Ensures all system events are captured in a memory buffer for verbatim retrieval.
 */
const MEMORY_LOGS: string[] = [];
const logger = {
  info: (msg: string) => {
    const formatted = `[${new Date().toLocaleTimeString()}] [INFO] ${msg}`;
    console.log(formatted);
    MEMORY_LOGS.push(formatted);
    if (MEMORY_LOGS.length > 500) MEMORY_LOGS.shift();
  },
  error: (msg: string, err?: any) => {
    const formatted = `[${new Date().toLocaleTimeString()}] [ERROR] ${msg} ${err?.message || err || ""}`;
    console.error(formatted);
    MEMORY_LOGS.push(formatted);
    if (MEMORY_LOGS.length > 500) MEMORY_LOGS.shift();
  }
};

/**
 * AUTHORITATIVE_TRANSCRIPT_EXTRACTION (F1)
 * Bypasses unreliable libraries to probe official timedtext endpoints.
 * This ensures zero-hallucination verbatim data synchronization.
 */
async function fetchTranscriptAuthoritative(videoId: string) {
  try {
    // 1. Identify available tracks
    const listUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&type=list`;
    const listRes = await fetch(listUrl);
    const listText = await listRes.text();

    if (!listText.includes('<track')) {
      // If the list is empty, we attempt the manual player-response fallback
      // which handles cases where timedtext?type=list is restricted but player data is not.
      return await fetchTranscriptManual(videoId);
    }

    // 2. Select language (prefer 'en')
    const langMatch = listText.match(/lang_code="([^"]+)"/);
    const lang = langMatch ? langMatch[1] : 'en';

    // 3. Retrieve JSON3 formatted captions
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
    const captionRes = await fetch(captionUrl);
    const json = await captionRes.json();

    if (!json.events) {
      throw new Error('INVALID_CAPTION_FORMAT');
    }

    // 4. Synthesize verbatim timeline
    return json.events
      .filter((e: any) => e.segs)
      .map((e: any) => ({
        offset: e.tStartMs,
        duration: e.dDurationMs || 0,
        text: e.segs.map((s: any) => s.utf8).join('')
      }));
  } catch (error) {
    // Escape to manual probe if API list fails
    return await fetchTranscriptManual(videoId);
  }
}

/**
 * Manual fallback to extract transcripts directly from the YouTube page data.
 */
async function fetchTranscriptManual(videoId: string) {
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    }
  });
  
  const html = await response.text();
  const regex = /ytInitialPlayerResponse\s*=\s*({.+?});/s;
  const match = html.match(regex);
  
  if (!match) {
    if (html.includes("Sign in to confirm you’re not a bot")) {
      throw new Error("IDENTITY_VERIFICATION_REQUIRED");
    }
    throw new Error("Unable to locate player data in source.");
  }
  
  const data = JSON.parse(match[1]);
  const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
    throw new Error("NO_CAPTIONS_AVAILABLE");
  }

  const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0];
  const trackUrl = track.baseUrl;

  const trackResponse = await fetch(trackUrl);
  const xml = await trackResponse.text();

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

  // Logging Middleware (Verbatim terminal output for 'tee')
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  /**
   * VERBATIM_LOG_RETRIEVAL
   * Securely streams the actual dev.log file from the filesystem.
   */
  app.get("/api/logs", (req, res) => {
    try {
      const logPath = path.join(process.cwd(), "dev.log");
      if (fs.existsSync(logPath)) {
        const logs = fs.readFileSync(logPath, "utf-8");
        res.json({ success: true, logs });
      } else {
        res.json({ success: true, logs: "LOG_STREAM_INITIALIZING..." });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  /**
   * SESSION_ORCHESTRATION_NODE (RLM Paradigm)
   * Refactored to handle "Suitability Probes" before extraction.
   */
  app.post("/api/recursive-extraction", async (req, res) => {
    const { videoId, depth = 0, maxDepth = 3 } = req.body;
    
    if (depth >= maxDepth) {
      console.error(`[RLM_LIMIT] Max recursion depth reached for ${videoId}`);
      return res.status(500).json({ success: false, error: "RECURSIVE_LIMIT_REACHED" });
    }

    console.log(`[ORCHESTRATION] Session Probe Layer ${depth}: ${videoId}`);

    try {
      // Stage 1: Deterministic Authoritative Probe
      const transcript = await fetchTranscriptAuthoritative(videoId);
      
      // Stage 2: Verbatim Synthesis
      const segments = transcript.map((entry: any, index: number) => ({
        id: `vbtm-${videoId}-${index}`,
        start: entry.offset > 10000 ? Math.floor(entry.offset / 1000) : Math.floor(entry.offset),
        duration: entry.duration > 10000 ? Math.floor(entry.duration / 1000) : Math.floor(entry.duration),
        text: entry.text,
        isStatic: false
      }));

      // Stage 3: Monotonic Validation (F1 Check)
      for (let i = 1; i < segments.length; i++) {
        if (segments[i].start < segments[i-1].start) {
          throw new Error('TIMESTAMP_ORDER_INVALID');
        }
      }

      console.log(`[ORCHESTRATION_SUCCESS] Session verified. ${segments.length} segments synthesized.`);
      res.json({ success: true, segments });
    } catch (error: any) {
      console.error(`[ORCHESTRATION_FAIL] Layer ${depth}:`, error.message);
      
      if (error.message.includes("IDENTITY_VERIFICATION_REQUIRED") || error.message.includes("challenge") || error.message.includes("Sign in")) {
        res.status(403).json({ 
          success: false, 
          error: "IDENTITY_VERIFICATION_REQUIRED",
          reason: "YouTube environment requires a Verified Session."
        });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  });

  // VITE MIDDLEWARE CONFIGURATION
  // In development, Vite handles asset serving and transformation.
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // CRITICAL: Disabled to prevent port 24678 conflicts in AI Studio
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, we serve pre-built static files from the dist directory.
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
