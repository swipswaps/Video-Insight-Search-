# Video Insight Search (v2.4)

A professional-grade, high-density dashboard built for identifying friction points in user feedback, technical logs, and strategic visual showcases.

---

## 🕰 How We Got Here (The Evolution)

The project began as a concept for a **"Vite video slider selector"** tasked with reviewing transcripts and YouTube timelines. Through iterative development, it transformed into a mission-critical tool for data analysis.

1.  **Phase 1: The Foundation**
    *   *Requirement*: "make a vite video slider selector that lists and displays thumbnails and reviews... using transcripts and youtube timeline marks"
    *   *Action*: Established the core React 19 architecture and integrated the YouTube IFrame API for programmatic control.
2.  **Phase 2: The "High Density" Overhaul**
    *   *Requirement*: "Apply the 'High Density' design theme to the app."
    *   *Action*: Migrated from a generic UI to a **Slate-950 and Emerald-500** professional palette. Implemented tight typographic scales (`text-[9px]`) and a three-column layout to maximize information throughput.
3.  **Phase 3: The Error-Aware Pipeline**
    *   *Requirement*: "active projects list should flag unavailable videos"
    *   *Action*: Introduced the **Unavailable Video Intelligence** system, using rose-colored status indicators and `AlertTriangle` overlays to warn users of broken source data.
4.  **Phase 4: Full-Stack Transition**
    *   *Requirement*: "use youtube-dl and ffmpeg to download and convert... use docker to manage dependencies"
    *   *Action*: Moved from a client-only demo to a **Full-Stack Express + Vite** infrastructure, dockerized with Ubuntu 22.04 base to support the heavy media processing binaries needed for scale.

---

## 📍 Where We Are (Current Status)

Today, **Video Insight Search** is a comprehensive **Video Discovery (VID)** suite. 

*   **Intelligent Prioritization**: The system automatically pulls "Problem Projects" (Unavailable videos) to the top of the feed while collapsing healthy videos into a minimal mini-player view.
*   **High-Fidelity Visuals**: Every thumbnail uses `image-rendering: high-quality` and `hqdefault` sources to prevent the "blocky" artifacts common in automated extraction.
*   **Deep Discovery**: A relevance-weighted search engine that indexes timestamps across transcripts and community comments simultaneously.

---

## ⚙️ How It All Works (The Mechanics)

### 1. The Search Engine (Weighted Efficacy)
The app uses a single-pass `for...of` loop optimized with `useMemo`. We measure **Search Score** to prioritize results:
```typescript
score: (titleMatch ? 10 : 0) + transcriptMatches.length + commentMatches.length
```
This ensures a project name match always outranks a mention in the 40th minute of a transcript.

### 2. The YouTube Bridge (Precise Scrubbing)
Communication with the video player happens via an asynchronous message bridge. When a user clicks a transcript segment, we dispatch a command to the iframe:
```javascript
videoRef.current.contentWindow.postMessage(
  JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), 
  '*'
)
```

### 3. The Backend Processing Pipeline
When a new link is added via the **"Add Videos"** UI, the frontend initiates an API call to the Express server:
*   **Endpoint**: `/api/process-video`
*   **Binary Trigger**: The server (inside Docker) is pre-configured with `yt-dlp` and `ffmpeg`.
*   **Workflow**: The server probes the URL -> extracts metadata -> simulates the transcription job -> returns a ready-to-index status.

---

## 🚀 Quick Start

### Installation
1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   npm install
   ```
2. **Launch development environment**:
   ```bash
   npm run dev
   ```
   > **Note**: The system executes a `predev` script to check for remote updates: `git fetch --quiet && [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]`.

---

## 🐳 Docker Architecture
Dependency management is handled via Docker to ensure `ffmpeg` and `python` environments are consistent.
```bash
docker build -t video-insight-search .
docker run -p 3000:3000 video-insight-search
```
**Image Contents**: Ubuntu 22.04 + Node.js 20 + Python 3 (youtube-dl) + FFmpeg.

---

## 🏗 Key Architectural Pillars (Verbatim References)

> **High-Resolution Thumbnails**
> "thumbnail of selected video is blocky, use higher resolution" -> *Applied `image-rendering: high-quality` CSS and `hqdefault` YouTube sources.*

> **Transcript Intelligence**
> "let users scrub through the video based on those transcript segments." -> *Mapped segments in `src/data.ts` to atomic `start` integers for 1:1 playhead sync.*

> **Status Flagging**
> "'active projects' list should flag unavailable videos" -> *Implemented `VideoStatus` type with rose-500 pulse indicators.*
