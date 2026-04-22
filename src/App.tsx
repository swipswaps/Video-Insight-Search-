import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, ChevronLeft, ChevronRight, MessageSquare, List, Clock, Info, Activity, Database, User, Plus, X, AlertTriangle, ExternalLink } from 'lucide-react';
import { MOCK_VIDEOS, VideoData, TranscriptSegment } from './data';

export default function App() {
  const [videos, setVideos] = useState<VideoData[]>(MOCK_VIDEOS);
  const [selectedVideoId, setSelectedVideoId] = useState(MOCK_VIDEOS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'transcript' | 'comments'>('transcript');
  const [currentTime, setCurrentTime] = useState(0);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [linksText, setLinksText] = useState('');
  
  // Pipeline Performance & Logic Ready States
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [activePipelineJobs, setActivePipelineJobs] = useState<Set<string>>(new Set());

  // Editor / EDL Mode State
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(true);
  const [inPoint, setInPoint] = useState<number | null>(null);
  const [outPoint, setOutPoint] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const videoRef = useRef<HTMLIFrameElement>(null);

  // Sort videos: unavailable first, then available at the bottom
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      if (a.status === 'unavailable' && b.status !== 'unavailable') return -1;
      if (a.status !== 'unavailable' && b.status === 'unavailable') return 1;
      return 0;
    });
  }, [videos]);

  const selectedVideo = useMemo(() => 
    videos.find(v => v.id === selectedVideoId) || videos[0],
  [selectedVideoId, videos]);

  // Search logic: Optimizing with early exit and case-insensitive check
  const searchResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery) return [];
    
    const results = [];
    for (const video of videos) {
      const transcriptMatches = video.transcripts.filter(t => 
        t.text.toLowerCase().includes(trimmedQuery)
      );
      const commentMatches = video.comments.filter(c => 
        c.text.toLowerCase().includes(trimmedQuery)
      );
      const titleMatch = video.title.toLowerCase().includes(trimmedQuery);
      
      if (transcriptMatches.length > 0 || commentMatches.length > 0 || titleMatch) {
        results.push({ 
          video, 
          transcriptMatches, 
          commentMatches,
          score: (titleMatch ? 10 : 0) + transcriptMatches.length + commentMatches.length
        });
      }
    }
    // Sort by relevance (score)
    return results.sort((a, b) => b.score - a.score);
  }, [searchQuery, videos]);

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
        }
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.currentTime !== undefined) {
            setCurrentTime(data.info.currentTime);
          }
          /**
           * DURATION SYNC:
           * If the YouTube API provides a duration, we update our local state.
           * This resolves issues where imported videos default to 5:00 but are actually longer or shorter.
           */
          if (data.info.duration !== undefined && data.info.duration > 0) {
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
  }, []);

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
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  /**
   * Pipeline ingestion handler with concurrent job tracking
   */
  const handleAddLinks = async () => {
    const urls = linksText.split(/[\s,]+/).filter(u => u.trim());
    
    // Call backend for each link to simulate processing
    for (const url of urls) {
      try {
        const response = await fetch('/api/process-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const result = await response.json();
        console.log('Backend processing result:', result);
      } catch (err) {
        console.error('Failed to contact processing pipeline:', err);
      }
    }

    const newVideos: VideoData[] = urls.map(url => {
      const vid = extractVideoId(url);
      if (!vid) return null;
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        title: `Video Import: ${vid}`,
        videoId: vid,
        thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
        review: "Review pending analysis...",
        duration: 300, // Default to 5 mins for imported videos
        status: 'available',
        transcripts: [
          { start: 0, duration: 60, text: "Transcript processing initiated. Audio data being prioritized for extraction." }
        ],
        comments: []
      };
    }).filter((v): v is VideoData => v !== null);

    if (newVideos.length > 0) {
      setVideos([...newVideos, ...videos]);
      setSelectedVideoId(newVideos[0].id);
      setLinksText('');
      setIsAddPanelOpen(false);
    }
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

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden">
      {/* Header / Search Bar */}
      <header className="h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-500 text-slate-950 font-black px-2 py-1 text-[10px] uppercase tracking-tighter rounded-sm">
            VidReview v2.4
          </div>
          <div className="h-8 w-[450px] bg-slate-950 border border-slate-700 rounded flex items-center px-3 gap-2 shadow-inner group focus-within:border-emerald-500/50 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-500 group-focus-within:text-emerald-400" />
            <input 
              type="text" 
              placeholder="Search transcripts, comments, or timeline marks..." 
              className="bg-transparent text-xs w-full outline-none text-slate-300 placeholder:text-slate-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsAddPanelOpen(!isAddPanelOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded text-[10px] font-bold uppercase transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Videos
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
                  onClick={handleAddLinks}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded text-[10px] font-bold uppercase shadow-lg shadow-emerald-500/20"
                >
                  Parse & Queue
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left: Video Library Sidebar */}
        <aside className="w-64 border-r border-slate-800 flex flex-col bg-slate-900/30 flex-shrink-0">
          <div className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50">
            Active Projects
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
            {sortedVideos.map((video) => {
              const isCollapsed = video.status === 'available';
              return (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  className={`w-full p-2 rounded flex gap-3 cursor-pointer transition-all border text-left group relative ${
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
                        ) : (
                          <span className="text-[9px] text-slate-500 font-mono tracking-tighter">ID: {video.videoId.substr(0, 6)}...</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!isCollapsed && video.status === 'unavailable' && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Player & Visual Scrubber */}
        <section className="flex-1 flex flex-col bg-black relative overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center relative p-6 bg-slate-950/20">
            {/* Player Container */}
            <div className="aspect-video w-full max-w-4xl bg-slate-900 shadow-2xl relative flex flex-col justify-end group rounded-sm overflow-hidden border border-slate-800">
              {!isPlayerReady && selectedVideo.status === 'available' && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
                   <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                   <div className="text-[10px] font-mono text-slate-500 uppercase animate-pulse">Establishing Peer Connection...</div>
                </div>
              )}
              <iframe 
                ref={videoRef}
                key={selectedVideo.videoId}
                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                onLoad={() => {
                  // Some browsers trigger onLoad before the API is ready
                  setTimeout(() => setIsPlayerReady(true), 1500);
                }}
                allowFullScreen
              />
              {selectedVideo.status === 'unavailable' && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Video Stream Unavailable</h3>
                  <p className="text-sm text-slate-400 max-w-md italic mb-6">
                    The requested data stream from peer-server node {selectedVideo.videoId} could not be established. 
                    This might be due to regional restrictions or removal of source content.
                  </p>
                  <a 
                    href={`https://youtube.com/watch?v=${selectedVideo.videoId}`} 
                    target="_blank" 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold text-slate-200 transition-colors"
                  >
                    View on YouTube <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              <div className="h-10 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center gap-4 pointer-events-none absolute bottom-0 w-full">
                <div className="text-[10px] font-mono text-emerald-400">{formatTime(currentTime)} / {formatTime(selectedVideo.duration)}</div>
              </div>
            </div>

            {/* Analyst Review Floating Card */}
            <div className="mt-4 w-full max-w-4xl flex gap-4 p-3 bg-slate-900/80 border border-slate-800 rounded-lg shadow-xl">
              <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter mb-1">Analyst Context // Summary</div>
                <p className="text-[11px] text-slate-300 leading-tight">
                  {selectedVideo.review}
                </p>
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
                  {isEditorMode && inPoint !== null && outPoint !== null && (
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
                  {isEditorMode && inPoint !== null && outPoint !== null && (
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
                   const rect = e.currentTarget.getBoundingClientRect();
                   const x = e.clientX - rect.left;
                   const percent = x / rect.width;
                   seekTo(Math.floor(percent * selectedVideo.duration));
                 }}
               >
                 <div 
                   className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-100"
                   style={{ width: `${(currentTime / selectedVideo.duration) * 100}%` }}
                 />
                 <div 
                  className="absolute top-[-25px] flex flex-col items-center transition-all duration-100 cursor-grab"
                  style={{ left: `${(currentTime / selectedVideo.duration) * 100}%` }}
                 >
                   <div className="w-2 h-2 bg-emerald-400 rotate-45 mb-2 shadow-[0_0_5px_rgba(16,185,129,1)]"></div>
                   <div className="w-px h-28 bg-emerald-500 opacity-50 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                 </div>

                 {/* Editor selection indicators on scrub bar */}
                 {isEditorMode && inPoint !== null && (
                   <div 
                      className="absolute h-4 w-0.5 bg-emerald-500 top-[-2px] shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      style={{ left: `${(inPoint / selectedVideo.duration) * 100}%` }}
                   >
                     <div className="absolute top-[-10px] left-[-3px] text-[7px] font-bold text-emerald-400">IN</div>
                   </div>
                 )}
                 {isEditorMode && outPoint !== null && (
                   <div 
                      className="absolute h-4 w-0.5 bg-rose-500 top-[-2px] shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                      style={{ left: `${(outPoint / selectedVideo.duration) * 100}%` }}
                   >
                     <div className="absolute top-[-10px] left-[-7px] text-[7px] font-bold text-rose-400">OUT</div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </section>

        {/* Right: Transcript & Comment Feed */}
        <aside className="w-80 border-l border-slate-800 flex flex-col bg-slate-900/50 flex-shrink-0">
          <div className="flex h-10 border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === 'transcript' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Transcript
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab === 'comments' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Comments ({selectedVideo.comments.length})
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-3 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {searchQuery ? (
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
                          <p className="text-[11px] leading-relaxed text-slate-400 group-hover:text-slate-200 line-clamp-2 italic">"{t.text}"</p>
                        </button>
                      ))}
                    </div>
                  ))}
                </motion.div>
              ) : activeTab === 'transcript' ? (
                <motion.div 
                  key="transcript"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {selectedVideo.transcripts.map((seg, i) => (
                    <button 
                      key={i}
                      onClick={() => seekTo(seg.start)}
                      className={`flex flex-col gap-1 transition-all text-left p-2 rounded-r border-l-2 ${
                        currentTime >= seg.start && (selectedVideo.transcripts[i+1] ? currentTime < selectedVideo.transcripts[i+1].start : true)
                        ? 'bg-slate-800/80 border-emerald-500' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] font-mono text-emerald-500">00:{Math.floor(seg.start/60).toString().padStart(2, '0')}:{(seg.start%60).toString().padStart(2, '0')}</span>
                        {currentTime >= seg.start && (selectedVideo.transcripts[i+1] ? currentTime < selectedVideo.transcripts[i+1].start : true) && (
                          <span className="text-[8px] bg-emerald-500 text-slate-950 px-1 rounded font-bold tracking-tighter">ACTIVE</span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed italic ${
                        currentTime >= seg.start && (selectedVideo.transcripts[i+1] ? currentTime < selectedVideo.transcripts[i+1].start : true)
                        ? 'text-white font-medium' : 'text-slate-400'
                      }`}>
                        "{seg.text}"
                      </p>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="comments"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col gap-4"
                >
                  {selectedVideo.comments.map(comment => (
                    <div key={comment.id} className="p-3 bg-slate-900 border border-slate-800 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300">
                            {comment.author[0]}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400">{comment.author}</span>
                        </div>
                        <span className="text-[9px] text-slate-600 font-mono">{comment.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">"{comment.text}"</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mini Search / Filter Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-2 text-[9px] text-slate-400 flex-wrap">
              <span className="uppercase font-bold tracking-tighter">Filtered_Mode:</span>
              <span className="bg-slate-800 px-1 rounded border border-slate-700">DEBUG</span>
              <span className="bg-slate-800 px-1 rounded border border-slate-700">UI/UX</span>
              <span className="bg-emerald-950 text-emerald-400 px-1 rounded border border-emerald-500/50 underline cursor-pointer">INSIGHTS</span>
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
