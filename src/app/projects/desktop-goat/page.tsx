import styles from "./desktop-goat.module.css";
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
  title: "Desktop Goat | Kirk Backus",
  description: "An interactive, physics-enabled companion for your Windows desktop built with C# and WPF.",
};

export default function DesktopGoatPage() {
  const tags = ["C#", "WPF", "Win32 API", "Desktop Application", "Physics"];
  
  const achievements = [
    { emoji: "🦶", title: "First Steps", desc: "Walk 100 cumulative steps." },
    { emoji: "🧗", title: "Roof Scaler", desc: "Climb 10 active windows." },
    { emoji: "💖", title: "Good Boy", desc: "Pet a goat 10 times." },
    { emoji: "💥", title: "Clash of Titans", desc: "Witness a headbutt collision between two goats." },
    { emoji: "🐛", title: "Bug Hunter", desc: "Let a goat stand on VS Code or Visual Studio." },
    { emoji: "🏄", title: "Web Surfer", desc: "Let a goat stand on a web browser window." }
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
        <h1 className={styles.title}>Desktop Goat</h1>
        <p className={styles.subtitle}>
          A mischievous companion that walks on active application windows, grazes on desktop borders, and headbutts windows. An exercise in layered transparency, Win32 window hooks, and custom 2D physics.
        </p>

        <div className={styles.btnGroup}>
          <a
            href={getAssetPath("/downloads/desktop-goat-win-x64.zip")}
            download
            className={styles.primaryBtn}
          >
            Download Standalone <DownloadIcon />
          </a>
        </div>
      </header>

      {/* Content Layout */}
      <div className={styles.contentLayout}>
        <div className={styles.mainColumn}>
          {/* Features Section */}
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Playful Interactive Behaviors</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🐐💥</span>
                <h3 className={styles.featureTitle}>Window Headbutting</h3>
                <p className={styles.featureDesc}>
                  Goats stop near active window boundaries, rear up, and headbutt the application. The target window physically shakes on screen using Win32 API window positioning offsets.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>📄😋</span>
                <h3 className={styles.featureTitle}>Grazing & Nibbling</h3>
                <p className={styles.featureDesc}>
                  Watch the goat approach your desktop icons or active window borders and start chewing on them, leaving paper shred particles in their wake.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🎈🪂</span>
                <h3 className={styles.featureTitle}>Balloon Floating</h3>
                <p className={styles.featureDesc}>
                  When walking off a high window ledge, goats deploy a tiny pixel-art parachute or inflate a colorful balloon to float down gently to the next surface.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>⚽</span>
                <h3 className={styles.featureTitle}>Physics Toy Ball</h3>
                <p className={styles.featureDesc}>
                  Spawn a physics-enabled soccer ball from the settings menu. Goats will run towards the ball, kick it with their hooves, or headbutt it across active applications.
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
                  <span>⚙️</span> Custom Physics Engine
                </h3>
                <p className={styles.techCardContent}>
                  Implements basic 2D rigid-body kinematics. Includes gravitational pull, horizontal friction, drag, and elastic boundary collisions for both goats and dynamic toy objects.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🔗</span> Win32 API Interop
                </h3>
                <p className={styles.techCardContent}>
                  Uses low-level user32.dll hooks (such as <code>GetWindowRect</code> and <code>EnumWindows</code>) to discover boundaries of active applications. This allows goats to walk on top of Chrome, VS Code, or system dialogs in real time.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>👁️</span> Layered Transparency
                </h3>
                <p className={styles.techCardContent}>
                  Utilizes WPF transparent windows with custom Win32 extended styles (<code>WS_EX_TRANSPARENT</code> and <code>WS_EX_TOOLWINDOW</code>) to render overlay sprites cleanly without interrupting mouse interactions or capturing clicks.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🔊</span> Waveform Sound Synthesis
                </h3>
                <p className={styles.techCardContent}>
                  Instead of shipping heavy audio files, the app programmatically synthesizes retro sound effects (bleats, clacks, snoring) by writing raw sine/square wave data directly to the Windows sound buffers at runtime.
                </p>
              </div>
            </div>
          </section>

          {/* Visual Showcase */}
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Visual Showcase</h2>
            <div className={styles.gallery}>
              <div className={styles.imageContainer}>
                <img
                  src={getAssetPath("/images/desktop-goat/ideal-ui.png")}
                  alt="Desktop Goat Ideal Interface Design Mockup"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <p className={styles.caption}>Ideal visual layout with retro sprites, custom stats, and interactive control bars.</p>

              <div className={styles.imageContainer}>
                <img
                  src={getAssetPath("/images/desktop-goat/farm_preferences_ui_mockup.png")}
                  alt="Desktop Goat Preferences Settings UI Mockup"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <p className={styles.caption}>Rich customization options: select goat breed (horned/hornless, color variations), scale size, walk speed, toggle sound types, and view achievements progress.</p>
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
              <span className={styles.specValue}>.NET 8.0 (WPF)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Bundle Type</span>
              <span className={styles.specValue}>Self-Contained Standalone</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Download Size</span>
              <span className={styles.specValue}>~67.8 MB (.zip)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Dependencies</span>
              <span className={styles.specValue}>None (runtime embedded)</span>
            </div>
          </div>

          {/* Achievements Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Achievements List</h3>
            <div className={styles.achievementList}>
              {achievements.map((achievement, idx) => (
                <div key={idx} className={styles.achievementItem}>
                  <span className={styles.achievementEmoji}>{achievement.emoji}</span>
                  <div className={styles.achievementDetails}>
                    <span className={styles.achievementTitle}>{achievement.title}</span>
                    <span className={styles.achievementDesc}>{achievement.desc}</span>
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
