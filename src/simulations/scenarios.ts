import type { Action, ActionType, Card, Hand, PokerStyle } from "@/types";
import { BUSINESS_TYPE_MAP } from "@/constants/diagnosis";

export const HERO_ID = "hero";
export const VILLAIN_ID = "villain";

const HERO_HOLE: readonly [Card, Card] = [
  { suit: "spade", rank: "A" },
  { suit: "heart", rank: "K" },
];

const BOARD_FULL: readonly Card[] = [
  { suit: "diamond", rank: "Q" },
  { suit: "club", rank: "J" },
  { suit: "heart", rank: "10" },
  { suit: "spade", rank: "9" },
  { suit: "diamond", rank: "8" },
];

type Street = "preflop" | "flop" | "turn" | "river";

type Move = { readonly action: ActionType; readonly amount: number | null };

export type HandSpec = {
  readonly preflop: Move;
  readonly flop?: Move;
  readonly turn?: Move;
  readonly river?: Move;
};

const DEFAULT_AMOUNTS: Readonly<Record<Street, number>> = {
  preflop: 6,
  flop: 12,
  turn: 25,
  river: 50,
};

const toMove = (action: ActionType, street: Street): Move => ({
  action,
  amount: action === "raise" ? DEFAULT_AMOUNTS[street] : null,
});

// 短縮ヘルパー: F("raise","raise","call","raise") のように1〜4要素で書ける
// 省略すると hero がそのストリートに到達していない（fold済 or showdown未達）扱い
export const F = (
  pf: ActionType,
  fl?: ActionType,
  tn?: ActionType,
  rv?: ActionType
): HandSpec => ({
  preflop: toMove(pf, "preflop"),
  ...(fl ? { flop: toMove(fl, "flop") } : {}),
  ...(tn ? { turn: toMove(tn, "turn") } : {}),
  ...(rv ? { river: toMove(rv, "river") } : {}),
});

const buildHand = (handNumber: number, spec: HandSpec): Hand => {
  const actions: Action[] = [];
  let order = 0;
  let lastStreet: Street = "preflop";

  const phases: ReadonlyArray<readonly [Street, Move | undefined]> = [
    ["preflop", spec.preflop],
    ["flop", spec.flop],
    ["turn", spec.turn],
    ["river", spec.river],
  ];

  for (const [street, move] of phases) {
    if (!move) break;
    lastStreet = street;
    actions.push({
      playerId: HERO_ID,
      type: move.action,
      amount: move.amount,
      street,
      order: order++,
    });
    if (move.action === "fold") break;
    // 対戦相手はヒーローのアクションに対応してコール（pot構築用、統計には影響しない）
    actions.push({
      playerId: VILLAIN_ID,
      type: "call",
      amount: move.amount,
      street,
      order: order++,
    });
  }

  const heroFolded = actions.some(
    (a) => a.playerId === HERO_ID && a.type === "fold"
  );

  const board =
    lastStreet === "river"
      ? BOARD_FULL
      : lastStreet === "turn"
        ? BOARD_FULL.slice(0, 4)
        : lastStreet === "flop"
          ? BOARD_FULL.slice(0, 3)
          : [];

  return {
    id: `hand-${handNumber}`,
    handNumber,
    buttonPlayerId: VILLAIN_ID,
    communityCards: board,
    playerHands: [
      { playerId: HERO_ID, holeCards: HERO_HOLE },
      { playerId: VILLAIN_ID, holeCards: null },
    ],
    actions,
    pot: 0,
    currentStreet: lastStreet,
    isComplete: heroFolded || lastStreet === "river",
  };
};

export type Scenario = {
  readonly id: string;
  readonly playerName: string;
  readonly persona: string;
  readonly summary: string;
  readonly expectedStyle: PokerStyle;
  readonly hands: readonly Hand[];
};

