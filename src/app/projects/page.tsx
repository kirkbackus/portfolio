"use client";

import { useState, useMemo } from "react";
import styles from "./projects.module.css";
import { projects } from "@/data/projects";

// Clean minimal SVG Arrow Icon
const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: "4px" }}>
    <path d="M2.08333 1.5H10.5V9.91667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Clean minimal SVG Search Icon
const SearchIcon = () => (
  <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  // Dynamically extract all unique tags from the projects list
  const filterTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((project) => {
      project.tags.forEach((tag) => tags.add(tag));
    });
    return ["All", ...Array.from(tags).sort()];
  }, []);

  // Filtered projects based on search query and selected filter pill
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesTag = selectedTag === "All" || project.tags.includes(selectedTag);
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === "" ||
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some((t) => t.toLowerCase().includes(query));

      return matchesTag && matchesSearch;
    });
  }, [searchQuery, selectedTag]);

  return (
    <div className={`${styles.projectsPage} container animate-fade-in`}>
      <header className={styles.projectsHeader}>
        <h1 className={styles.title}>Projects</h1>
        <p className={styles.subtitle}>
          A comprehensive archive of libraries, developer tools, compiler frontends, and distributed systems.
        </p>
      </header>

      {/* Search and Filters Controls */}
      <div className={styles.controlsRow}>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search projects..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterList}>
          {filterTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.filterBtn} ${
                selectedTag === tag ? styles.filterBtnActive : ""
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List of Projects */}
      {filteredProjects.length > 0 ? (
        <div className={styles.projectsGrid}>
          {filteredProjects.map((project) => (
            <article key={project.id} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <h2 className={styles.projectTitle}>{project.title}</h2>
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
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.projectLink}
                    >
                      Live Demo <ArrowIcon />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          <h3 className={styles.noResultsTitle}>No projects found</h3>
          <p>Try adjusting your search query or filter tags.</p>
        </div>
      )}
    </div>
  );
}
