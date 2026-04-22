# Video Insight Search

A professional-grade Video Discover & Discovery Discovery (VID) dashboard built for identifying friction points in user feedback, technical logs, and artistic showcases.

## 🚀 Quick Start

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd video-insight-search
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Launch development environment**:
   ```bash
   npm run dev
   ```
   > **Note**: The application is configured to run on port `3000`. Every time you run this command, the system executes a `predev` script to check for remote updates:
   > `git fetch --quiet && [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ] && echo '⚠️ Update available...'`

---

## 📖 User Guide

### 1. The Video Experience
Select a project from the **Active Projects** sidebar. Note the visual status indicators:
- **Available**: Full high-resolution playback and transcript sync.
- **Unavailable**: Flagged with a rose-colored alert. The system provides a bypass link to YouTube.

### 2. Timeline Intelligence
The lower workspace features "Multi-track Scrubber Interface" allowing you to visualize:
- **Sentiment**: Peaks and valleys of user emotion.
- **Keywords**: Heatmaps of recurring transcript terms.
- **Scrubbing**: Click any track to jump the playhead.

### 3. Deep Discovery (Search)
Use the top-bar search to query **transcripts** and the **comment database** simultaneously. Results are clickable and will transport you to the exact timestamp in the selected video.

---

## 🏗 How It Was Built

This application was developed using a "High Density" design philosophy, prioritizing data density and professional aesthetics.

### Key Architectural Pillars:

> **High-Resolution Thumbnails Architecture**
> "thumbnail of selected video is blocky, use higher resolution"
> *Implementation Note*: The system was upgraded to use `maxresdefault.jpg` from YouTube's CDN and `w=1200` width Unsplash assets for internal projects.

> **The "Active Projects" Library**
> "'active projects' list should flag unavailable videos"
> *Design Response*: Implemented a `VideoStatus` type (`'available' | 'unavailable' | 'checking'`) and added rose-colored `AlertTriangle` icons in the sidebar to visualize source-missing segments.

> **Transcript Intelligence (Scrubbing)**
> "let users scrub through the video based on those transcript segments."
> *Implementation Response*: Each segment in `src/data.ts` contains `start` and `duration` metadata. The `App` component uses a `seekTo` helper that post-messages the YouTube IFrame API:
> `videoRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*')`

### Styling Framework
The app utilizes **Tailwind CSS v4** with a custom theme:
- **Background**: `slate-950`
- **Accents**: `emerald-500` (vid-stable) and `rose-500` (vid-error).
- **Typography**: Inter (UI) and JetBrains Mono (Data).

---

## 🛠 Tech Stack
- **React 19 & TypeScript**: Core component logic and type safety.
- **Framer Motion**: Smooth state transitions and search results overlays.
- **Vite**: Ultra-fast build tool and development server.
- **Lucide React**: High-density icon set.
- **YouTube IFrame API**: Programmatic video control.
