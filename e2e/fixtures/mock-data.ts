// E2Eテスト用のモックデータファクトリ
// src/types/ のパスエイリアス (@/*) が e2e/ から使えないため型をインラインで定義

type Suit = "spade" | "heart" | "diamond" | "club";
type Rank =
  | "A" | "2" | "3" | "4" | "5" | "6" | "7"
  | "8" | "9" | "10" | "J" | "Q" | "K";
type Card = { readonly suit: Suit; readonly rank: Rank };
type ActionType = "fold" | "check" | "call" | "raise";
type Street = "preflop" | "flop" | "turn" | "river";
type PokerStyle =
  | "loose-aggressive" | "tight-aggressive"
  | "loose-passive" | "tight-passive";

type Player = {
  readonly id: string;
  readonly name: string;
  readonly seatNumber: number;
  readonly joinedAt: string;
};

type Action = {
  readonly playerId: string;
  readonly type: ActionType;
  readonly amount: number | null;
  readonly street: Street;
  readonly order: number;
};

type PlayerHand = {
  readonly playerId: string;
  readonly holeCards: readonly [Card, Card] | null;
};

type Hand = {
  readonly id: string;
  readonly handNumber: number;
  readonly communityCards: readonly Card[];
  readonly playerHands: readonly PlayerHand[];
  readonly actions: readonly Action[];
  readonly pot: number;
  readonly currentStreet: Street;
  readonly isComplete: boolean;
};

type DiagnosisAxis = {
  readonly key: string;
  readonly label: string;
  readonly score: number;
  readonly description: string;
};

type PokerStats = {
  readonly vpip: number;
  readonly pfr: number;
  readonly aggressionFactor: number;
  readonly foldPercentage: number;
  readonly cbetPercentage: number;
  readonly showdownPercentage: number;
  readonly totalHands: number;
};

type DiagnosisResult = {
  readonly playerId: string;
  readonly playerName: string;
  readonly pokerStyle: PokerStyle;
  readonly businessType: string;
  readonly businessTypeDescription: string;
  readonly axes: readonly DiagnosisAxis[];
  readonly stats: PokerStats;
  readonly advice: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly createdAt: string;
};

type SessionStatus = "waiting" | "playing" | "diagnosing" | "completed";

type Session = {
  readonly id: string;
  readonly code: string;
  readonly players: readonly Player[];
  readonly hands: readonly Hand[];
  readonly status: SessionStatus;
  readonly diagnosisResults: Readonly<Record<string, DiagnosisResult>>;
  readonly createdAt: string;
};

// Re-export types for use in other e2e files
export type {
  Suit, Rank, Card, ActionType, Street, PokerStyle,
  Player, Action, PlayerHand, Hand,
  DiagnosisAxis, PokerStats, DiagnosisResult,
  SessionStatus, Session,
};

// --- Factory functions ---

let counter = 0;
const nextId = () => `test-id-${++counter}`;

export function resetCounter(): void {
  counter = 0;
}

