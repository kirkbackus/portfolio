import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kirk Backus | Software Engineer",
  description: "Portfolio of Kirk Backus, showcasing projects in distributed systems, compilers, and cloud infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className={styles.header}>
          <div className={`${styles.nav} container`}>
            <div className={styles.logo}>
              <Link href="/" className={styles.logoLink}>
                Kirk Backus
              </Link>
            </div>
            <nav>
              <ul className={styles.navLinks}>
                <li className={styles.navItem}>
                  <Link href="/projects">Projects</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/#about">About</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/#contact">Contact</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <div className={`${styles.footerContent} container`}>
            <div className={styles.footerLeft}>
              © {new Date().getFullYear()} Kirk Backus. Built with Next.js.
            </div>
            <div className={styles.footerRight}>
              <a href="https://github.com/kirkbackus" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
