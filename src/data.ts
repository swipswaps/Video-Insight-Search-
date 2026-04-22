/**
 * Represents a single timed entry in the video transcript.
 * Used for playhead synchronization and search indexing.
 */
export interface TranscriptSegment {
  /** Offset from video start in seconds */
  start: number;
  /** Length of the segment in seconds */
  duration: number;
  /** The captured text for this segment */
  text: string;
}

/**
 * Represents a user comment extracted from the video platform.
 */
export interface VideoComment {
  /** Unique comment identifier */
  id: string;
  /** Username of the commenter */
  author: string;
  /** Content of the comment */
  text: string;
  /** ISO or relative string representation of comment age */
  timestamp: string;
}

/**
 * Availability states for the video processing pipeline.
 * - available: Stream is ready for playback and analysis.
 * - unavailable: Source data could not be reached (e.g. 404 or Geo-blocked).
 * - checking: Pipeline is currently probing the remote endpoint.
 */
export type VideoStatus = 'available' | 'unavailable' | 'checking';

/**
 * The primary data model for a Project in the VID (Video Insight Discovery) suite.
 */
export interface VideoData {
  /** Internal unique ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Platform-specific ID (e.g. YouTube ID) */
  videoId: string;
  /** High-resolution image URL */
  thumbnail: string;
  /** AI-generated analytical summary */
  review: string;
  /** Total duration in seconds */
  duration: number;
  /** Operating status */
  status: VideoStatus;
  /** Complete transcript timeline */
  transcripts: TranscriptSegment[];
  /** Aggregate community feedback */
  comments: VideoComment[];
}

/**
 * Initial seed data for the application's VID project library.
 * Features selected historical, marketing, and technical nodes for demo purposes.
 */
export const MOCK_VIDEOS: VideoData[] = [
  {
    id: "1",
    title: "Project Alpha: Historical Context & Timeline",
    videoId: "L6RfIUUhgLs",
    thumbnail: "https://img.youtube.com/vi/L6RfIUUhgLs/hqdefault.jpg",
    review: "A detailed investigation into pivotal moments that shifted national policy. Analyzes legislative feedback and social impacts.",
    duration: 262,
    status: 'available',
    transcripts: [
      { start: 0, duration: 30, text: "The beginning of the decade saw unprecedented changes in infrastructure." },
      { start: 30, duration: 45, text: "Policy makers were forced to reconsider the random I/O bottlenecks in government data centers." },
      { start: 75, duration: 60, text: "This led to the implementation of the first large-scale solid-state storage arrays." }
    ],
    comments: [
      { id: "c1", author: "HistoryBuff", text: "The transition to digital archives was handled expertly here.", timestamp: "2 days ago" }
    ]
  },
  {
    id: "2",
    title: "Marketing Deck: Visual Language Review",
    videoId: "BDlHx6NJx7I",
    thumbnail: "https://img.youtube.com/vi/BDlHx6NJx7I/hqdefault.jpg",
    review: "Evaluation of the new aesthetic direction for the 2026 product lineup. Focus on high-density color palettes and motion design.",
    duration: 180,
    status: 'available',
    transcripts: [
      { start: 0, duration: 20, text: "Our new brand identity focuses on clarity and vibrant emerald accents." },
      { start: 20, duration: 40, text: "Notice the smooth transitions in the opening sequence—this uses Framer Motion logic." },
      { start: 60, duration: 35, text: "We need to ensure these elements perform well on legacy SATA-based display nodes." }
    ],
    comments: [
      { id: "c3", author: "CreativeLead", text: "The color contrast is significantly higher in this version.", timestamp: "5 hours ago" }
    ]
  },
  {
    id: "3",
    title: "Technical Workshop: Pipeline Optimization",
    videoId: "4-NZ_5aB2Z0",
    thumbnail: "https://img.youtube.com/vi/4-NZ_5aB2Z0/hqdefault.jpg",
    review: "Deep dive into back-end infrastructure and dockerized environments for media processing pipelines.",
    duration: 600,
    status: 'available',
    transcripts: [
      { start: 0, duration: 15, text: "Operating inside a container requires strict dependency management." },
      { start: 199, duration: 45, text: "At this timestamp, we examine the ffmpeg probe results for corrupted headers." },
      { start: 244, duration: 30, text: "Optimizing the seek-time on BTRFS systems is a recurring challenge for this team." }
    ],
    comments: [
      { id: "c4", author: "DevOps_Dan", text: "The segment at 3:19 is exactly what I was looking for.", timestamp: "1 week ago" }
    ]
  }
];
