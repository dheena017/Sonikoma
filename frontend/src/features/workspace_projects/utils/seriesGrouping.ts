import type { Project } from "@/features/workspace_projects/hooks/ProjectTypes";

export interface Series {
  id: string; // The series_slug or project_id (if no series_slug)
  slug: string;
  title: string;
  cover?: string;
  chapters: Project[];
  chapterCount: number;
  latestChapter?: Project;
  latestUpdatedAt?: string;
  genre?: string;
  author?: string;
  synopsis?: string;
}

export function groupProjectsIntoSeries(projects: Project[]): Series[] {
  const seriesMap = new Map<string, Project[]>();

  for (const project of projects) {
    const key = project.series_id || project.series_slug || project.project_id;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, []);
    }
    seriesMap.get(key)!.push(project);
  }

  const seriesList: Series[] = [];

  for (const [key, chapters] of seriesMap.entries()) {
    // Sort chapters by created_at descending to find the latest
    chapters.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const latestChapter = chapters[0];

    // Determine the cover image
    // 1. Series/project cover if one exists on any chapter
    // 2. Most recently updated chapter thumbnail (first_panel_image / cover_image)
    let cover = latestChapter?.cover_image;
    if (!cover) {
      const chapterWithCover = chapters.find((c) => c.cover_image);
      if (chapterWithCover) {
        cover = chapterWithCover.cover_image;
      }
    }

    // Attempt to extract a clean series title from chapters if possible
    // Oftentimes titles might be "Solo Leveling - Chapter 1". Let's just use the latest chapter's title for now
    // or maybe the project URL can be parsed, but relying on title/slug is safer.

    // For now, if series_slug exists, we can try to format it, otherwise use the title of the latest chapter.
    // If it's a fallback standalone project, just use its title.
    let title = latestChapter?.title || "Untitled Series";

    // Some projects have the title like "Title - Chapter X", but we don't know the exact format.
    // If multiple chapters share the same series_slug, the series_slug itself might be the best bet if formatted.
    if (chapters.length > 1 && latestChapter.series_slug) {
      // try to make title case from slug: solo-leveling -> Solo Leveling
      title = latestChapter.series_slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } else if (chapters.length === 1 && latestChapter.series_slug) {
      // Even if 1 chapter, if it has a series slug, it's explicitly a series.
      title = latestChapter.series_slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    } else {
      // Standalone project fallback
      title = latestChapter.title;
    }

    seriesList.push({
      id: key,
      slug: latestChapter.series_slug || key,
      title,
      cover,
      chapters,
      chapterCount: chapters.length,
      latestChapter,
      latestUpdatedAt: latestChapter?.created_at, // For now, created_at is the closest to 'last updated' in Project.
      genre: latestChapter?.genre,
      author: latestChapter?.author,
      synopsis: latestChapter?.synopsis,
    });
  }

  // Sort series by latest chapter update
  seriesList.sort((a, b) => {
    const timeA = a.latestUpdatedAt ? new Date(a.latestUpdatedAt).getTime() : 0;
    const timeB = b.latestUpdatedAt ? new Date(b.latestUpdatedAt).getTime() : 0;
    return timeB - timeA;
  });

  return seriesList;
}
