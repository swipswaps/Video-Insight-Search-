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
    title: "Alternative Heating & Supplies: How a Wood Boiler Works",
    videoId: "f-Yh5L4fT8E",
    thumbnail: "https://img.youtube.com/vi/f-Yh5L4fT8E/hqdefault.jpg",
    review: "A detailed analysis of wood boiler operation and water chemistry requirements for long-term maintenance.",
    duration: 328,
    status: 'available',
    transcripts: [
      { start: 0, duration: 15, text: "Welcome to Alternative Heating and Supplies. I'm Jeff. Today we're going to talk about wood boiler water treatment." },
      { start: 30, duration: 25, text: "Why do we need water treatment? Because your wood boiler is made of steel, and steel likes to rust when exposed to oxygen and water." },
      { start: 75, duration: 20, text: "The closed loop system needs a chemical scavenger to remove that oxygen and protect the heat exchangers." }
    ],
    comments: [
      { id: "c1", author: "HistoryBuff", text: "The transition to digital archives was handled expertly here.", timestamp: "2 days ago" }
    ]
  },
  {
    id: "2",
    title: "Infrastructure and Growth in a Developing City",
    videoId: "L6RfIUUhgLs",
    thumbnail: "https://img.youtube.com/vi/L6RfIUUhgLs/hqdefault.jpg",
    review: "Evaluation of urban expansion and the critical role of resource management in 21st-century cities.",
    duration: 262,
    status: 'available',
    transcripts: [
      { start: 0, duration: 20, text: "Urbanization is a central theme of the 21st century. It's not just about people moving to cities, it's about how those cities adapt." },
      { start: 30, duration: 25, text: "Sustainable urbanization requires a shift from linear to circular systems in both physical infrastructure and digital management." },
      { start: 60, duration: 25, text: "By the year 2050, it is estimated that two-thirds of the world's population will live in urban areas." }
    ],
    comments: [
      { id: "c3", author: "CreativeLead", text: "The color contrast is significantly higher in this version.", timestamp: "5 hours ago" }
    ]
  },
  {
    id: "3",
    title: "Why the World's Best Brand is Not a Brand",
    videoId: "BDlHx6NJx7I",
    thumbnail: "https://img.youtube.com/vi/BDlHx6NJx7I/hqdefault.jpg",
    review: "A strategic overview of brand authenticity and building long-term consumer trust through values.",
    duration: 180,
    status: 'available',
    transcripts: [
      { start: 0, duration: 15, text: "A brand is not what you say it is. It is what they say it is." },
      { start: 30, duration: 20, text: "Your brand is a promise you make to your customers. If you break that promise, you lose the brand." },
      { start: 60, duration: 25, text: "Great brands are built on authenticity and a deep understanding of the human condition." }
    ],
    comments: [
      { id: "c4", author: "DevOps_Dan", text: "The segment at 3:19 is exactly what I was looking for.", timestamp: "1 week ago" }
    ]
  }
];
