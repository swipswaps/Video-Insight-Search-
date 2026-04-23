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

## 🏗️ Verbatim Retrieval Pipeline (RLM Paradigm)
This suite implements the **Recursive Language Model (RLM)** architecture (as discussed in arXiv:2512.24601) and **Session Orchestration** techniques. We follow a **Zero-Hallucination Policy**—AI is completely removed from the data extraction path to ensure 100% verbatim accuracy.

1.  **Stage 1: Authoritative API Probing**: Direct extraction via official `youtube.com/api/timedtext` endpoints for sub-millisecond precision and raw JSON3 integrity.
2.  **Stage 2: Browser Mimicry (Recursive Probe)**: If the primary API is restricted, the backend simulates a high-fidelity Chrome session to extract hidden `ytInitialPlayerResponse` segments from the page source.
3.  **Stage 3: Verified Session Orchestration**: In cases of heuristic bot-detection (403 errors), the system prompts for a **Verified Human Session**. By connecting your account, the extraction node leverages human-identity proofing to authorize data retrieval.

---

## 🛠️ Verbatim Log Persistence
All server-side operations are captured raw and unaltered. The `dev.log` file is maintained using `tee`, providing a verbatim record of every system event, error, and orchestration milestone. Use `npm run dev` to monitor the live feed.

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
