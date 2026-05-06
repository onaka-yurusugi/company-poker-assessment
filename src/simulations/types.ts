import type { DiagnosisResult, Hand, Player, PokerStyle } from "@/types";

export type SampleScenarioMeta = {
  readonly id: string;
  readonly playerName: string;
  readonly persona: string;
  readonly summary: string;
  readonly expectedStyle: PokerStyle;
};

export type SampleResult = {
  readonly scenario: SampleScenarioMeta;
  readonly diagnosis: DiagnosisResult;
  readonly hands: readonly Hand[];
  readonly players: readonly Player[];
};
