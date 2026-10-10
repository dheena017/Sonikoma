import type { Project } from "../hooks/ProjectTypes";

export const DEMO_PROJECTS: Project[] = [
  {
    project_id: "demo-solo-shadow-ch1",
    series_id: "demo-solo-shadow",
    series_slug: "shadow-monarch-chronicles",
    chapter_slug: "chapter-1-awakening",
    title: "Shadow Monarch: Awakening (Ch. 1)",
    url: "https://www.webtoons.com/demo/shadow-monarch/ep1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "Completed",
    panels_count: 24,
    imported_assets_count: 24,
    genre: "Action / Fantasy",
    author: "Redice & Sonikoma",
    cover_image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
    synopsis:
      "An E-rank hunter discovers a secret double dungeon quest that grants him a unique ability to level up infinitely.",
    episode: 1,
  },
  {
    project_id: "demo-solo-shadow-ch2",
    series_id: "demo-solo-shadow",
    series_slug: "shadow-monarch-chronicles",
    chapter_slug: "chapter-2-daily-quest",
    title: "Shadow Monarch: The Daily Quest (Ch. 2)",
    url: "https://www.webtoons.com/demo/shadow-monarch/ep2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    status: "Completed",
    panels_count: 18,
    imported_assets_count: 18,
    genre: "Action / Fantasy",
    author: "Redice & Sonikoma",
    cover_image:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
    synopsis:
      "The penalty zone tests Sung's endurance in a vast desert of giant centipedes.",
    episode: 2,
  },
  {
    project_id: "demo-neon-district-ch1",
    series_id: "demo-neon-district",
    series_slug: "neon-district-2088",
    chapter_slug: "chapter-1-ghost-drop",
    title: "Neon District 2088: Ghost Drop",
    url: "https://www.webtoons.com/demo/neon-district/ep1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "Completed",
    panels_count: 32,
    imported_assets_count: 32,
    genre: "Sci-Fi / Cyberpunk",
    author: "Sonikoma Studios",
    cover_image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    synopsis:
      "In the rain-drenched alleys of Neo-Kyoto, an augmented cyber detective tracks an illegal neural data carrier.",
    episode: 1,
  },
  {
    project_id: "demo-celestial-blade-ch1",
    series_id: "demo-celestial-blade",
    series_slug: "celestial-sword-saint",
    chapter_slug: "chapter-1-meridian",
    title: "Celestial Sword Saint (Ch. 1)",
    url: "https://www.webtoons.com/demo/celestial-sword/ep1",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "Processing",
    panels_count: 16,
    imported_assets_count: 16,
    genre: "Martial Arts",
    author: "Cloud Pavilion",
    cover_image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    synopsis:
      "Banished with severed spiritual roots, an apprentice uncovers the ancient dragon breathing technique.",
    episode: 1,
  },
];

const DEMO_STORAGE_KEY = "sonikoma_demo_projects_active";

export function getStoredDemoProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDemoProjectsToStorage(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn("Failed to save demo projects to storage", err);
  }
}

export function clearDemoProjectsFromStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear demo projects from storage", err);
  }
}