export function createMockPlayer(overrides?: Partial<Player>): Player {
  const id = nextId();
  return {
    id,
    name: `テストプレイヤー${counter}`,
    seatNumber: counter,
    joinedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    id: nextId(),
    code: "ABCDEF",
    players: [],
    hands: [],
    status: "waiting",
    diagnosisResults: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockHand(overrides?: Partial<Hand>): Hand {
  return {
    id: nextId(),
    handNumber: 1,
    communityCards: [],
    playerHands: [],
    actions: [],
    pot: 0,
    currentStreet: "preflop",
    isComplete: false,
    ...overrides,
  };
}

export function createMockDiagnosisResult(
  playerId: string,
  playerName: string,
  overrides?: Partial<DiagnosisResult>,
): DiagnosisResult {
  return {
    playerId,
    playerName,
    pokerStyle: "tight-aggressive",
    businessType: "戦略的リーダータイプ",
    businessTypeDescription:
      "慎重な分析に基づいて的確な判断を下し、ここぞという場面で力強くリードする。",
    axes: [
      { key: "riskTolerance", label: "リスク許容度", score: 65, description: "適度なリスクテイク" },
      { key: "decisionSpeed", label: "意思決定スピード", score: 70, description: "素早い判断力" },
      { key: "analyticalThinking", label: "分析的思考力", score: 80, description: "高い分析力" },
      { key: "adaptability", label: "適応力・柔軟性", score: 60, description: "柔軟に対応" },
      { key: "stressManagement", label: "プレッシャー耐性", score: 75, description: "プレッシャーに強い" },
      { key: "resourceManagement", label: "リソース管理力", score: 72, description: "効率的な管理" },
    ],
    stats: {
      vpip: 35.0,
      pfr: 20.0,
      aggressionFactor: 2.5,
      foldPercentage: 40.0,
      cbetPercentage: 60.0,
      showdownPercentage: 50.0,
      totalHands: 5,
    },
    advice: "分析力を活かしつつ、より大胆な挑戦も心がけましょう。",
    strengths: ["冷静な判断力", "リスク管理能力", "データに基づく意思決定"],
    weaknesses: ["慎重すぎる場面がある", "新しい挑戦への躊躇"],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** 2人プレイヤーの初期セッション（hands空） */
export function createTwoPlayerSession(): {
  session: Session;
  player1: Player;
  player2: Player;
} {
  resetCounter();
  const player1 = createMockPlayer({ id: "p1", name: "Alice", seatNumber: 1 });
  const player2 = createMockPlayer({ id: "p2", name: "Bob", seatNumber: 2 });
  const session = createMockSession({
    id: "test-session",
    players: [player1, player2],
    status: "waiting",
  });
  return { session, player1, player2 };
}

/** 2人プレイヤーのセッション（1ハンド完了済み） */
export function createCompletedHandSession(): {
  session: Session;
  player1: Player;
  player2: Player;
} {
  resetCounter();
  const player1 = createMockPlayer({ id: "p1", name: "Alice", seatNumber: 1 });
  const player2 = createMockPlayer({ id: "p2", name: "Bob", seatNumber: 2 });

  const hand = createMockHand({
    id: "h1",
    handNumber: 1,
    playerHands: [
      { playerId: "p1", holeCards: [{ suit: "spade", rank: "A" }, { suit: "heart", rank: "K" }] },
      { playerId: "p2", holeCards: [{ suit: "diamond", rank: "Q" }, { suit: "club", rank: "J" }] },
    ],
    communityCards: [
      { suit: "heart", rank: "10" },
      { suit: "diamond", rank: "9" },
      { suit: "club", rank: "8" },
      { suit: "spade", rank: "7" },
      { suit: "heart", rank: "6" },
    ],
    actions: [
      { playerId: "p1", type: "raise", amount: 100, street: "preflop", order: 0 },
      { playerId: "p2", type: "call", amount: null, street: "preflop", order: 1 },
      { playerId: "p1", type: "check", amount: null, street: "flop", order: 2 },
      { playerId: "p2", type: "raise", amount: 200, street: "flop", order: 3 },
      { playerId: "p1", type: "call", amount: null, street: "flop", order: 4 },
      { playerId: "p1", type: "check", amount: null, street: "turn", order: 5 },
      { playerId: "p2", type: "check", amount: null, street: "turn", order: 6 },
      { playerId: "p1", type: "check", amount: null, street: "river", order: 7 },
      { playerId: "p2", type: "check", amount: null, street: "river", order: 8 },
    ],
    currentStreet: "river",
    isComplete: true,
  });

  const session = createMockSession({
    id: "test-session",
    players: [player1, player2],
    hands: [hand],
    status: "playing",
  });

  return { session, player1, player2 };
}

/** 診断結果付きの完了セッション */
export function createCompletedSessionWithDiagnosis(): {
  session: Session;
  player1: Player;
  player2: Player;
} {
  const { session, player1, player2 } = createCompletedHandSession();
  const diagnosisResults: Record<string, DiagnosisResult> = {
    [player1.id]: createMockDiagnosisResult(player1.id, player1.name),
    [player2.id]: createMockDiagnosisResult(player2.id, player2.name, {
      pokerStyle: "loose-passive",
      businessType: "協調的サポータータイプ",
      businessTypeDescription: "周囲との協調を大切にし、チームの調和を保ちながらサポートする。",
    }),
  };
  return {
    session: { ...session, status: "completed", diagnosisResults },
    player1,
    player2,
  };
}
