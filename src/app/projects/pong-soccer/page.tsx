"use client";

import { useState, useRef } from "react";
import styles from "./pong-soccer.module.css";
import Link from "next/link";
import { getAssetPath } from "@/utils/paths";

// Clean minimal SVG Arrow Icon
const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.08333 1.5H10.5V9.91667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

export default function PongSoccerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const tags = ["JavaScript", "Three.js", "WebGL", "Web Audio API", "Game Development"];
  
  const gameplaySteps = [
    { emoji: "🔴", title: "Red Team Player", desc: "Use W and S keys to slide your defenders up and down to block the ball." },
    { emoji: "🔵", title: "Blue Team/AI goalie", desc: "Play against a predictive, velocity-based AI goalkeeper, or add Player 2." },
    { emoji: "⚽", title: "Elastic Collisions", desc: "Deflect the ball off your paddles. Speed increases with each rally!" },
    { emoji: "🏆", title: "Goal Scored", desc: "Slam the ball past the opponent's goalie and into the net to score." }
  ];

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
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
        <h1 className={styles.title}>Soccer Arena</h1>
        <p className={styles.subtitle}>
          A retro N64-style 3D Pong soccer minigame featuring dynamic waveform sound synthesis, local multiplayer, gamepad support, and a predictive AI opponent.
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
            Start Kickoff Now <PlayIcon />
          </a>
        </div>
      </header>

      {/* Playable Game Cabinet (Arcade) */}
      <section id="play" className={styles.gameSection}>
        <div className={styles.gameWrapper} ref={containerRef}>
          <div className={styles.gameArcade}>
            {!isPlaying ? (
              <div 
                className={styles.arcadePlaceholder}
                style={{ backgroundImage: `url(${getAssetPath("/images/pong-soccer/showcase.png")})` }}
              >
                <div className={styles.arcadeContent}>
                  <h2 className={styles.arcadeTitle}>SOCCER ARENA</h2>
                  <p className={styles.arcadeSubtitle}>N64-Style Retro Arcade Companion</p>
                  <button className={styles.playBtn} onClick={() => setIsPlaying(true)}>
                    INSERT COIN & PLAY
                  </button>
                </div>
              </div>
            ) : (
              <iframe 
                src={getAssetPath("/games/pong-soccer/index.html")}
                className={styles.gameFrame}
                title="Soccer Arena Game"
                allow="autoplay"
              />
            )}
          </div>
          
          <div className={styles.gameControlsOverlay}>
            <div className={styles.controlsGuideList}>
              <div className={styles.controlItem}>
                <span>P1 (Red):</span>
                <span className={styles.keycap}>W</span>
                <span className={styles.keycap}>S</span>
              </div>
              <div className={styles.controlItem}>
                <span>P2 (Blue):</span>
                <span className={styles.keycap}>↑</span>
                <span className={styles.keycap}>↓</span>
              </div>
              <div className={styles.controlItem}>
                <span>Gamepad:</span>
                <span>🎮 Analog Stick</span>
              </div>
            </div>
            
            {isPlaying && (
              <button className={styles.fullScreenBtn} onClick={handleFullscreen}>
                Fullscreen <FullscreenIcon />
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
            <h2 className={styles.sectionTitle}>N64-Era Aesthetics & Gameplay</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🤖💡</span>
                <h3 className={styles.featureTitle}>Predictive Goalie AI</h3>
                <p className={styles.featureDesc}>
                  Features a custom goalie algorithm that reads the ball's trajectory, intercepts along its path, and dynamically responds with scaling reaction delays based on selected difficulty settings.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🔈⚙️</span>
                <h3 className={styles.featureTitle}>Waveform Sound Synthesis</h3>
                <p className={styles.featureDesc}>
                  Programmatically synthesizes classic retro sound effects (laser impacts, crowds cheering, scoreboard bells) using raw frequency oscillators directly via the browser's Web Audio API.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🏟️🕶️</span>
                <h3 className={styles.featureTitle}>Orthographic 3D Viewport</h3>
                <p className={styles.featureDesc}>
                  Implements static 3D camera angles that mimic vintage 90s console games. Standardized lighting models, field markings, and low-poly goalie paddles evoke retro soccer aesthetics.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🎮🔥</span>
                <h3 className={styles.featureTitle}>Gamepad & Dual-Keyboard Input</h3>
                <p className={styles.featureDesc}>
                  Play locally in 2-Player mode. Integrates standard HTML5 Gamepad APIs for plug-and-play controller inputs, alongside split keyboard configurations.
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
                  <span>⚽</span> Kinetic Collision Engine
                </h3>
                <p className={styles.techCardContent}>
                  Implements elastic collisions for the ball against arena boundaries and goalie paddles. Adds a slight acceleration vector on each paddle hit to keep gameplay intense.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🕸️</span> WebGL Render Loop
                </h3>
                <p className={styles.techCardContent}>
                  Uses Three.js for 3D meshes, rendering materials, and animating camera systems. The game state executes in a requestAnimationFrame loop with frame-rate independent physics updates.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🎧</span> Procedural Web Audio
                </h3>
                <p className={styles.techCardContent}>
                  Synthesizes sounds in real-time by chaining <code>OscillatorNode</code> and <code>GainNode</code> configurations. This keeps loading speeds fast without large WAV or MP3 network payloads.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🔒</span> Closed Source Codebase
                </h3>
                <p className={styles.techCardContent}>
                  Maintained in a private repository. Implemented as an independent, modular vanilla JS script system ensuring zero external code bleed and easy integration.
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
              <span className={styles.specValue}>Modern Web Browsers</span>
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
              <span className={styles.specLabel}>Multiplayer</span>
              <span className={styles.specValue}>Local 2-Player / VS AI</span>
            </div>
          </div>

          {/* How to Play Card */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>How to Play</h3>
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
