import { useEffect, useState } from "react";
import { apiFetch, type ApiChapterDetail } from "@/utils/api";
import { getChapterById } from "@/data/content";

export function useApiChapter(subjectId: string | undefined, chapterId: string | undefined) {
  const [chapter, setChapter] = useState<ApiChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) return;
    let cancelled = false;
    setLoading(true);
    apiFetch<ApiChapterDetail>(`/chapters/${chapterId}`)
      .then((data) => {
        if (!cancelled) setChapter(data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [chapterId]);

  const hardcoded = subjectId && chapterId ? getChapterById(subjectId, chapterId) : undefined;

  const fallback: ApiChapterDetail | null = hardcoded
    ? {
        id: hardcoded.id,
        subjectId: subjectId ?? "",
        title: hardcoded.title,
        contentHtml: "",
        summary: hardcoded.summary,
        flashcards: hardcoded.flashcards.map((f, i) => ({ id: i, question: f.question, answer: f.answer })),
        quiz: hardcoded.quiz.map((q, i) => ({
          id: i,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      }
    : null;

  return { chapter: chapter ?? fallback, loading, hasApiContent: !!chapter?.contentHtml };
}
