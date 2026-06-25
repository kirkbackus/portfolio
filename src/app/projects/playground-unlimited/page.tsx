import styles from "./playground-unlimited.module.css";
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
  title: "Playground Unlimited | Kirk Backus",
  description: "A real-time 2D rigid-body and fluid physics sandbox simulator built in C++ and powered by the NVIDIA PhysX engine.",
};

export default function PlaygroundUnlimitedPage() {
  const tags = ["C++", "OpenGL", "NVIDIA PhysX", "Dear ImGui", "Win32 API", "Physics Simulation"];
  
  const simulationScenarios = [
    { emoji: "🌊", title: "Fluid Dynamist", desc: "Spawn and simulate more than 100 interactive water or fluid particles." },
    { emoji: "⛓️", title: "Spring Loader", desc: "Bridge gaps and connect rigid bodies using elastic linear spring joints." },
    { emoji: "🏗️", title: "Bridge Builder", desc: "Weld together a chain of rectangles to build structurally sound bridges." },
    { emoji: "⚙️", title: "Autospinner", desc: "Attach a motor-driven autospin hinge joint to rotate shapes automatically." },
    { emoji: "🚀", title: "Rocket Thrust", desc: "Enable rocket thrusters on shapes to fly them using custom gravity overrides." },
    { emoji: "🌌", title: "Zero Gravity", desc: "Turn off global gravity to simulate outer space orbital mechanics." }
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
        <h1 className={styles.title}>Playground Unlimited</h1>
        <p className={styles.subtitle}>
          A real-time 2D rigid-body dynamics and fluid physics simulator. Built using C++, hardware-accelerated OpenGL graphics, and the legacy NVIDIA PhysX (NovodeX SDK) solver, with a state-of-the-art Dear ImGui overlay dashboard.
        </p>

        <div className={styles.btnGroup}>
          <a
            href={getAssetPath("/downloads/playground-unlimited-win-x86.zip")}
            download
            className={styles.primaryBtn}
          >
            Download Sandbox <DownloadIcon />
          </a>
        </div>
      </header>

      {/* Content Layout */}
      <div className={styles.contentLayout}>
        <div className={styles.mainColumn}>
          {/* Features Section */}
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Sandbox Physics Features</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🎨⚙️</span>
                <h3 className={styles.featureTitle}>Dear ImGui Dashboard</h3>
                <p className={styles.featureDesc}>
                  A dark-mode dashboard tailored with accent mint-green indicators. Offers collapsible rails, mouse position logs, transformation dials, density scrubbers, and live simulation stats.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🌊💧</span>
                <h3 className={styles.featureTitle}>Fluid & Water Solver</h3>
                <p className={styles.featureDesc}>
                  Simulate interactive liquids utilizing specialized particle hydrodynamics. Supports customizable colors, density, buoyancy, and friction variables for liquid flows.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>⛓️🔩</span>
                <h3 className={styles.featureTitle}>Joints & Springs</h3>
                <p className={styles.featureDesc}>
                  Bind bodies together using custom constraint models: rigid Welds, Hinge pins (with active motors/angles), or elastic linear Springs (with configurable stiffness/damping).
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>📐🔍</span>
                <h3 className={styles.featureTitle}>Precise Transform Edit</h3>
                <p className={styles.featureDesc}>
                  Grab shapes and modify their locations, widths, heights, rotations, masses, and gravity scales on-the-fly using drag-sliders or the keyboard panel.
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
                  <span>🤖</span> NVIDIA PhysX Integration
                </h3>
                <p className={styles.techCardContent}>
                  Integrates the 32-bit NovodeX SDK engine. Handles sub-step collision detection, friction coefficients, restitutions, dynamic angular inertia, and rigid body state updates.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>💻</span> Win32 & OpenGL Pipeline
                </h3>
                <p className={styles.techCardContent}>
                  Binds directly to Win32 window APIs (using <code>WNDCLASS</code> and <code>WndProc</code> messaging loop) coupled with an OpenGL fixed-function double-buffered pipeline for visual output.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🖊️</span> Dynamic Vector Graphics
                </h3>
                <p className={styles.techCardContent}>
                  Icons are drawn dynamically on-screen using OpenGL lines and curves rather than loading external bitmaps. This ensures vector drawings stay crisp at all screen resolutions.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>📥</span> WantCaptureMouse Blocking
                </h3>
                <p className={styles.techCardContent}>
                  Integrates the ImGui input polling system with the underlying canvas click events, preventing canvas actions or shapes drawing from bleeding through when clicking on buttons.
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
                  src={getAssetPath("/images/playground-unlimited/current-ui.png")}
                  alt="Playground Unlimited Real-Time Running Application Screenshot"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <p className={styles.caption} style={{ marginBottom: "24px" }}>
                The completed C++ & Dear ImGui interface running real-time rigid-body and fluid physics simulation, featuring vector icons, responsive layout, and timing metrics.
              </p>

              <div className={styles.imageContainer}>
                <img
                  src={getAssetPath("/images/playground-unlimited/ideal-ui.png")}
                  alt="Playground Unlimited Ideal Interface Design Mockup"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <p className={styles.caption}>
                The original visual mockup design used to reconstruct the UI styling, components placement, and dark-mode styling scheme.
              </p>
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
              <span className={styles.specValue}>Windows 10 / 11 (32-bit Target)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Languages</span>
              <span className={styles.specValue}>C++ (C++17)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>GUI Library</span>
              <span className={styles.specValue}>Dear ImGui v1.89+</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Physics Engine</span>
              <span className={styles.specValue}>NVIDIA PhysX / NovodeX</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Download Size</span>
              <span className={styles.specValue}>~11.4 MB (.zip)</span>
            </div>
          </div>

          {/* Achievements Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Simulation Goals</h3>
            <div className={styles.achievementList}>
              {simulationScenarios.map((scenario, idx) => (
                <div key={idx} className={styles.achievementItem}>
                  <span className={styles.achievementEmoji}>{scenario.emoji}</span>
                  <div className={styles.achievementDetails}>
                    <span className={styles.achievementTitle}>{scenario.title}</span>
                    <span className={styles.achievementDesc}>{scenario.desc}</span>
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
