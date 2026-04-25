import { supabase } from "./supabase";

async function postGeminiAction<T>(payload: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error || "AI 请求失败，请稍后重试");
  }

  return body as T;
}

export async function generateSkillsAndExercises(
  workTitle: string,
  workContent: string,
  analysisText: string,
  isExtra: boolean = false,
) {
  return postGeminiAction<any>({
    action: "generateSkills",
    workTitle,
    workContent,
    analysisText,
    isExtra,
  });
}

export async function getStudentFeedback(
  studentContent: string,
  exerciseExcerpt: string,
  rubric: string,
) {
  const result = await postGeminiAction<{ feedback: string }>({
    action: "feedback",
    studentContent,
    exerciseExcerpt,
    rubric,
  });

  return result.feedback;
}
