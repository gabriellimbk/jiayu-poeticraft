import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function getHeader(headers: VercelRequest["headers"], name: string) {
  const value = headers[name] || headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function parseBody(body: unknown) {
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  return body || {};
}

function isRiTeacherEmail(email: string | null | undefined) {
  return Boolean(email?.trim().toLowerCase().endsWith("@ri.edu.sg"));
}

async function assertTeacher(request: VercelRequest) {
  const authHeader = getHeader(request.headers, "authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return false;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return false;
  }

  return isRiTeacherEmail(data.user.email);
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
}

async function generateSkillsAndExercises(
  workTitle: string,
  workContent: string,
  analysisText: string,
  isExtra: boolean,
) {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      基于以下关于诗歌《${workTitle}》的原文及相关分析内容，请提取并生成习题库内容。

      诗歌原文：
      ${workContent}

      ${isExtra ? "分析题目及参考答案（包含两个大题）：" : "文学分析讲义："}
      ${analysisText}

      要求：
      ${isExtra ? `
      1. **课外作品特殊逻辑**：
         - 教师提供了两个综合分析大题及答案。
         - **分解与归类逻辑**：分析大题中的要点，将其归类为若干个**独特的“鉴赏维度”**（通常 3-5 个维度）。
         - **一对多关系**：如果一个大题方向（如“修辞手法”）涉及多个例句，**不要**生成多个同名的微型题。应生成**一个**维度的题目，并在该项目下提供多个相关的例句（exercises）。
         - **分类字段 (category)** 请统一填写为“综合鉴赏”。
         - **名称 (name) 极其重要（深度引导，拒绝泄密）**：
            - 请使用中性、引导性的题目名称。
            - **严禁**在名称中提到具体的艺术手法、情感结论。
            - 如果一个维度涉及多种手法，名称应概括为“分析相关诗句的修辞手法及其作用”，而不要拆分为“赏析比喻”、“赏析排比”。
            - 正确示例：“分析相关诗句的修辞手法及作用”、“分析‘月’这一意象在诗中的含意”、“分析这几联在全诗结构中的作用”。
      ` : `
      1. **课内作品生成逻辑**：
         - 将习题分为两个大项：“思想内容”和“艺术特色”。
         - **全量提取原则**：必须**穷尽式地**提取讲义中提到的每一个知识点或分析角度，将其转化为独立的“微技能”。
         - **严禁过度合并**：不要为了节省篇幅而将多个不同的手法或情感合并为一个微技能。每一个在讲义中有独立论述的要点都应拥有自己的“微技能”条目。
         - **忠实于原文**：生成的微技能名称和评分标准必须严格对应讲义中的原始论述，确保教学重难点无遗漏。
      `}

      2. 为每个微型练习/微技能提供：
         - **微技能/练习名称 (name)**
         - **微技能下可包含 1-3 个练习项**（exercises -> excerpt + referenceAnalysis）。
         - **相关例句 (excerpt)**：
            - **严禁包含任何分析或翻译文字。**
            - **必须保持诗歌原有的分行格式，严禁合并成一段。**
            - 必须是诗歌正文中的原句。
            - 如果涉及全篇分析 (如：结构、主题)，excerpt 必须提供整首诗的内容（保留所有分行）。
            - 否则，提取一到两句/联诗句（保留原有分行）。
         - 为每个例句提供：
            - 相关例句 (excerpt)
            - 参考分析 (referenceAnalysis)：基于提供的分析内容，给出该项的参考答案。
         - **详细评分标准 (rubric)**：列出学生回答此维度内任何小题时应包含的核心得分要点。
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                name: { type: Type.STRING },
                rubric: { type: Type.STRING },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      excerpt: { type: Type.STRING },
                      referenceAnalysis: { type: Type.STRING },
                    },
                  },
                },
              },
              required: ["category", "name", "rubric", "exercises"],
            },
          },
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI 未返回任何内容");

  const jsonMatch = text.match(/```json\s?([\s\S]+?)\s?```/) || [null, text];
  const cleanedJson = (jsonMatch[1] || text).trim();

  try {
    return JSON.parse(cleanedJson);
  } catch {
    console.error("AI 返回的 JSON 格式不正确:", text);
    throw new Error("AI 返回数据格式错误，请稍后重试");
  }
}

async function getStudentFeedback(
  studentContent: string,
  exerciseExcerpt: string,
  rubric: string,
) {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
      你是一位经验丰富、温和且专业的语文老师。请针对学生的文学分析段落进行点评。
      你的语气应当像是在课堂上或批改作文时面对面教导学生：多一些启发和点拨，少一些冷冰冰的判定。

      作品例句：${exerciseExcerpt}
      评分标准/写作要点：${rubric}
      学生写作内容：${studentContent}

      评价要求：
      1. **分点点评**：按照评分标准中的核心要点，分模块（使用 Markdown 三级标题，如 ### 关键词解析）进行反馈。
      2. **核心判定**：在每个模块标题下的第一行，必须先给出一句简短的总评价，格式为：**论述清楚/论述不清楚/论述不足/要点缺失**（不要包含“该要点”字样）。
      3. **老师语气与直接建议**：点评应以高中老师的视角，语气亲切但指出建议时要直接干脆。多用“建议你……”、“可以尝试使用……”等引导词。
      4. **肯定亮点与精准改进**：肯定学生抓住了哪些关键点，并针对不足之处直接给出逻辑推导建议，**推荐专业且地道的词法或句式**（如：建议使用“反衬”、“渲染了……的气氛”、“以……托出……”等）。
      5. **字数控制**：每部分反馈内容控制在 60-80 字左右，言简意赅，直击问题核心，避免冗长。
      6. 禁止提供完整的参考范文。

      输出格式：Markdown 格式，标题清晰，内容既有文学深度又充满教育关怀。
    `,
  });

  return response.text;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = parseBody(request.body) as Record<string, any>;

    if (body.action === "generateSkills") {
      const isTeacher = await assertTeacher(request);
      if (!isTeacher) {
        response.status(403).json({ error: "Teacher OTP session required." });
        return;
      }

      const result = await generateSkillsAndExercises(
        String(body.workTitle || ""),
        String(body.workContent || ""),
        String(body.analysisText || ""),
        Boolean(body.isExtra),
      );
      response.status(200).json(result);
      return;
    }

    if (body.action === "feedback") {
      const studentContent = String(body.studentContent || "");
      const exerciseExcerpt = String(body.exerciseExcerpt || "");
      const rubric = String(body.rubric || "");

      if (!studentContent.trim() || studentContent.length > 5000) {
        response.status(400).json({ error: "Invalid student content." });
        return;
      }

      const feedback = await getStudentFeedback(studentContent, exerciseExcerpt, rubric);
      response.status(200).json({ feedback });
      return;
    }

    response.status(400).json({ error: "Unknown AI action." });
  } catch (error: any) {
    console.error(error);
    response.status(500).json({ error: error?.message || "AI request failed." });
  }
}
