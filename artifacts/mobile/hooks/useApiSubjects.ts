import { useEffect, useState } from "react";
import { apiFetch, type ApiSubject } from "@/utils/api";
export type { ApiSubject };
import { getSubjectsByCollege } from "@/data/content";

export function useApiSubjects(college: string | null) {
  const [subjects, setSubjects] = useState<ApiSubject[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!college) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<ApiSubject[]>(`/subjects?college=${encodeURIComponent(college)}`)
      .then((data) => {
        if (!cancelled) {
          setSubjects(data.length > 0 ? data : null);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("offline");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [college]);

  const fallback = college ? getSubjectsByCollege(college as "CSE" | "EEE").map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    semester: s.semester,
    college: s.college,
    description: s.description,
    color: s.color,
    icon: s.icon,
    chapterCount: s.chapters.length,
  })) : [];

  return { subjects: subjects ?? fallback, loading, fromApi: !!subjects && !error };
}
