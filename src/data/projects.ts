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
  }
];
