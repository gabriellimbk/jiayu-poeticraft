import { Category, Exercise, Skill, Work, WorkType } from "../types";

export const APP_TABLE = "CL_JIAYU_POETICRAFT";

export type AppRecordType = "work" | "skill" | "exercise" | "submission";

export interface AppRow {
  id: string | number;
  record_type: AppRecordType;
  created_at: string | null;
  work_id: string | number | null;
  skill_id: string | number | null;
  exercise_id: string | number | null;
  title: string | null;
  author: string | null;
  content: string | null;
  analysis_text: string | null;
  work_type: WorkType | null;
  category: Category | null;
  name: string | null;
  rubric: string | null;
  excerpt: string | null;
  reference_analysis: string | null;
  student_id: string | null;
  student_name: string | null;
  student_content: string | null;
  feedback: string | null;
}

export type WorkRow = AppRow;
export type SkillRow = AppRow;
export type ExerciseRow = AppRow;

function rowId(id: string | number | null) {
  return id == null ? "" : String(id);
}

export function mapWork(row: WorkRow): Work {
  return {
    id: rowId(row.id),
    title: row.title || "",
    author: row.author || "",
    content: row.content || "",
    analysisText: row.analysis_text || "",
    type: row.work_type || "in-class",
    createdAt: row.created_at,
  };
}

export function mapSkill(row: SkillRow): Skill {
  return {
    id: rowId(row.id),
    workId: rowId(row.work_id),
    category: row.category || "思想内容",
    name: row.name || "",
    rubric: row.rubric || "",
    createdAt: row.created_at,
  };
}

export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: rowId(row.id),
    workId: rowId(row.work_id),
    skillId: rowId(row.skill_id),
    excerpt: row.excerpt || "",
    referenceAnalysis: row.reference_analysis || "",
    createdAt: row.created_at,
  };
}
