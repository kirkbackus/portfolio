import styles from "./page.module.css";
import { projects } from "@/data/projects";
import Link from "next/link";
import { getAssetPath } from "@/utils/paths";

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

export default function Home() {
  // Only display featured projects on the homepage
  const featuredProjects = projects.filter((project) => project.featured);

  const startYear = 2004;
  const yearsOfExperience = new Date().getFullYear() - startYear;

  // List of text-based expertise items
  const expertise = [
    "Enterprise Web Applications",
    "RESTful API Design",
    "Desktop Applications (C#/.NET)",
    "Relational Databases (MySQL)",
    "Cloud Infrastructure (AWS)",
    "System Architecture"
  ];

  return (
    <div className="container">
      {/* Two-Column Hero Section */}
      <section className={`${styles.hero} animate-fade-in`}>
        {/* Left Column - Copy & Call to Action */}
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Software Engineer</span>
          <h1 className={styles.heroTitle}>
            Engineering software where performance matters.
          </h1>
          <p className={styles.heroSubtitle}>
            I build high-performance distributed systems, database engines, developer tooling, and modern web applications. Focused on clean architecture, maintainability, and long-term scalability.
          </p>
          
          <div className={styles.btnGroup}>
            <Link href="#work" className={styles.primaryBtn}>
              View Projects
            </Link>
            <a
              href="https://github.com/kirkbackus"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryBtn}
            >
              GitHub
            </a>
          </div>

          {/* Metrics Row */}
          <div className={styles.metricsRow}>
            <div className={styles.metricItem}>
              {yearsOfExperience}+ Years Experience
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricDot} />
              Database Engineering
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricDot} />
              Distributed Systems
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricDot} />
              Open Source
            </div>
          </div>
        </div>

        {/* Right Column - Flagship Project Showcase */}
        <div className={styles.heroRight}>
          <Link href="/projects/playground-unlimited" className={styles.flagshipCard}>
            <div className={styles.flagshipImageWrapper}>
              <img
                src={getAssetPath("/images/playground-unlimited/current-ui.png")}
                alt="Playground Unlimited physics sandbox dashboard"
                className={styles.flagshipImage}
              />
            </div>
            <div className={styles.flagshipInfo}>
              <div className={styles.flagshipHeader}>
                <span className={styles.flagshipTitle}>Playground Unlimited</span>
                <span className={styles.flagshipLabel}>Flagship Project</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Expertise section */}
      <section className={`${styles.expertiseSection} animate-fade-in delay-100`}>
        <h2 className={styles.expertiseTitle}>Areas of Expertise</h2>
        <div className={styles.expertisePills}>
          {expertise.map((item) => (
            <span key={item} className={styles.expertisePill}>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="work" className="animate-fade-in delay-200">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Work</h2>
          <p className={styles.sectionSubtitle}>A selection of engineering projects and open-source software.</p>
        </div>
        
        <div className={styles.projectsGrid}>
          {featuredProjects.map((project) => (
            <article key={project.id} className={styles.projectCard}>
              {project.screenshotUrl && (
                <div className={styles.cardImageWrapper}>
                  <img
                    src={getAssetPath(project.screenshotUrl)}
                    alt={`${project.title} screenshot`}
                    className={styles.cardImage}
                  />
                </div>
              )}
              <div className={styles.cardBody}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
                
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
                        href={getAssetPath(project.downloadUrl)}
                        download
                        className={styles.projectLink}
                      >
                        Download <DownloadIcon />
                      </a>
                    )}
                  </div>
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
      <section id="about" className="animate-fade-in delay-300">
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
                  <span className={styles.skillDot} /> Java / Spring MVC
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> TypeScript / React / Next.js
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> C# / .NET / Win32 API
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> MySQL / PostgreSQL / SQL
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> AWS (Cloud Services)
                </div>
                <div className={styles.skillItem}>
                  <span className={styles.skillDot} /> Distributed Systems / REST APIs
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="animate-fade-in delay-400">
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
              GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
