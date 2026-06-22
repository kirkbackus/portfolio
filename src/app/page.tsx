import styles from "./page.module.css";
import { projects } from "@/data/projects";
import Link from "next/link";

// Clean minimal SVG Arrow Icon
const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: "4px" }}>
    <path d="M2.08333 1.5H10.5V9.91667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Clean minimal SVG Download Icon
const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// Clean minimal SVG Github Icon
const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function Home() {
  // Only display featured projects on the homepage
  const featuredProjects = projects.filter((project) => project.featured);

  return (
    <div className="container">
      {/* Hero Section */}
      <section className={`${styles.hero} animate-fade-in`}>
        <span className={styles.eyebrow}>Software Engineer</span>
        <h1 className={styles.heroTitle}>
          Designing software with precision, simplicity, and performance.
        </h1>
        <p className={styles.heroSubtitle}>
          Hello, I&apos;m Kirk Backus. I build high-performance distributed systems, database engines, and modern web applications. Focused on developer tooling, clean code, and elegant architecture.
        </p>
      </section>

      {/* Featured Projects Section */}
      <section id="work" className="animate-fade-in delay-100">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Work</h2>
          <p className={styles.sectionSubtitle}>A selection of engineering projects and open-source software.</p>
        </div>
        
        <div className={styles.projectsGrid}>
          {featuredProjects.map((project) => (
            <article key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
              </div>
              <div className={styles.projectFooter}>
                <div className={styles.projectTags}>
                  {project.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className={styles.projectLinks}>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.projectLink}
                    >
                      Source Code <ArrowIcon />
                    </a>
                  )}
                  {project.demoUrl && (
                    project.demoUrl.startsWith("/") ? (
                      <Link href={project.demoUrl} className={styles.projectLink}>
                        View Project <ArrowIcon />
                      </Link>
                    ) : (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.projectLink}
                      >
                        Live Demo <ArrowIcon />
                      </a>
                    )
                  )}
                  {project.downloadUrl && (
                    <a
                      href={project.downloadUrl}
                      download
                      className={styles.projectLink}
                    >
                      Download <DownloadIcon />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.viewAllContainer}>
          <Link href="/projects" className={styles.viewAllLink}>
            View All Projects <ArrowIcon />
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="animate-fade-in delay-200">
        <div className={styles.aboutContent}>
          <div>
            <h2 className={styles.aboutTitle}>About</h2>
          </div>
          <div>
            <div className={styles.aboutText}>
              <p className={styles.aboutParagraph}>
                I am a software engineer dedicated to building clean, maintainable, and highly performant codebases. My interests lie in systems programming, databases, API design, and web technologies.
              </p>
              <p className={styles.aboutParagraph}>
                I believe that software should be elegant both under the hood and on the screen. By utilizing negative space and keeping components modular, we build experiences that scale and last.
              </p>
            </div>
            <div className={styles.skillsGroup}>
              <h3 className={styles.skillsTitle}>Technologies & Skills</h3>
              <div className={styles.skillsGrid}>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> Go / Rust / C++
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> TypeScript / React / Next.js
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> SQL / NoSQL / Storage Engines
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> AWS / Terraform / Docker
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> Distributed Systems / gRPC
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> REST APIs / WebSockets
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="animate-fade-in delay-300">
        <div className={styles.contactContent}>
          <h2 className={styles.contactTitle}>Get in Touch</h2>
          <p className={styles.contactDescription}>
            I am always interested in discussing new projects, systems architecture, or open-source software. Feel free to reach out.
          </p>
          <div className={styles.contactLinks}>
            <a
              href="mailto:kirk@example.com"
              className={`${styles.contactButton} ${styles.contactButtonPrimary}`}
            >
              Email Me
            </a>
            <a
              href="https://github.com/kirkbackus"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.contactButton} ${styles.contactButtonSecondary}`}
            >
              <GithubIcon /> GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