const makeScenario = (params: {
  readonly id: string;
  readonly playerName: string;
  readonly persona: string;
  readonly summary: string;
  readonly expectedStyle: PokerStyle;
  readonly handSpecs: readonly HandSpec[];
}): Scenario => ({
  id: params.id,
  playerName: params.playerName,
  persona: params.persona,
  summary: params.summary,
  expectedStyle: params.expectedStyle,
  hands: params.handSpecs.map((spec, i) => buildHand(i + 1, spec)),
});

export const expectedBusinessTypeOf = (style: PokerStyle): string =>
  BUSINESS_TYPE_MAP[style].name;

// =====================================================================
// 10 シナリオ定義
// 各シナリオは 12 ハンド構成で、想定スタイル判定が確実に決まるように
// 配分（PF raise/call/fold の比率と postflop の raise/call バランス）を調整
// =====================================================================

export const SCENARIOS: readonly Scenario[] = [
  // -------------------------------------------------------------------
  // ループアグレッシブ（革新的開拓者タイプ）×3
  // -------------------------------------------------------------------
  makeScenario({
    id: "lag-1",
    playerName: "鈴木 大輔",
    persona: "攻めの新規事業リーダー",
    summary:
      "ほぼ全てのハンドに参戦し、強気にレイズで主導権を握り続ける。撤退判断も速く、不利と見るや躊躇なく次へ向かう。",
    expectedStyle: "loose-aggressive",
    handSpecs: [
      F("raise", "raise", "raise", "raise"),
      F("raise", "raise", "call", "raise"),
      F("raise", "call", "call", "raise"),
      F("raise", "raise", "call", "call"),
      F("raise", "raise", "raise"),
      F("raise", "raise", "fold"),
      F("raise", "call", "raise", "call"),
      F("raise", "check", "check", "check"),
      F("call", "call", "check", "check"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  makeScenario({
    id: "lag-2",
    playerName: "高橋 美咲",
    persona: "直感型スタートアップ創業者",
    summary:
      "勘とスピード重視で参加判断を下し、ベットで相手にプレッシャーをかけ続ける。完璧な情報を待たず、自ら状況を作り出す。",
    expectedStyle: "loose-aggressive",
    handSpecs: [
      F("raise", "raise", "raise", "raise"),
      F("raise", "raise", "call", "raise"),
      F("raise", "raise", "raise"),
      F("raise", "raise", "fold"),
      F("raise", "call", "check", "raise"),
      F("raise", "raise", "check", "check"),
      F("call", "raise", "call", "fold"),
      F("call", "check", "check", "check"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  makeScenario({
    id: "lag-3",
    playerName: "佐々木 健",
    persona: "強気のセールス・ハンター",
    summary:
      "圧倒的な行動量で全ての商談に首を突っ込み、押しの一手で契約を取りに行く。負けが見えたハンドの撤退も鮮やかでロスを最小化。",
    expectedStyle: "loose-aggressive",
    handSpecs: [
      F("raise", "raise", "raise", "raise"),
      F("raise", "raise", "raise", "call"),
      F("raise", "raise", "raise", "raise"),
      F("raise", "raise", "call", "raise"),
      F("raise", "raise", "raise"),
      F("raise", "raise", "raise", "fold"),
      F("raise", "raise", "fold"),
      F("raise", "call", "raise", "call"),
      F("raise", "check", "check", "check"),
      F("call", "call", "check", "check"),
      F("fold"),
      F("fold"),
    ],
  }),

  // -------------------------------------------------------------------
  // タイトアグレッシブ（戦略的リーダータイプ）×3
  // -------------------------------------------------------------------
  makeScenario({
    id: "tag-1",
    playerName: "中村 俊介",
    persona: "切れ味鋭い戦略コンサルタント",
    summary:
      "参加するハンドを厳選し、勝てる場面でだけ強くベットを打ち抜く。アクション時はほぼ常にレイズで、選択と集中を体現するスタイル。",
    expectedStyle: "tight-aggressive",
    handSpecs: [
      F("raise", "raise", "raise", "raise"),
      F("raise", "raise", "raise", "call"),
      F("raise", "raise", "raise", "raise"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  makeScenario({
    id: "tag-2",
    playerName: "渡辺 真理子",
    persona: "投資判断のプロジェクト責任者",
    summary:
      "見送りの決断ができる慎重さと、ここぞという場面で大胆に資源を投下する判断力を併せ持つ。レンジは狭いが各ハンドへのコミットは深い。",
    expectedStyle: "tight-aggressive",
    handSpecs: [
      F("raise", "raise", "raise", "call"),
      F("raise", "raise", "call", "raise"),
      F("raise", "raise", "raise"),
      F("call", "call", "fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  makeScenario({
    id: "tag-3",
    playerName: "山田 哲也",
    persona: "厳選・集中型の財務責任者（CFO）",
    summary:
      "勝率の高いハンドだけに資本を投下し、参戦したら一気にレイズで攻める。極度に絞ったレンジで質の高いリターンを狙う典型的TAG。",
    expectedStyle: "tight-aggressive",
    handSpecs: [
      F("raise", "raise", "raise", "raise"),
      F("raise", "raise", "raise"),
      F("call", "raise", "raise", "raise"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  // -------------------------------------------------------------------
  // ルースパッシブ（協調的サポータータイプ）×2
  // -------------------------------------------------------------------
  makeScenario({
    id: "lp-1",
    playerName: "小林 由紀子",
    persona: "場を盛り上げるチームサポーター",
    summary:
      "ほとんどのハンドに付き合い、相手のベットには気持ちよくコールで応じる。場を壊さない柔らかい振る舞いで参加メンバーを和ませる。",
    expectedStyle: "loose-passive",
    handSpecs: [
      F("call", "call", "call", "call"),
      F("call", "call", "call", "check"),
      F("call", "call", "check", "call"),
      F("raise", "call", "call", "call"),
      F("call", "check", "call", "check"),
      F("call", "call", "fold"),
      F("call", "call", "check", "check"),
      F("call", "check", "check", "check"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  makeScenario({
    id: "lp-2",
    playerName: "森田 健介",
    persona: "共感型のチームリーダー",
    summary:
      "幅広い案件に関与しつつ、強引な主張は避けて相手のペースに合わせる。たまに自分から動くこともあるが、基本は調整役に徹する。",
    expectedStyle: "loose-passive",
    handSpecs: [
      F("raise", "call", "call", "call"),
      F("call", "call", "call", "check"),
      F("call", "call", "check", "call"),
      F("raise", "call", "check", "check"),
      F("call", "call", "fold"),
      F("call", "check", "call", "check"),
      F("call", "check", "check", "check"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  // -------------------------------------------------------------------
  // タイトパッシブ（堅実な管理者タイプ）×2
  // -------------------------------------------------------------------
  makeScenario({
    id: "tp-1",
    playerName: "伊藤 義隆",
    persona: "リスク回避型の財務管理者",
    summary:
      "参加ハンドを極限まで絞り、入った場合もコールやチェックで様子を見ながら堅実に運ぶ。一貫した規律で大きな損失を出さない。",
    expectedStyle: "tight-passive",
    handSpecs: [
      F("raise", "call", "call", "check"),
      F("call", "check", "call", "check"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),

  makeScenario({
    id: "tp-2",
    playerName: "藤田 由美",
    persona: "慎重派のオペレーション・マネージャー",
    summary:
      "参加判断は厳しめで、リスクの高いハンドは即撤退。入ったハンドでも控えめに動き、確実な状況以外で大きく賭けない安定志向。",
    expectedStyle: "tight-passive",
    handSpecs: [
      F("raise", "call", "check", "check"),
      F("call", "call", "check", "call"),
      F("raise", "check", "check", "check"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
      F("fold"),
    ],
  }),
];
