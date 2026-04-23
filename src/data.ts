/**
 * TRANSCRIPT_SEGMENT
 * Represents a single timed entry in the video transcript.
 * Used for playhead synchronization, search indexing, and EDL (Edit Decision List) management.
 */
export interface TranscriptSegment {
  /** Offset from video start in seconds (Float for sub-second precision) */
  start: number;
  /** Length of the segment in seconds */
  duration: number;
  /** The captured text for this segment (Verbatim) */
  text: string;
  /** Flag indicating if the segment contains static imagery (e.g. title cards) */
  isStatic?: boolean;
  /** Unique ID for segment targeting and 'Cut' operations */
  id: string;
}

/**
 * VIDEO_COMMENT
 * Represents a user comment extracted from the video platform.
 * Integration pending: To be used for sentiment analysis grounding.
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
 * VIDEO_STATUS
 * Availability states for the video processing pipeline.
 * - available: Stream is ready for playback and analysis.
 * - unavailable: Source data could not be reached (e.g. 404 or Geo-blocked).
 * - checking: Pipeline is currently probing the remote endpoint.
 */
export type VideoStatus = 'available' | 'unavailable' | 'checking';

/**
 * VIDEO_DATA_MODEL
 * The primary data model for a Project in the VID (Video Insight Discovery) suite.
 * Enforces strict typing for the verbatim analytical workflow.
 */
export interface VideoData {
  /** Internal unique ID */
  id: string;
  /** Human-readable title */
  title: string;
  /** Platform-specific ID (e.g. YouTube video ID) */
  videoId: string;
  /** High-resolution image URL for the workspace tile */
  thumbnail: string;
  /** Total duration in seconds */
  duration: number;
  /** Operating status */
  status: VideoStatus;
  /** Complete transcript timeline (extracted via multi-stage pipeline) */
  transcripts: TranscriptSegment[];
  /** IDs of segments to omit from playback/export (The EDL logic) */
  excludedSegmentIds: string[];
}

export const MOCK_VIDEOS: VideoData[] = [
  {
    id: "wood-boiler-node",
    title: "Wood Boiler Ingestion Connection",
    videoId: "f-Yh5L4fT8E",
    thumbnail: "https://img.youtube.com/vi/f-Yh5L4fT8E/hqdefault.jpg",
    duration: 328,
    status: 'available',
    transcripts: [],
    excludedSegmentIds: []
  },
  {
    id: "wattmeter-node",
    title: "Energy Check Pipeline",
    videoId: "L6RfIUUhgLs",
    thumbnail: "https://img.youtube.com/vi/L6RfIUUhgLs/hqdefault.jpg",
    duration: 207,
    status: 'available',
    transcripts: [],
    excludedSegmentIds: []
  },
  {
    id: "brand-logic-node",
    title: "Brand Theory Analytic",
    videoId: "BDlHx6NJx7I",
    thumbnail: "https://img.youtube.com/vi/BDlHx6NJx7I/hqdefault.jpg",
    duration: 180,
    status: 'available',
    transcripts: [],
    excludedSegmentIds: []
  }
];

