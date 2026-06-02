export interface DownloadLink {
  label: string;
  url: string;
  password?: string;
  isVip?: boolean;
}

export interface Changelog {
  version: string;
  date: string;
  content: string;
}

export interface Game {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  coverUrl: string;
  bannerUrl: string;
  creator: string;
  developer: string;
  publisher: string;
  status: 'Hoàn thành' | 'Đang dịch' | 'Tạm ngưng' | 'Demo' | string;
  engine: 'RenPy' | 'KiriKiri' | 'Unity' | 'RPG Maker' | 'TyranoBuilder' | 'Other' | string;
  platforms: string[]; // e.g. ['Windows', 'Android', 'macOS', 'iOS', 'WebHTML5']
  ageRating: 'G' | '12+' | '15+' | '16+' | '18+' | string;
  viewsCount: number;
  downloadsCount: number;
  bookmarksCount: number;
  tags: string[];
  downloadLinks: DownloadLink[];
  changelogs: Changelog[];
  screenshots: string[];
  createdAt: string;
  updatedAt: string;
  uploaderId?: string;
  uploaderName?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  googleEmail?: string;
  password?: string; // Stored securely
  role: 'user' | 'admin' | 'dichgia' | 'vip';
  avatarUrl?: string;
}

export interface Bookmark {
  userId: string;
  gameId: string;
  createdAt: string;
}

export interface BrokenReport {
  id: string;
  gameId: string;
  gameTitle: string;
  userId: string;
  username: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  type: 'genre' | 'status' | 'feature';
}

export interface GameRequest {
  id: string;
  title: string;
  originalName?: string;
  link?: string;
  engine?: string;
  description?: string;
  platforms: string[];
  userId: string;
  username: string;
  votes: string[]; // user IDs who upvoted
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Đang tiến hành' | 'Đã hoàn thành';
  createdAt: string;
}
