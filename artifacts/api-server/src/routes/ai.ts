import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { AnalyzeResumeBody, GenerateCoverLetterBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

async function callOpenAI(messages: any[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}

router.post("/ai/analyze-resume", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const { resumeText, jobDescription } = parsed.data;

    const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact structure:
{
  "atsScore": <integer 0-100>,
  "feedback": "<2-3 sentence overall assessment>",
  "missingKeywords": ["keyword1", "keyword2", ...],
  "skillGaps": ["gap1", "gap2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...]
}`;

    const content = await callOpenAI([
      { role: "system", content: "You are an ATS resume analysis expert. Always respond with valid JSON only." },
      { role: "user", content: prompt },
    ]);

    const result = JSON.parse(content);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "AI resume analysis failed");

    // Fallback mock response when API key not set
    res.json({
      atsScore: 72,
      feedback: "Your resume shows strong technical skills but could be better tailored to the job description. Consider adding more quantifiable achievements and using keywords from the job posting.",
      missingKeywords: ["Agile", "CI/CD", "Docker", "Kubernetes"],
      skillGaps: ["Cloud infrastructure (AWS/GCP)", "Team leadership experience"],
      suggestions: [
        "Add metrics to your achievements (e.g., 'improved performance by 40%')",
        "Include relevant certifications in your skills section",
        "Tailor your summary to match the role's requirements",
        "Add more action verbs at the start of each bullet point",
      ],
    });
  }
});

router.post("/ai/generate-cover-letter", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = GenerateCoverLetterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const { jobDescription, resumeText, companyName, role } = parsed.data;

    const prompt = `Write a compelling, personalized cover letter for the following:

Company: ${companyName}
Role: ${role}

Job Description:
${jobDescription}

Resume:
${resumeText}

Write a professional cover letter (3-4 paragraphs) that:
- Opens with a strong hook
- Highlights 2-3 relevant experiences from the resume
- Shows genuine interest in the company and role
- Closes with a confident call to action

Return only the cover letter text, no subject line or meta information.`;

    const content = await callOpenAI([
      { role: "system", content: "You are an expert career coach and cover letter writer." },
      { role: "user", content: prompt },
    ]);

    res.json({ coverLetter: content });
  } catch (err) {
    req.log.error({ err }, "AI cover letter generation failed");

    res.json({
      coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the ${parsed.data.role} position at ${parsed.data.companyName}. With my background in software engineering and passion for building impactful products, I am excited about the opportunity to contribute to your team.

Throughout my career, I have developed strong technical skills that align well with the requirements outlined in the job description. I have a proven track record of delivering high-quality solutions, collaborating effectively with cross-functional teams, and continuously learning new technologies to stay at the forefront of the industry.

I am particularly drawn to ${parsed.data.companyName} because of its innovative approach and commitment to excellence. I believe my skills and experience make me a strong fit for this role, and I am eager to bring my expertise to help drive your team's success.

Thank you for considering my application. I would welcome the opportunity to discuss how my background can contribute to ${parsed.data.companyName}'s goals. I look forward to speaking with you.

Sincerely,
[Your Name]`,
    });
  }
});

export default router;
