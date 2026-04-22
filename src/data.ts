export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface VideoComment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export type VideoStatus = 'available' | 'unavailable' | 'checking';

export interface VideoData {
  id: string;
  title: string;
  videoId: string;
  thumbnail: string;
  review: string;
  status: VideoStatus;
  transcripts: TranscriptSegment[];
  comments: VideoComment[];
}

export const MOCK_VIDEOS: VideoData[] = [
  {
    id: "1",
    title: "Understanding BTRFS Fragmentation and HDD Latency",
    videoId: "dQw4w9WgXcQ",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=1200",
    review: "An in-depth analysis of file system performance on mechanical drives, focusing on metadata amplification and I/O wait issues.",
    status: 'available',
    transcripts: [
      { start: 0, duration: 30, text: "Welcome to the deep dive into Linux file systems." },
      { start: 30, duration: 45, text: "Today we are looking at why BTRFS can feel slow on mechanical HDDs." },
      { start: 75, duration: 60, text: "The primary culprit is metadata fragmentation and the Copy-on-Write mechanism." },
      { start: 135, duration: 50, text: "We'll also discuss how USB-SATA bridges can aggravate the I/O wait latency." }
    ],
    comments: [
      { id: "c1", author: "SysAdmin88", text: "Finally an explanation for my 42% I/O wait!", timestamp: "2 days ago" },
      { id: "c2", author: "LinuxGuru", text: "Transitioning to NVMe really is the only permanent fix.", timestamp: "1 day ago" }
    ]
  },
  {
    id: "2",
    title: "USB Bridge Debugging & UAS Protocols",
    videoId: "jNQXAC9IVRw",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
    review: "Exploring the differences between BOT and UAS transport protocols in USB storage devices and their impact on system load.",
    status: 'unavailable',
    transcripts: [
      { start: 0, duration: 20, text: "Let's talk about USB transport protocols." },
      { start: 20, duration: 40, text: "UAS allows for multiple commands to be queued, unlike the legacy BOT protocol." },
      { start: 60, duration: 35, text: "Check your dmesg logs for 'uas' to confirm your hardware supports it properly." }
    ],
    comments: [
      { id: "c3", author: "HardwareWhiz", text: "The UAS driver is a game changer for external SSDs.", timestamp: "5 hours ago" }
    ]
  },
  {
    id: "3",
    title: "The Balloon Lady: Artistic Showcase",
    videoId: "3tmd-ClpJKA",
    thumbnail: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?auto=format&fit=crop&q=80&w=1200",
    review: "A visual journey through intricate balloon sculptures and event decorations by Elizabeth.",
    status: 'available',
    transcripts: [
      { start: 0, duration: 15, text: "Creating massive balloon installations requires planning and precision." },
      { start: 15, duration: 45, text: "Each twist and turn counts when building these structural masterpieces." },
      { start: 60, duration: 30, text: "This display took over 12 hours to finalize but the result is stunning." }
    ],
    comments: [
      { id: "c4", author: "EventPlanner", text: "Absolute masterpiece. The colors are so vibrant!", timestamp: "1 week ago" }
    ]
  }
];
