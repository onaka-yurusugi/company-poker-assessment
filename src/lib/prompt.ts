import type { PokerStats, PokerStyle } from "@/types";
import { DIAGNOSIS_AXES } from "@/constants/diagnosis";

export const DIAGNOSIS_SYSTEM_PROMPT = `あなたはポーカーのプレイスタイルからビジネスパーソンとしての特性を診断する専門家です。
プレイヤーのポーカー統計データとプレイスタイル分類に基づいて、ビジネスにおける特性を6軸で評価してください。

以下のJSON形式で回答してください:
{
  "axes": [
${DIAGNOSIS_AXES.map((axis) => `    {"key": "${axis.key}", "label": "${axis.label}", "score": <0-100の整数>, "description": "<このプレイヤーの${axis.label}に関する具体的な評価（50文字以内）>"}`).join(",\n")}
  ],
  "advice": "<このプレイヤーへのビジネスアドバイス（200文字以内）>",
  "strengths": ["<強み1>", "<強み2>", "<強み3>"],
  "weaknesses": ["<弱み1>", "<弱み2>", "<弱み3>"]
}

JSONのみを出力し、それ以外のテキストは含めないでください。`;

export const buildDiagnosisUserPrompt = (
  playerName: string,
  stats: PokerStats,
  pokerStyle: PokerStyle,
  businessType: string
): string => {
  return `プレイヤー名: ${playerName}
ポーカースタイル: ${pokerStyle}
ビジネスタイプ: ${businessType}

統計データ:
- VPIP (自発的参加率): ${stats.vpip.toFixed(1)}%
- PFR (プリフロップレイズ率): ${stats.pfr.toFixed(1)}%
- AF (アグレッション・ファクター): ${stats.aggressionFactor.toFixed(2)}
- フォールド率: ${stats.foldPercentage.toFixed(1)}%
- CBet率: ${stats.cbetPercentage.toFixed(1)}%
- ショーダウン率: ${stats.showdownPercentage.toFixed(1)}%
- 総ハンド数: ${stats.totalHands}

上記のデータに基づいて、このプレイヤーのビジネスパーソンとしての特性を診断してください。`;
};
