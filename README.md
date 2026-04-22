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
*   **EDL Editor Pipeline**: A built-in "Editor Mode" that allows analysts to mark In/Out points and export precise sub-clips for stakeholder reviews.

---

## 🎬 Advanced Editor Mode (EDL Pipeline)

The system includes a professional Edit Decision List (EDL) utility for rapid content repurposing.

1.  **Toggle Editor Mode**: Enable the "Editor Mode" switch in the header.
2.  **Mark In/Out Points**: 
    *   Navigate to your desired start time and hit **"Set In"**.
    *   Navigate to your end time and hit **"Set Out"**.
    *   The scrubber will visualize your selection window with high-contrast emerald and rose markers.
3.  **Export & Process**:
    *   Click **"Export Clip"** to send the EDL to the backend.
    *   The server-side pipeline executes a precise `ffmpeg` slice:
        `ffmpeg -ss [start] -i [input] -to [duration] -c copy output.mp4`

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

## 🔬 Architectural Influences & Competitive Analysis

This suite was informed by industry-leading open-source repos and analysis platforms:

1.  **[CVAT (Computer Vision Annotation Tool)](https://github.com/cvat-ai/cvat)**:
    *   *System Influence*: Structured "Jobs" and "Task" management.
    *   *Recommended Feature*: **Spatial Annotation Overlays**. Implementing a canvas layer over the IFrame to allow analysts to "circle" UI bugs directly on the video frame.
2.  **[Label Studio](https://github.com/HumanSignal/label-studio)**:
    *   *System Influence*: Multi-modal data support.
    *   *Recommended Feature*: **Configurable Labeling Interface**. Allowing users to define custom "tags" (e.g., [CRITICAL_BUG], [UX_DELIGHT]) that appear as color-coded heatmaps on the scrubber.
3.  **[Remotion](https://github.com/remotion-dev/remotion)**:
    *   *System Influence*: React-based timeline composition.
    *   *Recommended Feature*: **Visual Overlays on Export**. When exporting a clip via the EDL Pipeline, automatically burn-in the project name and timestamp for stakeholder clarity.

---

## 🗺 Feature Roadmap (High-ROI Enhancements)

Based on a review of top-performing video repositories, these features are prioritized for v3.0:

*   **⌨️ Power-User Hotkeys**: 
    - `I` / `O`: Set In/Out points.
    - `SPACE`: Play/Pause toggle.
    - `J` / `L`: Frame-accurate step backward/forward (100ms precision).
*   **🤖 AI Auto-Chaptering**: Leverage the `@google/genai` SDK to automatically segment tracks based on visual scene changes (e.g., "Login Screen" -> "Dashboard" -> "Checkout").
*   **👯 Synchronized A/B Comparison**: A dual-player view for comparing "Before" and "After" versions of a feature rollout, with perfectly locked playheads.
*   **🔗 Deep-Link Export**: Direct `&t=` URL generation that opens the app specifically to the active EDL selection segment.

---

## 🏗 Key Architectural Pillars (Verbatim References)

> **High-Resolution Thumbnails**
> "thumbnail of selected video is blocky, use higher resolution" -> *Applied `image-rendering: high-quality` CSS and `hqdefault` YouTube sources.*

> **Transcript Intelligence**
> "let users scrub through the video based on those transcript segments." -> *Mapped segments in `src/data.ts` to atomic `start` integers for 1:1 playhead sync.*

> **Status Flagging**
> "'active projects' list should flag unavailable videos" -> *Implemented `VideoStatus` type with rose-500 pulse indicators.*

---

## 🛠 Troubleshooting & Best Practices

The application implements cutting-edge patterns to resolve common playback and extraction hurdles.

### 1. "Establishing Peer Connection" hangs
**Root Cause**: YouTube's IFrame API requires a valid `origin` parameter and an active socket to communicate `postMessage` events. 
**Resolution**:
- Ensure your browser is not blocking 3rd-party cookies.
- If the loader persists, click the video once to initiate the YouTube session; the UI will sync the playhead automatically once established.

### 2. Invalid Video IDs
**Root Cause**: Standard regex often fails on `youtube.com/shorts/` or complex URLs with UTM parameters.
**Resolution**: We use a **High-Entropy Regex** parser that extracts IDs from standard, short, and embedded formats:
`/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i`

### 3. Out-of-sync Scrubber
**Root Cause**: Local React state can drift from the IFrame's actual position due to network lag.
**Resolution**: Implemented a **Polling Synchronizer** that listens for `infoDelivery` messages from the YouTube API, forcing the React `currentTime` to stay locked to the source content.

### 4. Docker Dependency Failures
**Root Cause**: `ffmpeg` extraction requires specific codecs that are often missing in slim images.
**Resolution**: The `Dockerfile` uses **Ubuntu 22.04 LTS** as its base layer to ensure maximum compatibility with `libavcodec` and `yt-dlp` dependencies.
