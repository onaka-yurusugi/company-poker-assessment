import { nanoid } from "nanoid";
import type {
  Session,
  SessionStatus,
  Hand,
  ActionType,
  Card,
  Street,
  DiagnosisResult,
  PersistedGamePhase,
  GameState,
} from "@/types";
import { generateSessionCode } from "./session-code";
import { getDb } from "./firebase";

const COLLECTION = "sessions";

const sessionsCollection = () => getDb().collection(COLLECTION);
const sessionDoc = (sessionId: string) => sessionsCollection().doc(sessionId);

const toSession = (data: FirebaseFirestore.DocumentData): Session => data as Session;

// --- 内部ヘルパー ---

const mergeGamePhase = (
  currentState: GameState | null,
  gamePhase?: PersistedGamePhase,
  overrides?: { totalHands?: number; currentHandId?: string | null }
): GameState | null => {
  if (!gamePhase && !overrides) return currentState;

  const base: GameState = currentState ?? {
    gamePhase: { step: "hand-start" },
    totalHands: 10,
    currentHandId: null,
  };

  return {
    gamePhase: gamePhase ?? base.gamePhase,
    totalHands: overrides?.totalHands ?? base.totalHands,
    currentHandId: overrides?.currentHandId !== undefined
      ? overrides.currentHandId
      : base.currentHandId,
  };
};

const serializeForFirestore = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

// --- 公開関数 ---

export const createSession = async (): Promise<Session> => {
  const id = nanoid();
  const code = generateSessionCode();
  const session: Session = {
    id,
    code,
    players: [],
    hands: [],
    status: "waiting",
    diagnosisResults: {},
    createdAt: new Date().toISOString(),
    gameState: null,
  };
  await sessionDoc(id).set(serializeForFirestore(session));
  return session;
};

export const getSession = async (sessionId: string): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;
  return toSession(doc.data()!);
};

export const getSessionByCode = async (code: string): Promise<Session | undefined> => {
  const snapshot = await sessionsCollection()
    .where("code", "==", code)
    .limit(1)
    .get();
  if (snapshot.empty) return undefined;
  return toSession(snapshot.docs[0]!.data());
};

export const addPlayer = async (
  sessionId: string,
  name: string,
  seatNumber: number
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const newPlayer = {
    id: nanoid(),
    name,
    seatNumber,
    joinedAt: new Date().toISOString(),
  };
  const updatedPlayers = [...session.players, newPlayer];
  await sessionDoc(sessionId).update({ players: updatedPlayers });

  return { ...session, players: updatedPlayers };
};

export const createHand = async (
  sessionId: string,
  playerIds: readonly string[],
  gamePhase?: PersistedGamePhase,
  totalHands?: number
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const handNumber = session.hands.length + 1;
  const playerHands = playerIds.map((playerId) => ({
    playerId,
    holeCards: null,
  }));

  const hand = {
    id: nanoid(),
    handNumber,
    communityCards: [],
    playerHands,
    actions: [],
    pot: 0,
    currentStreet: "preflop" as const,
    isComplete: false,
  };

  const updatedHands = [...session.hands, hand];
  const updatedGameState = mergeGamePhase(
    session.gameState,
    gamePhase,
    { currentHandId: hand.id, totalHands }
  );

  const updateData: Record<string, unknown> = {
    hands: updatedHands,
    status: "playing",
  };
  if (updatedGameState) {
    updateData.gameState = serializeForFirestore(updatedGameState);
  }
  await sessionDoc(sessionId).update(updateData);

  return { ...session, hands: updatedHands, status: "playing", gameState: updatedGameState };
};

export const getHand = async (
  sessionId: string,
  handId: string
): Promise<Hand | undefined> => {
  const session = await getSession(sessionId);
  if (!session) return undefined;
  return session.hands.find((h) => h.id === handId);
};

export const updateHand = async (
  sessionId: string,
  handId: string,
  updates: {
    communityCards?: readonly Card[];
    currentStreet?: Street;
    isComplete?: boolean;
    pot?: number;
  },
  gamePhase?: PersistedGamePhase
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const handIndex = session.hands.findIndex((h) => h.id === handId);
  if (handIndex === -1) return undefined;

  const hand = session.hands[handIndex]!;
  const updatedHand = {
    ...hand,
    ...(updates.communityCards !== undefined && { communityCards: [...updates.communityCards] }),
    ...(updates.currentStreet !== undefined && { currentStreet: updates.currentStreet }),
    ...(updates.isComplete !== undefined && { isComplete: updates.isComplete }),
    ...(updates.pot !== undefined && { pot: updates.pot }),
  };

  const updatedHands = session.hands.map((h, i) =>
    i === handIndex ? updatedHand : h
  );

  // isComplete時はcurrentHandIdをクリア
  const updatedGameState = mergeGamePhase(
    session.gameState,
    gamePhase,
    updates.isComplete ? { currentHandId: null } : undefined
  );

  const updateData: Record<string, unknown> = {
    hands: serializeForFirestore(updatedHands),
  };
  if (updatedGameState && updatedGameState !== session.gameState) {
    updateData.gameState = serializeForFirestore(updatedGameState);
  }
  await sessionDoc(sessionId).update(updateData);

  return { ...session, hands: updatedHands, gameState: updatedGameState };
};

