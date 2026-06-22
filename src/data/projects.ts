export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  downloadUrl?: string;
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
    featured: true
  },
  {
    id: "6",
    title: "Voice Keyboard",
    description: "A hands-free, global voice-to-text dictation utility for Windows. Dictate text anywhere using global hotkeys, offline Whisper.NET speech recognition, and LLamaSharp-powered local LLM text cleanup.",
    tags: ["C#", "WinForms", "Speech Recognition", "Whisper.NET", "Local LLM", "NAudio"],
    demoUrl: "/projects/voice-keyboard",
    downloadUrl: "/downloads/voice-keyboard-win-x64.zip",
    featured: true
  }
];
