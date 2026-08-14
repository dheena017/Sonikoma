export interface PublisherProfile {
  name: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  privacy: string;
  isShort: boolean;
  madeForKids: string;
  paidPromotion: boolean;
  license: string;
  videoLanguage: string;
  channelLink: string;
  discordLink: string;
  patreonLink: string;
  playlist: string;
  authorName: string;
  artistName: string;
  webtoonPlatform: string;
  customPlatform?: string;
  chapterStart: string;
  chapterEnd: string;
  subtitlesType: string;
  subtitlesLanguage: string;
}
