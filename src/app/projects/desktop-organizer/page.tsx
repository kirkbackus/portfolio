import styles from "./desktop-organizer.module.css";
import Link from "next/link";
import { getAssetPath } from "@/utils/paths";

// Clean minimal SVG Arrow Icon
const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.08333 1.5H10.5V9.91667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Clean minimal SVG Download Icon
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Clean minimal SVG Github Icon
const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export const metadata = {
  title: "Smart Desktop Organizer | Kirk Backus",
  description: "An intelligent, multi-monitor Windows desktop icon organizer and filesystem cleanup utility using NirSoft-style activity tracking.",
};

export default function DesktopOrganizerPage() {
  const tags = ["C#", "WinForms", "Win32 API", "COM Interop", "Activity Tracking", "SaaS UI"];
  
  const workflowSteps = [
    { emoji: "🔍", title: "Activity Tracking", desc: "Monitors registry logs and Recent Documents to detect true shortcut usage." },
    { emoji: "📐", title: "Grid Alignment", desc: "Calculates desktop coordinates dynamically for clean icon groupings." },
    { emoji: "🖥️", title: "Multi-Monitor Scale", desc: "Maps and draws custom layout grids across all active monitors in real-time." },
    { emoji: "🧹", title: "Folder Sweeping", desc: "Sorts loose files into Images, Documents, Media, and Archives folders." },
    { emoji: "📦", title: "Inactivity Archiver", desc: "Moves unused desktop shortcuts and files into an archive folder automatically." }
  ];

  return (
    <div className={`${styles.pageContainer} container animate-fade-in`}>
      <Link href="/projects" className={styles.backLink}>
        ← Back to Projects
      </Link>

      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <h1 className={styles.title}>Smart Desktop Organizer</h1>
        <p className={styles.subtitle}>
          A powerful Windows utility that cleans desktop clutter. It analyzes real shortcut and document usage, schedules automated column and priority-corner placements, and safely archives old items with a full multi-monitor visual preview.
        </p>

        <div className={styles.btnGroup} style={{ marginBottom: "32px" }}>
          <a
            href={getAssetPath("/downloads/desktop-organizer-win-x64.zip")}
            download
            className={styles.primaryBtn}
          >
            Download Standalone App <DownloadIcon />
          </a>
          <a
            href="https://github.com/kirkbackus/desktop-organizer"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            View GitHub Repository <GithubIcon />
          </a>
        </div>
      </header>

      {/* Content Layout */}
      <div className={styles.contentLayout}>
        <div className={styles.mainColumn}>
          {/* Features Section */}
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Key Features</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🔍</span>
                <h3 className={styles.featureTitle}>Activity Heuristic</h3>
                <p className={styles.featureDesc}>
                  Replaces unreliable NTFS access timestamps with UserAssist registry logs and Recent Documents history to capture true shortcut and document executions.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🖥️</span>
                <h3 className={styles.featureTitle}>Multi-Monitor Preview</h3>
                <p className={styles.featureDesc}>
                  Renders a custom GDI+ layout preview displaying all active monitors. Grids, priority corners, and custom-styled recency dots scale dynamically.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🧹</span>
                <h3 className={styles.featureTitle}>Loose File Sweeper</h3>
                <p className={styles.featureDesc}>
                  Sweeps cluttered files into category folders (Images, Docs, Media, Archives). Automatically handles filename collisions and supports full reversion.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>📦</span>
                <h3 className={styles.featureTitle}>Inactivity Archiver</h3>
                <p className={styles.featureDesc}>
                  Identifies and bundles ancient shortcuts and files (e.g. unused for 3+ months) into a single folder, keeping your desktop minimal and optimized.
                </p>
              </div>
            </div>
          </section>

          {/* Technical Architecture */}
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Technical Architecture</h2>
            <div className={styles.techGrid}>
              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🔗</span> COM Shell Interop
                </h3>
                <p className={styles.techCardContent}>
                  Integrates with Windows <code>IFolderView</code> and <code>IShellFolder</code> COM interfaces to query, set, and arrange desktop icon positions programmatically.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>💾</span> Transactional Backups
                </h3>
                <p className={styles.techCardContent}>
                  Stores full layout coordinate states and file movement paths in local AppData. Enables one-click restoration to revert file sweeps and icon positions instantly.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🎨</span> GDI+ Canvas Rendering
                </h3>
                <p className={styles.techCardContent}>
                  Draws lettered recency indicators (Active/Inactive/Ancient) using custom geometric scaling, glows, and alpha blending in WinForms preview panels.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🛡️</span> Zero Elevation Required
                </h3>
                <p className={styles.techCardContent}>
                  Reads ROT13-encoded execution dates under <code>HKEY_CURRENT_USER</code> without requiring administrative privileges, keeping the app lightweight and secure.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <aside className={styles.sideColumn}>
          {/* Specifications Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Specifications</h3>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Operating System</span>
              <span className={styles.specValue}>Windows 10 / 11 (64-bit)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Framework</span>
              <span className={styles.specValue}>.NET 9.0 (WinForms)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Bundle Type</span>
              <span className={styles.specValue}>Standalone Exe (win-x64)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Interface</span>
              <span className={styles.specValue}>Win32 / COM API Hooks</span>
            </div>
          </div>

          {/* Workflow Steps Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>How it Works</h3>
            <div className={styles.achievementList}>
              {workflowSteps.map((step, idx) => (
                <div key={idx} className={styles.achievementItem}>
                  <span className={styles.achievementEmoji}>{step.emoji}</span>
                  <div className={styles.achievementDetails}>
                    <span className={styles.achievementTitle}>{step.title}</span>
                    <span className={styles.achievementDesc}>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
