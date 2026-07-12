const getFormattedApiUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (url) {
    return url.endsWith("/api") || url.endsWith("/api/")
      ? url.replace(/\/+$/, "")
      : `${url.replace(/\/+$/, "")}/api`;
  }
  return process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
    : "http://localhost:5000/api";
};

export const API_BASE = getFormattedApiUrl();

export function getApiBase(): string {
  return API_BASE;
}

export async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export interface ApiSubject {
  id: string;
  name: string;
  code: string;
  semester: number;
  college: string;
  description: string;
  color: string;
  icon: string;
  chapterCount: number;
}

export interface ApiChapterSummary {
  id: string;
  title: string;
  orderIndex: number;
}

export interface ApiSubjectDetail extends Omit<ApiSubject, "chapterCount"> {
  chapters: ApiChapterSummary[];
}

export interface ApiFlashcard {
  id: number;
  question: string;
  answer: string;
}

export interface ApiQuizItem {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ApiChapterDetail {
  id: string;
  subjectId: string;
  title: string;
  contentHtml: string;
  summary: string;
  flashcards: ApiFlashcard[];
  quiz: ApiQuizItem[];
}
