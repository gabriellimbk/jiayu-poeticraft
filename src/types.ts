export type Category = "思想内容" | "艺术特色" | "综合鉴赏";
export type WorkType = "in-class" | "extra-curricular";

export interface Work {
  id: string;
  title: string;
  author: string;
  content: string;
  analysisText: string;
  type: WorkType;
  createdAt: string | null;
}

export interface Skill {
  id: string;
  workId: string;
  category: Category;
  name: string;
  rubric: string;
  createdAt: string | null;
}

export interface Exercise {
  id: string;
  workId: string;
  skillId: string;
  excerpt: string;
  referenceAnalysis: string;
  createdAt: string | null;
}

export interface Submission {
  id: string;
  exerciseId: string;
  studentId: string;
  studentName: string;
  studentContent: string;
  feedback: string;
  createdAt: string | null;
}

export interface StudentIdentity {
  id: string;
  name: string;
}
