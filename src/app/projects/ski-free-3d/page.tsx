"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useEffect } from "react";
import styles from "./ski-free-3d.module.css";
import Link from "next/link";
import { getAssetPath } from "@/utils/paths";

// Clean minimal SVG Play Icon
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
  </svg>
);

// Clean minimal SVG Fullscreen Icon
const FullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

// Clean minimal SVG Exit Fullscreen Icon
const ExitFullscreenIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" />
  </svg>
);

export default function SkiFree3DPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const tags = ["JavaScript", "Three.js", "WebGL", "Web Audio API", "Game Development", "Procedural Generation"];
  
  const gameplaySteps = [
    { emoji: "⛷️", title: "Steer Skier", desc: "Move mouse left/right to steer. The steering mimics actual ski poles (reversed inputs!)." },
    { emoji: "🦘", title: "Launch & Jumps", desc: "Left-click or tap screen to jump. Use red ramps to launch high into the air." },
    { emoji: "✨", title: "Aerial Spin Tricks", desc: "Click/tap repeatedly while mid-air to spin and build up style multipliers!" },
    { emoji: "👹", title: "Escaping Yeti", desc: "Cross 1,500 meters and the Abominable Snowman begins his relentless pursuit. Stay fast!" }
  ];

  // Sync native fullscreen state changes (e.g. exit via Escape key or browser UI)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isCurrentlyFullscreen = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullscreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        setIsPseudoFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Sync Escape key for pseudo-fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPseudoFullscreen]);

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
      return;
    }

    const doc = document as any;
    const isCurrentlyFullscreen = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullscreenElement ||
      doc.msFullscreenElement
    );

    if (isCurrentlyFullscreen) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    } else {
      const req =
        container.requestFullscreen ||
        (container as any).webkitRequestFullscreen ||
        (container as any).mozRequestFullScreen ||
        (container as any).msRequestFullscreen;

      if (req) {
        req.call(container).catch(() => {
          // Fallback to CSS pseudo-fullscreen on failure
          setIsPseudoFullscreen(true);
        });
      } else {
        // Fallback to CSS pseudo-fullscreen if API unsupported (e.g., iOS Safari)
        setIsPseudoFullscreen(true);
      }
    }
  };

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
        <h1 className={styles.title}>SkiFree 3D</h1>
        <p className={styles.subtitle}>
          A retro-modern low-poly alpine survival adventure in 3D WebGL. Infinite procedural slopes, obstacle physics, slalom gates, trick systems, and the legendary Abominable Snowman.
        </p>

        <div className={styles.btnGroup}>
          <a
            href="#play"
            className={styles.primaryBtn}
            onClick={(e) => {
              e.preventDefault();
              setIsPlaying(true);
              document.getElementById("play")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Start Alpine Run <PlayIcon />
          </a>
        </div>
      </header>

      {/* Playable Game Cabinet (Arcade) */}
      <section id="play" className={styles.gameSection}>
        <div className={`${styles.gameWrapper} ${isPseudoFullscreen ? styles.pseudoFullscreen : ""}`} ref={containerRef}>
          <div className={styles.gameArcade}>
            {!isPlaying ? (
              <div 
                className={styles.arcadePlaceholder}
                style={{ backgroundImage: `url(${getAssetPath("/images/ski-free-3d/showcase.png")})` }}
              >
                <div className={styles.arcadeContent}>
                  <h2 className={styles.arcadeTitle}>SKI<span>FREE</span> 3D</h2>
                  <p className={styles.arcadeSubtitle}>Low-Poly 3D Alpine Survival Game</p>
                  <button className={styles.playBtn} onClick={() => setIsPlaying(true)}>
                    INSERT COIN & PLAY
                  </button>
                </div>
              </div>
            ) : (
              <iframe 
                src={getAssetPath("/games/ski-free-3d/index.html")}
                className={styles.gameFrame}
                title="SkiFree 3D Game"
                allow="autoplay"
              />
            )}
          </div>
          
          <div className={styles.gameControlsOverlay}>
            <div className={styles.controlsGuideList}>
              <div className={styles.controlItem}>
                <span>Steer:</span>
                <span>🖱️ Mouse Move / 📱 Touch Drag</span>
              </div>
              <div className={styles.controlItem}>
                <span>Jump / Trick:</span>
                <span className={styles.keycap}>Left-Click</span>
                <span>or Tap</span>
              </div>
              <div className={styles.controlItem}>
                <span>Brake:</span>
                <span>Steer Sharply Left/Right</span>
              </div>
            </div>
            
            {isPlaying && (
              <button className={styles.fullScreenBtn} onClick={toggleFullscreen}>
                {isFullscreen || isPseudoFullscreen ? (
                  <>
                    Exit Fullscreen <ExitFullscreenIcon />
                  </>
                ) : (
                  <>
                    Fullscreen <FullscreenIcon />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Content Layout */}
      <div className={styles.contentLayout}>
        <div className={styles.mainColumn}>
          {/* Features Section */}
          <section className={styles.section} style={{ paddingTop: 0, paddingBottom: 0 }}>
            <h2 className={styles.sectionTitle}>Infinite Runs & Alpine Hazards</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🌲🏔️</span>
                <h3 className={styles.featureTitle}>Procedural Slope Generation</h3>
                <p className={styles.featureDesc}>
                  Features a dynamically generated, infinite ski run. Ground tiles recycle seamlessly while pine trees, rock clusters, slalom gates, and speed ramps spawn procedurally to test your reflexes.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>⛷️✨</span>
                <h3 className={styles.featureTitle}>Aerial Trick System</h3>
                <p className={styles.featureDesc}>
                  Launch off red speed ramps to catch big air! Click or tap the screen repeatedly while airborne to spin. Land your tricks cleanly to rack up massive style multipliers.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>👹❄️</span>
                <h3 className={styles.featureTitle}>Yeti Pursuit Logic</h3>
                <p className={styles.featureDesc}>
                  Cross 1,500 meters to trigger the Abominable Snowman. The Yeti tracks your coordinates, gains speed on straight lines, and leaps to devour you once in range.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🔈⛷️</span>
                <h3 className={styles.featureTitle}>Procedural Web Audio API</h3>
                <p className={styles.featureDesc}>
                  Zero external media files. Procedurally synthesizes the sound of wind rushing, ski pole impacts, friction changes on ice or powder snow, and yeti roars using real-time browser oscillators.
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
                  <span>⛰️</span> Infinite Tiling System
                </h3>
                <p className={styles.techCardContent}>
                  Maintains a pool of ground terrain meshes. As the skier moves down, older tiles and off-screen obstacles are automatically culled and repositioned ahead of the skier to maintain a stable 60 FPS.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>📐</span> Low-Poly WebGL Meshes
                </h3>
                <p className={styles.techCardContent}>
                  Built with modular, flat-shaded Three.js geometries. Includes simplified skeletal animations for the skier, Yeti, and environmental entities calculated dynamically using translation matrices.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🔊</span> Oscillator Audio Graph
                </h3>
                <p className={styles.techCardContent}>
                  Chains multiple <code>OscillatorNode</code>, <code>GainNode</code>, and <code>BiquadFilterNode</code> instances. Leverages random frequency modulation and white noise buffers to generate authentic 8-bit sound effects.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🔒</span> Closed Source Codebase
                </h3>
                <p className={styles.techCardContent}>
                  Developed in a private repository as a vanilla JS implementation. Kept highly decoupled from frontend frameworks to allow direct iframe integration with optimal runtime performance.
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
              <span className={styles.specLabel}>Platform</span>
              <span className={styles.specValue}>Web Browsers (Desktop & Mobile)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Engine / Graphics</span>
              <span className={styles.specValue}>Three.js (WebGL)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Audio</span>
              <span className={styles.specValue}>Web Audio API Synthesis</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>License</span>
              <span className={styles.specValue}>Closed Source</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>High Scores</span>
              <span className={styles.specValue}>Local Storage Tracking</span>
            </div>
          </div>

          {/* How to Play Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>How to Ski</h3>
            <div className={styles.achievementList}>
              {gameplaySteps.map((step, idx) => (
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
