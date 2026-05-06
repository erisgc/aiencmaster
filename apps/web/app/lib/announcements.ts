import { API_BASE_URL } from './api';

export interface AnnouncementAttachment {
  id: string;
  url: string;
  resourceType: string;
  format: string;
  name: string;
  size: number;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  author: string;
  createdAt: string;
}

export interface AnnouncementDetail extends Announcement {
  attachments?: AnnouncementAttachment[];
}

async function fetchAnnouncements<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export function getLatestAnnouncements(): Promise<Announcement[]> {
  return fetchAnnouncements<Announcement[]>('/announcements/latest');
}

export function getAnnouncementsPage(limit: number, offset: number) {
  return fetchAnnouncements<Announcement[]>(
    `/announcements?limit=${limit}&offset=${offset}`,
  );
}

export function getAnnouncementById(id: string) {
  return fetchAnnouncements<AnnouncementDetail>(`/announcements/${id}`);
}
