import { nanoid } from "nanoid";
import type {
  Session,
  SessionStatus,
  Player,
  Hand,
  ActionType,
  Card,
  Street,
  DiagnosisResult,
} from "@/types";
import { generateSessionCode } from "./session-code";

// --- 内部 mutable 型 ---
type MutablePlayerHand = {
  playerId: string;
  holeCards: [Card, Card] | null;
};

type MutableAction = {
  playerId: string;
  type: ActionType;
  amount: number | null;
  street: Street;
  order: number;
};

type MutableHand = {
  id: string;
  handNumber: number;
  communityCards: Card[];
  playerHands: MutablePlayerHand[];
  actions: MutableAction[];
  pot: number;
  currentStreet: Street;
  isComplete: boolean;
};

type MutableSession = {
  id: string;
  code: string;
  players: Player[];
  hands: MutableHand[];
  status: SessionStatus;
  diagnosisResults: Record<string, DiagnosisResult>;
  createdAt: string;
};

// --- ストア ---
const sessions = new Map<string, MutableSession>();

// mutable → readonly 変換（型アサーション不要、構造的にreadonly互換）
const toReadonlySession = (s: MutableSession): Session => s as Session;

// --- 公開関数 ---

export const createSession = (): Session => {
  const id = nanoid();
  const code = generateSessionCode();
  const session: MutableSession = {
    id,
    code,
    players: [],
    hands: [],
    status: "waiting",
    diagnosisResults: {},
    createdAt: new Date().toISOString(),
  };
  sessions.set(id, session);
  return toReadonlySession(session);
};

export const getSession = (sessionId: string): Session | undefined => {
  const session = sessions.get(sessionId);
  return session ? toReadonlySession(session) : undefined;
};

export const getSessionByCode = (code: string): Session | undefined => {
  for (const session of sessions.values()) {
    if (session.code === code) {
      return toReadonlySession(session);
    }
  }
  return undefined;
};

export const addPlayer = (sessionId: string, name: string, seatNumber: number): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const player: Player = {
    id: nanoid(),
    name,
    seatNumber,
    joinedAt: new Date().toISOString(),
  };
  session.players.push(player);
  return toReadonlySession(session);
};

export const createHand = (sessionId: string, playerIds: readonly string[]): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const handNumber = session.hands.length + 1;
  const playerHands: MutablePlayerHand[] = playerIds.map((playerId) => ({
    playerId,
    holeCards: null,
  }));

  const hand: MutableHand = {
    id: nanoid(),
    handNumber,
    communityCards: [],
    playerHands,
    actions: [],
    pot: 0,
    currentStreet: "preflop",
    isComplete: false,
  };
  session.hands.push(hand);
  session.status = "playing";
  return toReadonlySession(session);
};

export const getHand = (sessionId: string, handId: string): Hand | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  const hand = session.hands.find((h) => h.id === handId);
  return hand as Hand | undefined;
};

export const updateHand = (
  sessionId: string,
  handId: string,
  updates: {
    communityCards?: readonly Card[];
    currentStreet?: Street;
    isComplete?: boolean;
    pot?: number;
  }
): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const hand = session.hands.find((h) => h.id === handId);
  if (!hand) return undefined;

  if (updates.communityCards !== undefined) {
    hand.communityCards = [...updates.communityCards];
  }
  if (updates.currentStreet !== undefined) {
    hand.currentStreet = updates.currentStreet;
  }
  if (updates.isComplete !== undefined) {
    hand.isComplete = updates.isComplete;
  }
  if (updates.pot !== undefined) {
    hand.pot = updates.pot;
  }

  return toReadonlySession(session);
};

export const addAction = (
  sessionId: string,
  handId: string,
  action: { playerId: string; type: ActionType; amount: number | null }
): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const hand = session.hands.find((h) => h.id === handId);
  if (!hand) return undefined;

  const order = hand.actions.length;
  const newAction: MutableAction = {
    playerId: action.playerId,
    type: action.type,
    amount: action.amount,
    street: hand.currentStreet,
    order,
  };
  hand.actions.push(newAction);

  return toReadonlySession(session);
};

export const setHoleCards = (
  sessionId: string,
  handId: string,
  playerId: string,
  holeCards: readonly [Card, Card]
): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const hand = session.hands.find((h) => h.id === handId);
  if (!hand) return undefined;

  const playerHand = hand.playerHands.find((ph) => ph.playerId === playerId);
  if (!playerHand) return undefined;

  playerHand.holeCards = [...holeCards] as [Card, Card];
  return toReadonlySession(session);
};

export const setSessionStatus = (sessionId: string, status: SessionStatus): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.status = status;
  return toReadonlySession(session);
};

export const setDiagnosisResults = (
  sessionId: string,
  results: Readonly<Record<string, DiagnosisResult>>
): Session | undefined => {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.diagnosisResults = { ...results };
  session.status = "completed";
  return toReadonlySession(session);
};
