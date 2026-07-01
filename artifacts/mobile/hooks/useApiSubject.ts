import { useEffect, useState } from "react";
import { apiFetch, type ApiSubjectDetail } from "@/utils/api";
import { getSubjectById } from "@/data/content";

export function useApiSubject(id: string | undefined) {
  const [subject, setSubject] = useState<ApiSubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<ApiSubjectDetail>(`/subjects/${id}`)
      .then((data) => {
        if (!cancelled && data.chapters.length > 0) setSubject(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const hardcoded = id ? getSubjectById(id) : undefined;

  const fallback: ApiSubjectDetail | null = hardcoded
    ? {
        id: hardcoded.id,
        name: hardcoded.name,
        code: hardcoded.code,
        semester: hardcoded.semester,
        college: hardcoded.college,
        description: hardcoded.description,
        color: hardcoded.color,
        icon: hardcoded.icon,
        chapters: hardcoded.chapters.map((c, i) => ({
          id: c.id,
          title: c.title,
          orderIndex: i,
        })),
      }
    : null;

  return { subject: subject ?? fallback, loading };
}
