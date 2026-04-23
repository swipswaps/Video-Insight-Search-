# Video Insight Search (v2.8) — Professional Analytic Suite

A high-density workspace designed for sub-second precise video analysis, automated verbatim transcript extraction, and Edit Decision List (EDL) management.

---

## 🚀 Quick Start Guide

To deploy the suite on your local analytical node:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Video-Insight-Search
```

### 2. Install Dependencies
The suite requires **Node.js 20+**. Ensure all required binaries for transcript extraction are present.
```bash
npm install
```

### 3. Launch Development Environment
Starts a dual-purpose session: the **Express Analytic Proxy** (backend) and the **Vite React UI** (frontend).
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 🏗️ Verbatim Retrieval Pipeline

This application implements a **Multi-Stage Scraper Integrity Pipeline** to bypass common bot-detection challenges while ensuring 100% verbatim accuracy.

1.  **Stage 1: Primary Scraper**: Uses standard library calls to retrieve official transcripts.
2.  **Stage 2: Browser Mimicry**: If persistent bot-challenges are detected, the backend switches to a High-Fidelity header system that simulates a real browser environment to extract `captionTracks` from the underlying YouTube page data.
3.  **Stage 4: Gemini Analytic Research**: As a final fallback, the suite leverages the **Gemini 3 Flash** model with **Google Search Grounding** to locate official transcript records across the web and deliver them directly to your data vault.

---

## 🎯 Analytic Features

### 🎞️ Precision Scrubbing & Sync
The playback status bar beneath the player provides frame-accurate synchronization. The display remains hidden until the YouTube IFrame API validates the source content length to prevent "0:00" errors.

### ✂️ Text-Based Video Editing (EDL)
The "Descript-Style" editor allows you to manage your project's export by interacting with the text:
*   Click the **Scissors** icon on a transcript segment to "Cut" it from the project.
*   The player will **automatically jump-cut** over these excluded segments during playback.
*   Export your marks via the **"Export Clip"** utility for server-side processing.

### 🧪 Verbatim Injection
For videos where official transcripts are disabled, use the **"Inject Verbatim Log"** tool to manually verify and commit technical quotes directly into the timeline database.

---

## 🛠️ Diagnostics & Upgrades

### System Upgrades
The suite automatically polls for remote updates. If a newer analytical node is available on GitHub:
1.  An **"Upgrade Available"** button will pulse in the header.
2.  Clicking it executes a `git pull --force` and `npm install` directly on the server node.
3.  The system reloads automatically to the latest stable build.

### Bot Challenge Mitigation
If you encounter a `Sign in to confirm you're not a bot` error, ensure you are running the app locally. The backend mimics your local browser headers to bypass these restrictions. If the error persists, the **Stage 3 Research Mode** provides an integrated search fallback.

---

## 🏗️ Technical Pillars

> **Data Integrity Over AI**
> We prioritize factual source material. All transcripts are extracted verbatim; no generative "summaries" are used in the core data nodes.

> **Accessible Interface**
> Every button and data segment is built for selection (`user-select: text`) and screen-reader compatibility (ARIA compliance).
