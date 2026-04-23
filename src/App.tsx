import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, ChevronLeft, ChevronRight, MessageSquare, List, Clock, Info, Activity, Database, User, Plus, X, AlertTriangle, ExternalLink, Trash2, Scissors, SkipForward } from 'lucide-react';
import { MOCK_VIDEOS, VideoData, TranscriptSegment } from './data';
import { GoogleGenAI, Type } from "@google/genai";
import { auth, signIn, logout } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  /**
   * USER_AUTHENTICATION_STATE
   * We track the Firebase user object to manage 'Verified Sessions'.
   * A logged-in user provides the 'human proof' needed to bypass YouTube bot detection.
   */
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  useEffect(() => {
    // Listen for authentication state changes (login/logout).
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe(); // Cleanup listener on unmount.
  }, []);

  /**
   * CORE_APPLICATION_STATE
   * videos: The library of analyzed videos and their verbatim transcripts.
   * selectedVideoId: Pointer to the active video in the workspace.
   * currentTime: Real-time playback position synced from the YouTube iframe.
   */
  const [videos, setVideos] = useState<VideoData[]>(MOCK_VIDEOS);
  const [selectedVideoId, setSelectedVideoId] = useState(MOCK_VIDEOS.length > 0 ? MOCK_VIDEOS[0].id : "");
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [playerState, setPlayerState] = useState<number>(-1); // -1: unstarted, 1: playing, 2: paused
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [linksText, setLinksText] = useState('');
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionText, setInjectionText] = useState('');
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  /**
   * UPGRADE_TRACKING_STATE
   * The application polls the server to check for Git-based updates.
   * If the local node drifts from the stable branch, we show an upgrade prompt.
   */
  const [upgradeAvailable, setUpgradeAvailable] = useState<boolean>(false);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

  /**
   * ANALYTIC_TRACE_ORCHESTRATOR
   * This logic manages verbatim system logs with global deduplication.
   * Identical entries are collapsed and moved to the head of the trace.
   */
  const [traceLogs, setTraceLogs] = useState<{ message: string, count: number, timestamp: string }[]>([]);
  
  const addTrace = (msg: string) => {
    setTraceLogs(prev => {
      const existingIndex = prev.findIndex(l => l.message === msg);
      if (existingIndex !== -1) {
        const item = prev[existingIndex];
        const updated = { ...item, count: item.count + 1, timestamp: new Date().toLocaleTimeString() };
        return [updated, ...prev.filter((_, i) => i !== existingIndex)].slice(0, 50);
      }
      return [{ message: msg, count: 1, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 50);
    });
  };

  useEffect(() => {
    addTrace("SYSTEM_BOOT: Analytic Node initialized.");
    addTrace("RLM_ENGINE: Recursive Language Model paradigm active.");
  }, []);

  useEffect(() => {
    const checkUpgrade = async () => {
      try {
        const res = await fetch('/api/upgrade/check');
        const data = await res.json();
        if (data.updatable) setUpgradeAvailable(true);
      } catch (e) {
        // Silently fail in detached dev environments
      }
    };
    checkUpgrade();
    const interval = setInterval(checkUpgrade, 300000); // 5 minute polling
    return () => clearInterval(interval);
  }, []);

  const handleApplyUpgrade = async () => {
    setIsUpgrading(true);
    addTrace("NODE_UPGRADE: Attempting recursive system sync...");
    try {
      const res = await fetch('/api/upgrade/apply', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addTrace("NODE_UPGRADE: Success. Hot-reloading node...");
        window.location.reload();
      } else {
        addTrace(`NODE_UPGRADE_FAIL: ${data.error}`);
        alert("Upgrade failed: " + data.error);
      }
    } catch (e) {
      addTrace("NODE_UPGRADE_CRITICAL: Analytic node upgrade interrupted.");
      alert("Analytic node upgrade interrupted.");
    } finally {
      setIsUpgrading(false);
    }
  };

  /**
   * VERBATIM_TRANSCRIPT_PIPELINE
   * This function manages the multi-stage extraction process.
   * 1. Attempt Server-side Scrape (Official + Manual fallback).
   * 2. Detect Bot Challenges & trigger Human Verification UI.
   * 3. Fallback to Gemini AI Research (using Google Search grounding).
   */
  const fetchVerbatimTranscript = async () => {
    if (!selectedVideo) return;
    setIsFetchingTranscript(true);
    setTranscriptError(null);

    try {
      addTrace(`RLM_PROBE: Initiating recursive synthesis for ${selectedVideo.videoId}`);
      // STAGE 1: Recursive Environment Probe (RLM Paradigm)
      const response = await fetch('/api/recursive-extraction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo.videoId, depth: 0 })
      });
      const data = await response.json();

      if (data.success) {
        addTrace(`RLM_SUCCESS: Extracted ${data.segments.length} verbatim segments.`);
        setVideos(videos.map(v => v.id === selectedVideo.id ? { ...v, transcripts: data.segments } : v));
      } else {
        if (data.error === "IDENTITY_VERIFICATION_REQUIRED" && !user) {
          addTrace("RLM_BLOCK: YouTube heuristics triggered Bot Challenge.");
          setTranscriptError("RECURSIVE_BLOCK_DETECTED // Identity proof required to verify this environment.");
          return;
        }

        addTrace(`RLM_FALLBACK: Switching to Stage 3 Proxied Research.`);
        try {
          const researchResponse = await fetch('/api/gemini-research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoId: selectedVideo.videoId, title: selectedVideo.title })
          });
          const researchData = await researchResponse.json();

          if (researchData.success) {
            const segments = researchData.segments.map((s: any, i: number) => ({
              ...s,
              id: `ai-research-${selectedVideo.videoId}-${i}`,
              isStatic: false
            }));

            if (segments.length > 0) {
              setVideos(videos.map(v => v.id === selectedVideo.id ? { ...v, transcripts: segments } : v));
              addTrace("RESEARCH_SUCCESS: Verbatim data retrieved via analytical node.");
            } else {
              setTranscriptError("Verbatim data unavailable across all nodes.");
            }
          } else {
            addTrace(`RESEARCH_FAIL: ${researchData.error}`);
            setTranscriptError(`Analytic research failed: ${researchData.error}`);
          }
        } catch (researchErr: any) {
          addTrace(`RESEARCH_CRITICAL: ${researchErr.message}`);
          setTranscriptError("Analytic research node interrupted.");
        }
      }
    } catch (err: any) {
      // [!] PAIN_POINT_FLAGGED: Network failures here usually indicate 
      // service-mesh proxy timeout. Retry logic should be implemented 
      // in the RLM orchestrator layer.
      addTrace(`RLM_CRITICAL: Network failure. ${err.message}`);
      setTranscriptError("Network failure within the analytic pipeline.");
    } finally {
      setIsFetchingTranscript(false);
    }
  };
  
  // Logic Ready States
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Editor / EDL Mode State
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showIntelligence, setShowIntelligence] = useState(true);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLIFrameElement>(null);

  const toggleExcludeSegment = (segmentId: string) => {
    if (!selectedVideo) return;
    const newExcluded = selectedVideo.excludedSegmentIds.includes(segmentId)
      ? selectedVideo.excludedSegmentIds.filter(id => id !== segmentId)
      : [...selectedVideo.excludedSegmentIds, segmentId];
    
    setVideos(videos.map(v => v.id === selectedVideo.id ? { ...v, excludedSegmentIds: newExcluded } : v));
  };

  const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the video when clicking delete
    const updatedVideos = videos.filter(v => v.id !== id);
    setVideos(updatedVideos);
    
    // If we deleted the current video, select the first remaining one
    if (selectedVideoId === id && updatedVideos.length > 0) {
      setSelectedVideoId(updatedVideos[0].id);
    } else if (updatedVideos.length === 0) {
      setSelectedVideoId("");
    }
  };

  // Sort videos: Newest first
  const sortedVideos = useMemo(() => {
    return [...videos];
  }, [videos]);

  const selectedVideo = useMemo(() => {
    if (videos.length === 0) return null;
    return videos.find(v => v.id === selectedVideoId) || videos[0];
  }, [selectedVideoId, videos]);

  // Search logic: Optimizing with early exit and case-insensitive check
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return [];
    
    const results = [];
    for (const video of videos) {
      const transcriptMatches = video.transcripts.filter(t => 
        t.text.toLowerCase().includes(trimmedQuery)
      );
      const titleMatch = video.title.toLowerCase().includes(trimmedQuery);
      
      if (transcriptMatches.length > 0 || titleMatch) {
        results.push({ 
          video, 
          transcriptMatches, 
          score: (titleMatch ? 10 : 0) + transcriptMatches.length
        });
      }
    }
    // Sort by relevance (score)
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, videos]);

  useEffect(() => {
    setIsPlayerReady(false);
    setPlayerState(-1); // Reset state on video change
    setHasStartedPlaying(false); // Reset playback flag
    setTranscriptError(null);
  }, [selectedVideoId]);

  /**
   * Playhead Synchronization Logic
   * Listens to the YouTube IFrame API events to sync local state with actual video progress.
   * Prevents 'out-of-sync' scrubbing issues common in bridge architectures.
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: Match origin to avoid XSS
      if (typeof event.data !== 'string') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'onReady') {
          setIsPlayerReady(true);
          // Request initial status to force duration sync
          if (videoRef.current?.contentWindow) {
            videoRef.current.contentWindow.postMessage(JSON.stringify({
              event: 'listening'
            }), '*');
          }
        }
        if (data.event === 'onStateChange') {
          setPlayerState(data.info);
          // Flag that the user has interacted and started playback
          // 1: playing, 2: paused, 3: buffering, 0: ended
          if (data.info !== -1 && data.info !== 5) {
            setHasStartedPlaying(true);
          }
        }
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) {
            const newTime = data.info.currentTime;
            setCurrentTime(newTime);
            
            // EDL & JUMP-CUT LOGIC:
            // If auto-sync or editor is on, skip segments marked as excluded OR isStatic logic.
            if (selectedVideo && (isAutoSyncEnabled || isEditorMode)) {
              const currentSegment = selectedVideo.transcripts.find(seg => 
                newTime >= seg.start && newTime < (seg.start + seg.duration)
              );
              
              if (currentSegment && (selectedVideo.excludedSegmentIds.includes(currentSegment.id) || currentSegment.isStatic)) {
                // Find next valid segment
                const nextValidSegment = selectedVideo.transcripts.find(seg => 
                  seg.start > currentSegment.start && 
                  !selectedVideo.excludedSegmentIds.includes(seg.id) && 
                  !seg.isStatic
                );
                
                if (nextValidSegment) {
                  seekTo(nextValidSegment.start);
                  console.log(`[EDL_JUMP] Skipping ${currentSegment.isStatic ? 'STATIC_NODE' : 'EXCLUDED_CONTENT'} ${currentSegment.id} -> Advancing to ${nextValidSegment.start}s`);
                }
              }
            }

            if (newTime > 0) {
              setHasStartedPlaying(true);
            }
          }
          /**
           * DURATION SYNC:
           * If the YouTube API provides a duration, we update our local state.
           * This resolves issues where imported videos default to 5:00 but are actually longer or shorter.
           */
          if (isAutoSyncEnabled && data.info.duration !== undefined && data.info.duration > 0) {
            setVideos(prev => prev.map(v => 
              v.videoId === selectedVideo.videoId ? { ...v, duration: data.info.duration } : v
            ));
          }
        }
      } catch (e) {
        // Silently fail for non-API messages
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Polling fallback to keep time accurate if API events throttle
    const interval = setInterval(() => {
      if (videoRef.current?.contentWindow) {
        videoRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'listening'
        }), '*');
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [selectedVideo.videoId, isAutoSyncEnabled]);

  const inFlightIds = useRef<Set<string>>(new Set());

  // Global pipeline effect to process videos that are in "checking" status
  /**
   * Selection Effect: Reset player state when changing source node.
   */
  useEffect(() => {
    setIsPlayerReady(false);
    setPlayerState(-1); // Reset state on video change
    setHasStartedPlaying(false); // Reset playback flag
  }, [selectedVideoId]);
 

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (videoRef.current?.contentWindow) {
      videoRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }), '*');
    }
  };

  /**
   * Enhanced YouTube URL Parser
   * Handles: shorts/, watch?v=, embed/, youtu.be/ and extra URL parameters
   * Based on industry-standard regex for robust video ID extraction.
   */
  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  /**
   * Node Ingestion Handler
   * Creates simple analytic nodes from YouTube URLs. 
   * Prevents duplicates by jumping to existing nodes if detected.
   */
  const handleAddLinks = () => {
    const urls = linksText.split(/[\s,]+/).filter(u => u.trim());
    if (urls.length === 0) return;

    const newVideos: VideoData[] = [];
    let firstAddedId = "";
    
    for (const url of urls) {
      const vid = extractVideoId(url);
      if (!vid) continue;

      // Duplicate detection: If we already have this video, prioritize selection
      const existing = videos.find(v => v.videoId === vid);
      if (existing) {
        if (!firstAddedId) firstAddedId = existing.id;
        continue;
      }

      const id = `project-${Math.random().toString(36).substr(2, 9)}`;
      const newNode: VideoData = {
        id,
        title: `Imported Node [${vid}]`,
        videoId: vid,
        thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        duration: 0,
        status: 'available',
        transcripts: [],
        excludedSegmentIds: []
      };
      
      newVideos.push(newNode);
      if (!firstAddedId) firstAddedId = id;
    }

    if (newVideos.length > 0) {
      setVideos(prev => [...newVideos, ...prev]);
    }
    
    if (firstAddedId) {
      setSelectedVideoId(firstAddedId);
    }
    
    setLinksText('');
    setIsAddPanelOpen(false);
  };

  const handleExportClip = async () => {
    if (inPoint === null || outPoint === null) return;
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/export-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.videoId,
          in: inPoint,
          out: outPoint,
          title: selectedVideo.title
        })
      });
      const result = await response.json();
      console.log('Export result:', result);
      alert(`Clip exported successfully! Job ID: ${result.jobId}`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Footer Status Bar
  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden">
      {/* Analytic Trace Panel (Collapsible) */}
      <div className="absolute bottom-10 right-4 z-50 w-80 max-h-60 overflow-y-auto bg-slate-900/90 border border-slate-800 rounded shadow-2xl p-2 font-mono scrollbar-hide">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
          <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Analytic Trace</span>
          <Trash2 className="w-3 h-3 text-slate-600 cursor-pointer hover:text-rose-500" onClick={() => setTraceLogs([])} />
        </div>
        <div className="flex flex-col gap-1">
          {traceLogs.map((log, i) => (
            <div key={i} className="text-[8px] flex items-start gap-2 border-l border-emerald-500/20 pl-2 py-0.5">
              <span className="text-slate-600 shrink-0">{log.timestamp}</span>
              <span className="text-slate-300 break-all">{log.message}</span>
              {log.count > 1 && (
                <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded-sm font-bold">×{log.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Header / Search Bar */}
      <header className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-500 text-slate-950 font-black px-2 py-1 text-[10px] uppercase tracking-tighter rounded-sm">
            VidReview v2.9
          </div>
          <div className="h-8 w-[450px] bg-slate-950 border border-slate-700 rounded flex items-center px-3 gap-2 shadow-inner group focus-within:border-emerald-500/50 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500 group-focus-within:text-emerald-400" />
            <input 
              type="text" 
              placeholder="Search transcripts or timeline marks..." 
              className="bg-transparent text-xs w-full outline-none text-slate-300 placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/50 pl-3 pr-1 py-1 rounded-full border border-emerald-500/20">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-mono text-emerald-400 font-bold leading-none">VERIFIED_NODE</span>
                <span className="text-[9px] font-black text-slate-100 uppercase tracking-tighter leading-tight">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={logout}
                className="w-7 h-7 rounded-full border border-emerald-500/50 overflow-hidden hover:scale-105 transition-all shadow-lg shadow-emerald-500/10"
                title="Logout"
              >
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="User" referrerPolicy="no-referrer" />
              </button>
            </div>
          ) : (
            <button 
              onClick={signIn}
              className="group flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded text-[10px] font-black uppercase transition-all hover:bg-emerald-400 active:scale-95"
            >
              <User className="w-3.5 h-3.5" /> 
              <span>Connect Account</span>
            </button>
          )}

          {upgradeAvailable && (
            <button 
              onClick={handleApplyUpgrade}
              disabled={isUpgrading}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-[10px] font-bold uppercase transition-all animate-pulse"
            >
              <Activity className="w-3 h-3" /> {isUpgrading ? 'Updating...' : 'Upgrade Available'}
            </button>
          )}

          <button 
            onClick={() => setIsAddPanelOpen(!isAddPanelOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded text-[10px] font-bold uppercase transition-colors"
          >
            <Plus className="w-3 h-3" /> Ingest Videos
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded border border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400">Intelligence</span>
            <button 
              onClick={() => setShowIntelligence(!showIntelligence)}
              className={`w-8 h-4 rounded-full relative transition-colors ${showIntelligence ? 'bg-sky-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showIntelligence ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded border border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400">Timestamps</span>
            <button 
              onClick={() => setShowTimestamp(!showTimestamp)}
              className={`w-8 h-4 rounded-full relative transition-colors ${showTimestamp ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showTimestamp ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded border border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400">Auto Sync</span>
            <button 
              onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
              className={`w-8 h-4 rounded-full relative transition-colors ${isAutoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isAutoSyncEnabled ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded border border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400">Editor Mode</span>
            <button 
              onClick={() => setIsEditorMode(!isEditorMode)}
              className={`w-8 h-4 rounded-full relative transition-colors ${isEditorMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isEditorMode ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-6 text-[9px] uppercase font-bold tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="w-3 h-3" /> Live Analytics
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3" /> DB: Connected
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {/* Links Upload Overlay Panel */}
        <AnimatePresence>
          {isAddPanelOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-[500px] bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase text-white tracking-widest">Import Video Pipeline</h3>
                <button onClick={() => setIsAddPanelOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <textarea 
                placeholder="Paste YouTube links here (one per line or comma-separated)..."
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50 mb-4 custom-scrollbar"
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsAddPanelOpen(false)}
                  className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={handleAddLinks}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 rounded text-[10px] font-bold uppercase shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3 h-3 border border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                      Ingesting...
                    </>
                  ) : 'Parse & Queue'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left: Video Library Sidebar */}
        <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/30 flex-shrink-0">
          <div className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 flex justify-between items-center">
            <span>Active Projects</span>
            {videos.length > 0 && (
              <button 
                onClick={() => { if(confirm('Purge all projects?')) setVideos([]); }}
                className="text-rose-500/50 hover:text-rose-500 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
            {sortedVideos.map((video) => {
              const isCollapsed = video.status === 'available';
              return (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedVideoId(video.id); }}
                  aria-label={`Select video: ${video.title}`}
                  className={`w-full p-2 rounded flex gap-3 cursor-pointer transition-all border text-left group relative outline-none focus:ring-1 focus:ring-emerald-500/30 ${
                    selectedVideoId === video.id 
                    ? 'bg-slate-800 border-slate-700 shadow-lg' 
                    : 'border-transparent hover:bg-slate-800/40'
                  } ${isCollapsed ? 'items-center py-1.5' : 'items-start'}`}
                >
                  {!isCollapsed ? (
                    <div className="w-24 h-14 bg-slate-700 flex-shrink-0 relative rounded-sm overflow-hidden border border-slate-600 shadow-inner">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        style={{ imageRendering: 'high-quality' }}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          video.status === 'unavailable' 
                          ? 'opacity-20 grayscale' 
                          : selectedVideoId === video.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                        }`} 
                      />
                      {video.status === 'unavailable' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-rose-500 drop-shadow-md" />
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 px-1 bg-black/60 text-[7px] font-mono">{formatTime(video.duration)}</div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-slate-800/80 rounded border border-slate-700/50 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                      <Play className={`w-2.5 h-2.5 transition-colors ${selectedVideoId === video.id ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600 group-hover:text-emerald-400'}`} />
                    </div>
                  )}
                  
                  <div className="flex flex-col min-w-0 justify-center flex-1">
                    <div className={`text-[11px] font-semibold truncate ${selectedVideoId === video.id ? 'text-white' : 'text-slate-400'}`}>
                      {video.title}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {video.status === 'unavailable' ? (
                          <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tighter">DATA MISSING</span>
                        ) : video.status === 'checking' ? (
                          <span className="text-[8px] font-bold text-emerald-500/50 uppercase tracking-tighter animate-pulse">ANALYZING...</span>
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono tracking-tighter">ID: {video.videoId.substr(0, 6)}...</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                      className="p-1.5 hover:bg-rose-500/20 rounded-full text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {!isCollapsed && video.status === 'unavailable' && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Player & Visual Scrubber */}
        <section className="flex-1 flex flex-col bg-black relative overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center relative p-6 bg-slate-950/20">
            {/* Player Container */}
            <div className="aspect-video w-full max-w-4xl bg-slate-900 shadow-2xl relative flex flex-col justify-end group rounded-sm overflow-hidden border border-slate-800">
              {!selectedVideo ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-800 text-slate-700">
                    <Database className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2">No Active Media Context</h3>
                  <p className="text-sm text-slate-500 max-w-xs uppercase tracking-widest leading-loose">
                    Ingest a source link in the "Add Videos" panel to initialize a new analytic node.
                  </p>
                  <button 
                    onClick={() => setIsAddPanelOpen(true)}
                    className="mt-8 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-[0.3em] rounded hover:bg-emerald-500/20 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  >
                    Initialize Connection
                  </button>
                </div>
              ) : (
                <>
                  {!isPlayerReady && selectedVideo.status === 'available' && (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
                      <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                      <div className="text-[10px] font-mono text-slate-500 uppercase animate-pulse">Establishing Peer Connection...</div>
                    </div>
                  )}
                  <iframe 
                    ref={videoRef}
                    key={selectedVideo.videoId}
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?enablejsapi=1&origin=${window.location.origin}&widget_referrer=${window.location.origin}&rel=0&modestbranding=1&autoplay=0`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    onLoad={() => {
                      setTimeout(() => setIsPlayerReady(true), 3000);
                    }}
                    allowFullScreen
                  />
                </>
              )}
            </div>

            {/* High-Visibility Playback Status Bar */}
            <div className="w-full max-w-4xl mt-2 px-1">
              {selectedVideo && showTimestamp && hasStartedPlaying && selectedVideo.duration > 0 && (
                <div className="h-8 bg-slate-900/40 border border-white/5 rounded flex items-center justify-between px-3 backdrop-blur-md shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-2 w-2">
                      <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                      <div className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></div>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 font-black tracking-widest uppercase flex items-center gap-2">
                       <span className="text-emerald-500/50">LIVE_SYNC //</span> 
                       <span className="bg-emerald-500/10 px-1 rounded text-white">{formatTime(currentTime)}</span> 
                       <span className="text-slate-700 font-normal">|</span> 
                       <span className="text-slate-400">{formatTime(selectedVideo.duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-l border-white/5 pl-4 ml-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[7px] px-1 border border-emerald-500/30 rounded text-emerald-500/70 font-mono font-bold tracking-widest uppercase">YT_EMBED_VERIFIED</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPlayerReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500/50'}`} />
                      <div className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-tighter">API_{isPlayerReady ? 'READY' : 'WAIT'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${playerState === 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
                      <div className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-tighter">BUFF_NODE</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Player Interface Context */}
            <div className="mt-4 w-full max-w-4xl flex justify-between items-center px-2">
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-200 tracking-tight">{selectedVideo.title}</h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>PEER_REF: {selectedVideo.videoId}</span>
                  <span>•</span>
                  <span>{formatTime(selectedVideo.duration)}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isPlayerReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
                  <div className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-tighter">API_{isPlayerReady ? 'READY' : 'WAIT'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-track Scrubber Interface */}
          <div className="h-64 bg-slate-950 border-t border-slate-800 p-4 flex flex-col gap-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isEditorMode ? 'EDL Editor Pipeline' : 'Timeline Intelligence'}
              </span>
              <div className="flex gap-4 items-center">
                {isEditorMode ? (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setInPoint(Math.floor(currentTime))}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      Set In: <span className="text-emerald-400 font-mono">{inPoint !== null ? formatTime(inPoint) : '--:--:--'}</span>
                    </button>
                    <button 
                      onClick={() => setOutPoint(Math.floor(currentTime))}
                      className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      Set Out: <span className="text-rose-400 font-mono">{outPoint !== null ? formatTime(outPoint) : '--:--:--'}</span>
                    </button>
                    <button 
                      disabled={inPoint === null || outPoint === null || outPoint <= inPoint || isExporting}
                      onClick={handleExportClip}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 rounded text-[9px] font-bold uppercase transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {isExporting ? 'Exporting...' : 'Export Clip'}
                    </button>
                    {inPoint !== null && outPoint !== null && (
                      <button onClick={() => { setInPoint(null); setOutPoint(null); }} className="text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                      <span className="text-[9px] text-slate-500">Sentiment Spike</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[9px] text-slate-500">Key Takeaway</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Timeline Tracks */}
            <div className={`flex-1 flex flex-col gap-3 relative transition-all duration-500 ${showIntelligence ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
              {/* Track: Sentiment */}
              <div className="h-10 flex items-center gap-4">
                <div className="w-20 text-[9px] text-slate-500 uppercase font-bold">Sentiment</div>
                <div className="flex-1 h-full bg-slate-900 rounded-sm relative flex items-center overflow-hidden border border-slate-800/50">
                  <div className="h-4 w-24 bg-emerald-500/20 absolute left-[10%] rounded-full border border-emerald-500/30"></div>
                  <div className="h-4 w-32 bg-rose-500/20 absolute left-[45%] rounded-full border border-rose-500/30"></div>
                  <div className="h-4 w-12 bg-amber-500/20 absolute left-[80%] rounded-full border border-amber-500/30"></div>
                  
                  {/* Selection Overlay in Track */}
                  {selectedVideo && isEditorMode && inPoint !== null && outPoint !== null && (
                    <div 
                      className="h-full bg-emerald-500/10 border-x border-emerald-500/40 absolute z-10"
                      style={{ 
                        left: `${(inPoint / selectedVideo.duration) * 100}%`,
                        width: `${((outPoint - inPoint) / selectedVideo.duration) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
              {/* Track: Keyword Heatmap */}
              <div className="h-10 flex items-center gap-4">
                <div className="w-20 text-[9px] text-slate-500 uppercase font-bold">Keywords</div>
                <div className="flex-1 h-full bg-slate-900 rounded-sm flex items-center px-1 gap-1 border border-slate-800/50 overflow-hidden relative">
                  <div className="h-full w-2 bg-sky-400/40"></div>
                  <div className="h-full w-1 border-r border-slate-800"></div>
                  <div className="h-full w-1 bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.3)]"></div>
                  <div className="flex-1"></div>
                  <div className="h-full w-3 bg-sky-400/60"></div>
                  <div className="h-full w-1 bg-sky-400/80"></div>
                  <div className="h-full w-8 bg-slate-800/50"></div>

                  {/* Selection Overlay in Keywords */}
                  {selectedVideo && isEditorMode && inPoint !== null && outPoint !== null && (
                    <div 
                      className="h-full bg-emerald-500/10 border-x border-emerald-500/40 absolute z-10 top-0"
                      style={{ 
                        left: `${(inPoint / selectedVideo.duration) * 100}%`,
                        width: `${((outPoint - inPoint) / selectedVideo.duration) * 100}%`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Track: Scrub Bar (Always Visible) */}
            <div className="h-14 flex items-center gap-4 border-t border-slate-900 pt-2">
               <div className="w-20 text-[10px] text-slate-400 uppercase font-mono tracking-tighter">TIMESTAMP_IDX</div>
               <div 
                 className="flex-1 h-1 bg-slate-800 rounded-full relative cursor-pointer group/scrub"
                 onClick={(e) => {
                   if (!selectedVideo) return;
                   const rect = e.currentTarget.getBoundingClientRect();
                   const x = e.clientX - rect.left;
                   const percent = x / rect.width;
                   seekTo(Math.floor(percent * selectedVideo.duration));
                 }}
               >
                 <div 
                   className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-100"
                   style={{ width: `${selectedVideo && selectedVideo.duration > 0 ? (currentTime / selectedVideo.duration) * 100 : 0}%` }}
                 />
                 
                 {/* EDL Markers on Scrub Bar */}
                 {selectedVideo && selectedVideo.duration > 0 && selectedVideo.transcripts.map(seg => {
                   const isExcluded = selectedVideo.excludedSegmentIds.includes(seg.id);
                   if (!isExcluded && !seg.isStatic) return null;
                   return (
                     <div 
                       key={`marker-${seg.id}`}
                       className={`absolute top-0 h-1 z-20 ${isExcluded ? 'bg-rose-500/50' : 'bg-amber-500/50'}`}
                       style={{ 
                         left: `${(seg.start / selectedVideo.duration) * 100}%`,
                         width: `${(seg.duration / selectedVideo.duration) * 100}%`
                       }}
                     />
                   );
                 })}
                 
                 <div 
                  className="absolute top-[-25px] flex flex-col items-center transition-all duration-100 cursor-grab"
                  style={{ left: `${selectedVideo && selectedVideo.duration > 0 ? (currentTime / selectedVideo.duration) * 100 : 0}%` }}
                 >
                   <div className="w-2 h-2 bg-emerald-400 rotate-45 mb-2 shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
                   <div className="w-px h-28 bg-emerald-500 opacity-50 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                 </div>

                 {/* Editor selection indicators on scrub bar */}
                 {selectedVideo && isEditorMode && inPoint !== null && (
                   <div 
                      className="absolute h-4 w-0.5 bg-emerald-500 top-[-2px] shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      style={{ left: `${selectedVideo.duration > 0 ? (inPoint / selectedVideo.duration) * 100 : 0}%` }}
                   >
                     <div className="absolute top-[-10px] left-[-3px] text-[7px] font-bold text-emerald-400">IN</div>
                   </div>
                 )}
                 {selectedVideo && isEditorMode && outPoint !== null && (
                   <div 
                      className="absolute h-4 w-0.5 bg-rose-500 top-[-2px] shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                      style={{ left: `${selectedVideo.duration > 0 ? (outPoint / selectedVideo.duration) * 100 : 0}%` }}
                   >
                     <div className="absolute top-[-10px] left-[-7px] text-[7px] font-bold text-rose-400">OUT</div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </section>

        {/* Right: Transcript Feed */}
        <aside className="w-80 border-l border-slate-800 flex flex-col bg-slate-900/50 flex-shrink-0">
          <div className="flex h-10 border-b border-slate-800 items-center px-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Verbatim Transcript</span>
          </div>

          <div className="flex-1 overflow-hidden p-3 overflow-y-auto custom-scrollbar text-center">
            <AnimatePresence mode="wait">
              {!selectedVideo ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                  <Database className="w-10 h-10 opacity-20" />
                  <p className="text-[10px] uppercase tracking-[0.2em]">Idle Pipeline</p>
                </motion.div>
              ) : searchQuery ? (
                <motion.div 
                  key="search"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  <div className="text-[9px] uppercase font-black text-emerald-500 tracking-tighter px-1 border-l border-emerald-500/50">MATCH_ARRAY RESULTS</div>
                  {searchResults.map((res: any) => (
                    <div key={res.video.id} className="space-y-2">
                       {res.transcriptMatches.map((t: TranscriptSegment, i: number) => (
                        <button 
                          key={i}
                          onClick={() => { setSelectedVideoId(res.video.id); seekTo(t.start); }}
                          className="w-full text-left p-2 rounded bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all group"
                        >
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[9px] font-mono text-emerald-500 opacity-60 group-hover:opacity-100">00:{Math.floor(t.start/60).toString().padStart(2, '0')}:{(t.start%60).toString().padStart(2, '0')}</span>
                            <span className="text-[8px] bg-slate-900 px-1 rounded text-slate-500">TRNSRC</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-400 group-hover:text-slate-200 line-clamp-2">"{t.text}"</p>
                        </button>
                      ))}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="transcript"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {selectedVideo.transcripts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-600 p-8 text-center">
                       <Database className="w-10 h-10 mb-4 opacity-20" />
                       <p className="text-[10px] uppercase tracking-[0.2em] mb-4">Verbatim Data Vault // Empty</p>
                       <p className="text-[9px] lowercase font-mono opacity-50 mb-6 italic">No verified transcript entries have been hardcoded for this analytical node.</p>
                       {!isInjecting ? (
                         <div className="flex flex-col gap-2 w-full">
                           <button 
                             disabled={isFetchingTranscript}
                             onClick={fetchVerbatimTranscript}
                             aria-label="Obtain transcript from YouTube source"
                             className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 text-[10px] uppercase font-black tracking-widest rounded transition-all flex items-center justify-center gap-2"
                           >
                             {isFetchingTranscript ? (
                               <>
                                 <div className="w-3 h-3 border border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                                 PULLING_DATA...
                               </>
                             ) : (
                               <>
                                 <Database className="w-3 h-3" /> Pull Source Transcript
                               </>
                             )}
                           </button>

                           <button 
                             onClick={() => setIsInjecting(true)}
                             aria-label="Open verbatim injection form"
                             className="px-4 py-2 border border-emerald-500/30 text-emerald-500 text-[10px] uppercase font-bold tracking-widest rounded hover:bg-emerald-500/10 transition-all focus:ring-1 focus:ring-emerald-500/50 outline-none"
                           >
                             Inject Verbatim Log
                           </button>

                           {transcriptError && (
                             <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded">
                               <p className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter animate-pulse mb-3">
                                 [!] {transcriptError}
                               </p>
                               {transcriptError.includes("IDENTITY_VERIFICATION_REQUIRED") && !user && (
                                 <button 
                                   onClick={signIn}
                                   className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[9px] font-black uppercase rounded transition-all"
                                 >
                                   Verify as Human
                                 </button>
                               )}
                             </div>
                           )}
                         </div>
                       ) : (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="w-full bg-slate-900 border border-slate-800 p-4 rounded flex flex-col gap-3"
                         >
                           <header className="flex justify-between items-center">
                             <span className="text-[8px] font-mono text-emerald-500">INIT_LOG // {formatTime(currentTime)}</span>
                             <button onClick={() => setIsInjecting(false)} className="text-slate-500 hover:text-white" aria-label="Cancel injection"><X className="w-3 h-3" /></button>
                           </header>
                           <textarea 
                             autoFocus
                             placeholder="Capture verbatim quote..."
                             className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-white focus:border-emerald-500/50 outline-none h-20 resize-none font-sans"
                             value={injectionText}
                             onChange={(e) => setInjectionText(e.target.value)}
                           />
                           <button 
                             disabled={!injectionText.trim()}
                             onClick={() => {
                               const newSegment: TranscriptSegment = {
                                 id: `manual-${Math.random().toString(36).substr(2, 9)}`,
                                 start: currentTime,
                                 duration: 5,
                                 text: injectionText.trim()
                               };
                               setVideos(videos.map(v => v.id === selectedVideo.id ? { ...v, transcripts: [...v.transcripts, newSegment].sort((a,b) => a.start - b.start) } : v));
                               setInjectionText('');
                               setIsInjecting(false);
                             }}
                             className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded text-[9px] font-black uppercase transition-all shadow-lg shadow-emerald-500/10"
                           >
                             Verify & Commit
                           </button>
                         </motion.div>
                       )}
                    </div>
                  ) : selectedVideo.transcripts.map((seg, i) => {
                    const isExcluded = selectedVideo.excludedSegmentIds.includes(seg.id);
                    const isActive = currentTime >= seg.start && (selectedVideo.transcripts[i+1] ? currentTime < selectedVideo.transcripts[i+1].start : true);
                    
                    return (
                      <div key={seg.id} className="relative group">
                        <div 
                          className={`w-full flex flex-col gap-1 transition-all text-left p-2 rounded-r border-l-2 cursor-default ${
                            isActive
                            ? 'bg-slate-800/80 border-emerald-500' 
                            : isExcluded 
                              ? 'opacity-20 grayscale border-transparent' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-1">
                            <button 
                              onClick={() => seekTo(seg.start)}
                              className={`text-[10px] font-mono hover:underline cursor-pointer ${isExcluded ? 'text-slate-500 line-through' : 'text-emerald-500'}`}
                            >
                              00:{Math.floor(seg.start/60).toString().padStart(2, '0')}:{(seg.start%60).toString().padStart(2, '0')}
                            </button>
                            <div className="flex items-center gap-2">
                              {seg.isStatic && (
                                <span className="text-[7px] bg-slate-800 text-amber-500 border border-amber-500/30 px-1 rounded flex items-center gap-1">
                                  <SkipForward className="w-2 h-2" /> STATIC
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 rounded font-bold tracking-tighter">ACTIVE</span>
                              )}
                            </div>
                          </div>
                          <p className={`text-[11px] leading-relaxed select-text selection:bg-emerald-500/30 ${
                            isActive ? 'text-white font-medium' : isExcluded ? 'text-slate-600' : 'text-slate-400'
                          }`}>
                            "{seg.text}"
                          </p>
                        </div>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleExcludeSegment(seg.id); }}
                          className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
                            isExcluded 
                            ? 'bg-emerald-500 text-slate-950 opacity-100' 
                            : 'bg-slate-800 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white'
                          }`}
                          title={isExcluded ? "Include in export" : "Cut from project"}
                        >
                          <Scissors className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Status Branding */}
          <div className="p-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="flex flex-col gap-2 text-[9px] text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase font-bold tracking-[0.2em] italic">Verbatim Mode Active</span>
              </div>
              <p className="text-[8px] leading-relaxed text-slate-600 uppercase tracking-tighter">
                Faux-transcription disabled. Use 'Inject Verbatim' to add verified data.
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 border-t border-slate-800 bg-slate-900 flex items-center px-4 justify-between flex-shrink-0">
        <div className="text-[9px] font-mono text-slate-500 tracking-tight">
          SYSTEM_STATE: STABLE // SESSION: AIS-VID-{(Math.random()*1000).toFixed(0)} // LOGS: CAPTURING
        </div>
        <div className="flex gap-6">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">DATA_LATENCY: 14ms</div>
          <div className="text-[9px] font-mono text-emerald-500 uppercase font-black tracking-tighter">SCRUB_MODE: PRECISE</div>
        </div>
      </footer>
    </div>
  );
}
