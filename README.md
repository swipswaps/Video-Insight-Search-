# Video Insight Search (v2.9) — Verified Analytic Suite

A professional, high-density workspace for frame-accurate video analysis, multi-stage verbatim transcript extraction, and Zero-Trust project management.

---

## 🚀 Quick Start Guide

### 1. Initialize the Analytic Node
Ensure you have **Node.js 20+** installed.
```bash
git clone <repository-url>
cd Video-Insight-Search
npm install
npm run dev
```
The suite will bind to `http://localhost:3000`.

### 2. Connect Your Verified Account
To bypass YouTube's high-sensitivity bot detection, click **"Connect Account"** in the header. This creates a **Verified Session** that proves human identity to the backend scrapers, enabling Stage 3 data extraction.

---

## 🏗️ Verbatim Retrieval Pipeline
This suite implements a **Four-Stage Integrity Pipeline** to ensure 100% accurate data retrieval regardless of server-side restrictions.

1.  **Stage 1: Primary Library Scraper**: Rapid extraction using standard subtitle libraries.
2.  **Stage 2: Browser Mimicry**: Backend simulates a high-fidelity Chrome browser header set to extract hidden `ytInitialPlayerResponse` data directly from the page source.
3.  **Stage 3: Verified User Session (Human Proof)**: If YouTube triggers a "Bot Challenge," the app prompts for human verification. By logging in with your Google account, the analytic node uses your authenticated session to bypass generic bot blocks.
4.  **Stage 4: Gemini Analytic Research**: A final fallback leveraging **Gemini 3 Flash** with **Google Search Grounding** to locate official transcripts across public archives.

---

## 🔐 Zero-Trust Security Architecture
We employ a **Zero-Trust Attribute-Based Access Control (ABAC)** model powered by Firebase Enterprise.

*   **Identity Integrity**: Every database write is verified against your Firebase UID and verified email status.
*   **Encrypted Storage**: All project metadata, verbatim logs, and personal configurations are isolated per user.
*   **Anti-Poisoning Guards**: Strict schema validation prevents "Shadow Field" injections and "Denial of Wallet" resource exhaustion attacks.
*   **Admin Override**: The system maintainer (`ihydrocarbon@gmail.com`) has restricted diagnostic access to manage node health and system upgrades.

---

## 🎞️ Professional Workflows

### ✂️ EDL Text-Based Editing
Interact with the video by interacting with the text:
*   **Jump-Cut Playback**: Excluded segments are automatically skipped during review.
*   **Export Utility**: Marks are formatted for server-side clip generation via the `/api/export-clip` gateway.

### 🔄 Node Synchronization
The suite automatically polls for server-side upgrades. If a new scraper engine or security patch is deployed to the remote repository:
1.  The node detects the drift.
2.  One-click **"Upgrade Available"** triggers a force-sync and dependency rebuild.
3.  The analytic suite hot-reloads to the latest stable state.

---

## 🏗️ Technical Pillars

> **Data Authenticity**
> We prioritize verbatim source material. AI is used only for research and navigation, never for generating fake or "summarized" transcript data into the core vault.

> **Privacy & Isolation**
> Your analysis is private. The "Verified Session" ensures that your YouTube account is used only to prove humanity to the extraction nodes—no external data is shared.
