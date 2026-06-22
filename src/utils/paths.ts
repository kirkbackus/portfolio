/**
 * Prefixes a path with the Next.js basePath configured for the current environment.
 * Essential for assets, images, and file downloads hosted on GitHub Pages sub-paths.
 */
export const getAssetPath = (path: string | undefined): string => {
  if (!path) return "";
  
  // Skip external links, mailto protocols, or internal pages that are handled by next/link
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("mailto:")
  ) {
    return path;
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If the path already has the base path prefixed (e.g., from dynamic variables), return as is
  if (basePath && cleanPath.startsWith(basePath)) {
    return cleanPath;
  }

  return `${basePath}${cleanPath}`;
};
