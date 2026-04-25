import { Category, Exercise, Skill, Work, WorkType } from "../types";

export interface WorkRow {
  id: string;
  title: string;
  author: string;
  content: string;
  analysis_text: string;
  type: WorkType;
  created_at: string | null;
}

export interface SkillRow {
  id: string;
  work_id: string;
  category: Category;
  name: string;
  rubric: string;
  created_at: string | null;
}

export interface ExerciseRow {
  id: string;
  work_id: string;
  skill_id: string;
  excerpt: string;
  reference_analysis: string;
  created_at: string | null;
}

export function mapWork(row: WorkRow): Work {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    content: row.content,
    analysisText: row.analysis_text,
    type: row.type,
    createdAt: row.created_at,
  };
}

export function mapSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    workId: row.work_id,
    category: row.category,
    name: row.name,
    rubric: row.rubric,
    createdAt: row.created_at,
  };
}

export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    workId: row.work_id,
    skillId: row.skill_id,
    excerpt: row.excerpt,
    referenceAnalysis: row.reference_analysis,
    createdAt: row.created_at,
  };
}
