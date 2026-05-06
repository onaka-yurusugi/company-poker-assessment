import { calculatePokerStats } from "@/lib/poker-stats";
import { determinePokerStyle, getBusinessType } from "@/lib/diagnosis-mapper";
import { VPIP_THRESHOLD, AF_THRESHOLD } from "@/constants/diagnosis";
import type { Action, Hand, PokerStats, PokerStyle } from "@/types";
import { HERO_ID, SCENARIOS, type Scenario } from "./scenarios";

const STYLE_LABEL: Readonly<Record<PokerStyle, string>> = {
  "loose-aggressive": "Loose-Aggressive (LAG)",
  "tight-aggressive": "Tight-Aggressive (TAG)",
  "loose-passive": "Loose-Passive (LP)",
  "tight-passive": "Tight-Passive (TP)",
};

const ACTION_GLYPH: Readonly<Record<string, string>> = {
  fold: "F",
  check: "X",
  call: "C",
  raise: "R",
};

const formatStreets = (hand: Hand): string => {
  const heroActions = hand.actions.filter((a) => a.playerId === HERO_ID);
  const byStreet: Record<string, Action[]> = {
    preflop: [],
    flop: [],
    turn: [],
    river: [],
  };
  for (const a of heroActions) {
    byStreet[a.street]?.push(a);
  }
  const segments: string[] = [];
  for (const street of ["preflop", "flop", "turn", "river"] as const) {
    const acts = byStreet[street] ?? [];
    if (acts.length === 0) continue;
    const tokens = acts.map((a) => {
      const glyph = ACTION_GLYPH[a.type] ?? "?";
      return a.amount !== null ? `${glyph}${a.amount}` : glyph;
    });
    segments.push(`${street.toUpperCase().slice(0, 2)}:${tokens.join(",")}`);
  }
  return segments.join(" → ");
};

const formatStats = (stats: PokerStats): string =>
  [
    `VPIP=${stats.vpip.toFixed(1)}%`,
    `PFR=${stats.pfr.toFixed(1)}%`,
    `AF=${stats.aggressionFactor.toFixed(2)}`,
    `Fold=${stats.foldPercentage.toFixed(1)}%`,
    `CBet=${stats.cbetPercentage.toFixed(1)}%`,
    `SD=${stats.showdownPercentage.toFixed(1)}%`,
    `Hands=${stats.totalHands}`,
  ].join("  ");

const renderScenario = (scenario: Scenario, index: number): string => {
  const stats = calculatePokerStats(HERO_ID, scenario.hands);
  const style = determinePokerStyle(stats);
  const businessType = getBusinessType(style);
  const matched = style === scenario.expectedStyle ? "OK" : "MISMATCH";

  const lines: string[] = [];
  lines.push("");
  lines.push("=".repeat(78));
  lines.push(`シナリオ ${index + 1}/${SCENARIOS.length}: ${scenario.persona}`);
  lines.push("=".repeat(78));
  lines.push(`プレイヤー名     : ${scenario.playerName}`);
  lines.push(`プロフィール    : ${scenario.summary}`);
  lines.push("");
  lines.push("【プレイ履歴 (12ハンド) — R=Raise / C=Call / X=Check / F=Fold】");
  for (const hand of scenario.hands) {
    lines.push(`  Hand ${String(hand.handNumber).padStart(2, " ")}: ${formatStreets(hand)}`);
  }
  lines.push("");
  lines.push("【統計】");
  lines.push(`  ${formatStats(stats)}`);
  lines.push(
    `  判定基準: VPIP閾値=${VPIP_THRESHOLD}% / AF閾値=${AF_THRESHOLD.toFixed(1)}`
  );
  lines.push("");
  lines.push("【診断結果】");
  lines.push(`  ポーカースタイル : ${STYLE_LABEL[style]}`);
  lines.push(`  ビジネスタイプ   : ${businessType.name}`);
  lines.push(`  説明             : ${businessType.description}`);
  lines.push(
    `  期待スタイル一致 : ${matched} (期待=${STYLE_LABEL[scenario.expectedStyle]})`
  );
  return lines.join("\n");
};

const main = (): void => {
  console.log("\n");
  console.log("####################################################");
  console.log("# ポーカー診断シミュレーション (10 サンプルパターン)  #");
  console.log("####################################################");
  console.log(
    `\n判定軸: VPIP >= ${VPIP_THRESHOLD}% で Loose / AF >= ${AF_THRESHOLD.toFixed(1)} で Aggressive\n`
  );

  let mismatchCount = 0;
  for (const [i, scenario] of SCENARIOS.entries()) {
    console.log(renderScenario(scenario, i));
    const stats = calculatePokerStats(HERO_ID, scenario.hands);
    if (determinePokerStyle(stats) !== scenario.expectedStyle) {
      mismatchCount++;
    }
  }

  console.log("\n");
  console.log("=".repeat(78));
  console.log("サマリー");
  console.log("=".repeat(78));
  console.log(`総シナリオ数        : ${SCENARIOS.length}`);
  console.log(`期待スタイル一致数  : ${SCENARIOS.length - mismatchCount}`);
  console.log(`想定外スタイル発生  : ${mismatchCount}`);
  console.log("");

  if (mismatchCount > 0) {
    process.exitCode = 1;
  }
};

main();
