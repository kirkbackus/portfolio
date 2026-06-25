import styles from "./voice-keyboard.module.css";
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
  title: "Voice Keyboard | Kirk Backus",
  description: "A hands-free, global voice-to-text dictation utility for Windows with local Whisper speech recognition and LLM-powered cleanup.",
};

export default function VoiceKeyboardPage() {
  const tags = ["C#", "WinForms", "Speech Recognition", "Whisper.NET", "Local LLM", "NAudio"];
  
  const workflowSteps = [
    { emoji: "⌨️", title: "Global Hotkey", desc: "Press Ctrl+Shift+Space in any app to start recording dictation." },
    { emoji: "🎙️", title: "Voice Capture", desc: "Speak naturally. Supports both Push-to-Talk and Toggle recording modes." },
    { emoji: "🧠", title: "Local Whisper", desc: "Whisper.NET transcribes speech to raw text completely offline." },
    { emoji: "🪄", title: "AI Formatting", desc: "Local LLM (LlamaSharp) automatically cleans up grammar, punctuation, and casing." },
    { emoji: "⚡", title: "Direct Injection", desc: "Keystroke simulator types the refined text directly into the focused field." }
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
        <h1 className={styles.title}>Voice Keyboard</h1>
        <p className={styles.subtitle}>
          A system tray utility that enables hands-free dictation across all Windows applications. Combines offline neural speech-to-text with local LLM cleanup for zero-friction, grammatically polished writing.
        </p>

        <div className={styles.btnGroup}>
          <a
            href={getAssetPath("/downloads/voice-keyboard-win-x64.zip")}
            download
            className={styles.primaryBtn}
          >
            Download Standalone & Installer <DownloadIcon />
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
                <span className={styles.featureIcon}>🎙️</span>
                <h3 className={styles.featureTitle}>Global Dictation Hook</h3>
                <p className={styles.featureDesc}>
                  Trigger voice recording from any window using a custom Win32 global hotkey hook. It intercept inputs transparently without stealing focus from your active application.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🧠</span>
                <h3 className={styles.featureTitle}>Offline Speech-to-Text</h3>
                <p className={styles.featureDesc}>
                  Uses Whisper.NET (GGML) to perform on-device speech-to-text. High-accuracy transcription runs in real-time with zero external server dependencies, protecting your privacy.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>🪄</span>
                <h3 className={styles.featureTitle}>Local LLM Post-Cleanup</h3>
                <p className={styles.featureDesc}>
                  Integrates LLamaSharp to host local GGUF models. It automatically injects proper punctuation, fixes grammar, capitalized words, and reformats transcripts before typing.
                </p>
              </div>

              <div className={styles.featureCard}>
                <span className={styles.featureIcon}>⌨️</span>
                <h3 className={styles.featureTitle}>Input Simulation</h3>
                <p className={styles.featureDesc}>
                  Leverages low-level Windows <code>SendInput</code> simulation to type the final transcribed text character-by-character into any text area, document, or chat terminal.
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
                  <span>🔊</span> NAudio Capture
                </h3>
                <p className={styles.techCardContent}>
                  Captures microphone input using the Windows MMDevice API, streaming raw audio into 16kHz, mono 16-bit PCM WAV formats matching Whisper's expected specifications.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>⚙️</span> Whisper.NET Inference
                </h3>
                <p className={styles.techCardContent}>
                  Runs GGML model files locally using 16-bit quantization. Processes audio buffers asynchronously to return raw speech transcriptions in seconds.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>🦙</span> LLamaSharp Host
                </h3>
                <p className={styles.techCardContent}>
                  Hosts quantized GGUF language models directly on the CPU (using AVX/AVX2 acceleration). Standardizes and edits rough voice dictation text on the fly.
                </p>
              </div>

              <div className={styles.techCard}>
                <h3 className={styles.techCardTitle}>
                  <span>📥</span> Windows System Tray
                </h3>
                <p className={styles.techCardContent}>
                  Runs as a low-profile WinForms application context. Displays status notifications, provides quick access context menus, and provides a clean configuration interface.
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
                  src={getAssetPath("/images/voice-keyboard/settings-ui.png")}
                  alt="Voice Keyboard Settings UI Mockup"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <p className={styles.caption}>WinForms Settings Panel enabling hotkey customization, recording mode toggles (Push-to-Talk vs Toggle), and local Whisper and LLM model path setup.</p>
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
              <span className={styles.specValue}>.NET 8.0 (WinForms)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Bundle Type</span>
              <span className={styles.specValue}>Portable / MSI Installer</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Download Size</span>
              <span className={styles.specValue}>~28.3 MB (.zip)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Dependencies</span>
              <span className={styles.specValue}>.NET 8.0 Desktop Runtime</span>
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
