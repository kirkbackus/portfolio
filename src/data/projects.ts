export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  downloadUrl?: string;
  screenshotUrl?: string;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    id: "5",
    title: "Desktop Goat",
    description: "An interactive, physics-enabled companion for your Windows desktop. Watch little goats walk, graze, jump, and playfully headbutt your windows, featuring custom physics, dynamic settings, and achievements.",
    tags: ["C#", "WPF", "Win32 API", "Desktop Application", "Physics"],
    demoUrl: "/projects/desktop-goat",
    downloadUrl: "/downloads/desktop-goat-win-x64.zip",
    screenshotUrl: "/images/desktop-goat/showcase.png",
    featured: true
  },
  {
    id: "6",
    title: "Voice Keyboard",
    description: "A hands-free, global voice-to-text dictation utility for Windows. Dictate text anywhere using global hotkeys, offline Whisper.NET speech recognition, and LLamaSharp-powered local LLM text cleanup.",
    tags: ["C#", "WinForms", "Speech Recognition", "Whisper.NET", "Local LLM", "NAudio"],
    demoUrl: "/projects/voice-keyboard",
    downloadUrl: "/downloads/voice-keyboard-win-x64.zip",
    screenshotUrl: "/images/voice-keyboard/settings-ui.png",
    featured: true
  },
  {
    id: "7",
    title: "Playground Unlimited",
    description: "A real-time 2D rigid-body and fluid physics sandbox simulator built in C++ and powered by the Microsoft NovodeX (NVIDIA PhysX) engine. Features joints, springs, water simulation, custom canvas rendering, and a state-of-the-art Dear ImGui overlay dashboard.",
    tags: ["C++", "OpenGL", "NVIDIA PhysX", "Dear ImGui", "Win32 API", "Physics Simulation"],
    demoUrl: "/projects/playground-unlimited",
    downloadUrl: "/downloads/playground-unlimited-win-x86.zip",
    screenshotUrl: "/images/playground-unlimited/current-ui.png",
    featured: true
  },
  {
    id: "8",
    title: "Smart Desktop Organizer",
    description: "An intelligent C# Windows Forms utility to organize desktop icons and clean up filesystem clutter. It uses Windows registry logs (UserAssist) and Recent Documents history to track actual shortcut usage, scales dynamically with multi-monitor visual previews, and offers safe, reversible layout backups.",
    tags: ["C#", "WinForms", "Win32 API", "COM Interop", "Activity Heuristic", "SaaS UI"],
    demoUrl: "/projects/desktop-organizer",
    downloadUrl: "/downloads/desktop-organizer-win-x64.zip",
    screenshotUrl: "/images/desktop-organizer/showcase.png",
    featured: true
  },
  {
    id: "9",
    title: "Soccer Arena",
    description: "A retro N64-style 3D Pong-soccer hybrid game built with Three.js. Features a predictive AI goalie, retro waveform sound synthesis via Web Audio API, dynamic physics, and local multiplayer support.",
    tags: ["JavaScript", "Three.js", "WebGL", "Web Audio API", "Game Development"],
    demoUrl: "/projects/pong-soccer",
    screenshotUrl: "/images/pong-soccer/showcase.png",
    featured: true
  }
];
