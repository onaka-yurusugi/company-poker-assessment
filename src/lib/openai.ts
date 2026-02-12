import OpenAI from "openai";
import type { DiagnosisAxis } from "@/types";

type DiagnosisResponse = {
  readonly axes: readonly DiagnosisAxis[];
  readonly advice: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
};

const getClient = (): OpenAI => new OpenAI();

export const generateDiagnosis = async (
  systemPrompt: string,
  userPrompt: string
): Promise<DiagnosisResponse> => {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: "gpt-5.2",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = JSON.parse(content) as DiagnosisResponse;
  return parsed;
};
