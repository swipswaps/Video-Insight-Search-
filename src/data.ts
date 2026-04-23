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
  /** Flag indicating if the segment contains static imagery (e.g. title cards) */
  isStatic?: boolean;
  /** Unique ID for segment targeting */
  id: string;
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
  /** Total duration in seconds */
  duration: number;
  /** Operating status */
  status: VideoStatus;
  /** Complete transcript timeline */
  transcripts: TranscriptSegment[];
  /** IDs of segments to omit from playback/export (The EDL) */
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