export const addAction = async (
  sessionId: string,
  handId: string,
  action: { playerId: string; type: ActionType; amount: number | null },
  gamePhase?: PersistedGamePhase
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const handIndex = session.hands.findIndex((h) => h.id === handId);
  if (handIndex === -1) return undefined;

  const hand = session.hands[handIndex]!;
  const order = hand.actions.length;
  const newAction = {
    playerId: action.playerId,
    type: action.type,
    amount: action.amount,
    street: hand.currentStreet,
    order,
  };

  const updatedActions = [...hand.actions, newAction];
  const updatedHands = session.hands.map((h, i) =>
    i === handIndex ? { ...h, actions: updatedActions } : h
  );

  const updatedGameState = mergeGamePhase(session.gameState, gamePhase);

  const updateData: Record<string, unknown> = {
    hands: serializeForFirestore(updatedHands),
  };
  if (updatedGameState && updatedGameState !== session.gameState) {
    updateData.gameState = serializeForFirestore(updatedGameState);
  }
  await sessionDoc(sessionId).update(updateData);

  return { ...session, hands: updatedHands, gameState: updatedGameState };
};

export const setHoleCards = async (
  sessionId: string,
  handId: string,
  playerId: string,
  holeCards: readonly [Card, Card],
  gamePhase?: PersistedGamePhase
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const handIndex = session.hands.findIndex((h) => h.id === handId);
  if (handIndex === -1) return undefined;

  const hand = session.hands[handIndex]!;
  const playerHandIndex = hand.playerHands.findIndex((ph) => ph.playerId === playerId);
  if (playerHandIndex === -1) return undefined;

  const updatedPlayerHands = hand.playerHands.map((ph, i) =>
    i === playerHandIndex ? { ...ph, holeCards: [holeCards[0], holeCards[1]] as const } : ph
  );
  const updatedHands = session.hands.map((h, i) =>
    i === handIndex ? { ...h, playerHands: updatedPlayerHands } : h
  );

  const updatedGameState = mergeGamePhase(session.gameState, gamePhase);

  const updateData: Record<string, unknown> = {
    hands: serializeForFirestore(updatedHands),
  };
  if (updatedGameState && updatedGameState !== session.gameState) {
    updateData.gameState = serializeForFirestore(updatedGameState);
  }
  await sessionDoc(sessionId).update(updateData);

  return { ...session, hands: updatedHands, gameState: updatedGameState };
};

export const setSessionStatus = async (
  sessionId: string,
  status: SessionStatus,
  gamePhase?: PersistedGamePhase
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const updatedGameState = mergeGamePhase(session.gameState, gamePhase);

  const updateData: Record<string, unknown> = { status };
  if (updatedGameState && updatedGameState !== session.gameState) {
    updateData.gameState = serializeForFirestore(updatedGameState);
  }
  await sessionDoc(sessionId).update(updateData);

  return { ...session, status, gameState: updatedGameState };
};

export const listSessions = async (): Promise<readonly Session[]> => {
  const snapshot = await sessionsCollection()
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => toSession(doc.data()));
};

export const setDiagnosisResults = async (
  sessionId: string,
  results: Readonly<Record<string, DiagnosisResult>>
): Promise<Session | undefined> => {
  const doc = await sessionDoc(sessionId).get();
  if (!doc.exists) return undefined;

  const session = toSession(doc.data()!);
  const updatedGameState = mergeGamePhase(session.gameState, { step: "complete" });

  const updateData: Record<string, unknown> = {
    diagnosisResults: serializeForFirestore(results),
    status: "completed",
  };
  if (updatedGameState) {
    updateData.gameState = serializeForFirestore(updatedGameState);
  }
  await sessionDoc(sessionId).update(updateData);

  return {
    ...session,
    diagnosisResults: { ...results },
    status: "completed",
    gameState: updatedGameState,
  };
};
