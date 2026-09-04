export interface Chapter {
  number: string;
  chapter_number?: number;
  title: string;
  date: string;
  cover_image?: string;
  first_panel_image?: string;
  images?: Array<string | { url: string }>;
  url: string;
  index: number;
  rating?: number;
  likes?: string;
  views?: number;
  page_count?: number;
  images_count?: number;
  duration?: string;
  language?: string;
  is_locked?: boolean;
  comment_count?: number;
  author?: string;
  genre?: string;
  summary?: string;
}
