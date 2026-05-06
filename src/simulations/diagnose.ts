import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculatePokerStats } from "@/lib/poker-stats";
import { determinePokerStyle, getBusinessType } from "@/lib/diagnosis-mapper";
import { DIAGNOSIS_SYSTEM_PROMPT, buildDiagnosisUserPrompt } from "@/lib/prompt";
import { generateDiagnosis } from "@/lib/openai";
import type { DiagnosisResult, Player } from "@/types";
import { HERO_ID, SCENARIOS, VILLAIN_ID } from "./scenarios";
import type { SampleResult } from "./types";

const OUTPUT_PATH = resolve("src/simulations/results/data.json");

const buildPlayers = (heroName: string, createdAt: string): readonly Player[] => [
  {
    id: HERO_ID,
    name: heroName,
    seatNumber: 1,
    joinedAt: createdAt,
    isActive: true,
  },
  {
    id: VILLAIN_ID,
    name: "対戦相手",
    seatNumber: 2,
    joinedAt: createdAt,
    isActive: true,
  },
];

const main = async (): Promise<void> => {
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error("OPENAI_API_KEY が未設定です。.env.local を確認してください。");
  }

  const samples: SampleResult[] = [];

  for (const scenario of SCENARIOS) {
    const stats = calculatePokerStats(HERO_ID, scenario.hands);
    const pokerStyle = determinePokerStyle(stats);
    const businessType = getBusinessType(pokerStyle);

    console.log(
      `[${scenario.id}] ${scenario.playerName} (${pokerStyle}) — calling OpenAI...`
    );

    const userPrompt = buildDiagnosisUserPrompt(
      scenario.playerName,
      stats,
      pokerStyle,
      businessType.name
    );

    const ai = await generateDiagnosis(DIAGNOSIS_SYSTEM_PROMPT, userPrompt);

    const createdAt = new Date().toISOString();

    const diagnosis: DiagnosisResult = {
      playerId: HERO_ID,
      playerName: scenario.playerName,
      pokerStyle,
      businessType: businessType.name,
      businessTypeDescription: businessType.description,
      axes: ai.axes,
      stats,
      advice: ai.advice,
      strengths: ai.strengths,
      growthPotentials: ai.growthPotentials,
      createdAt,
    };

    samples.push({
      scenario: {
        id: scenario.id,
        playerName: scenario.playerName,
        persona: scenario.persona,
        summary: scenario.summary,
        expectedStyle: scenario.expectedStyle,
      },
      diagnosis,
      hands: scenario.hands,
      players: buildPlayers(scenario.playerName, createdAt),
    });

    console.log(`  → ${businessType.name} / advice ${ai.advice.length} 文字`);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(samples, null, 2) + "\n", "utf8");
  console.log(`\n✓ Wrote ${samples.length} sample results to ${OUTPUT_PATH}`);
};

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
