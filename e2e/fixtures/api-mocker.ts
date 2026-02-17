import type { Page, Route } from "@playwright/test";
import type { Session, Player, Card, ActionType, Street, DiagnosisResult } from "./mock-data";
import { createMockDiagnosisResult } from "./mock-data";

// Mutable versions for internal state tracking
type MutablePlayerHand = {
  playerId: string;
  holeCards: readonly [Card, Card] | null;
};

type MutableHand = {
  id: string;
  handNumber: number;
  communityCards: Card[];
  playerHands: MutablePlayerHand[];
  actions: Array<{
    playerId: string;
    type: ActionType;
    amount: number | null;
    street: Street;
    order: number;
  }>;
  pot: number;
  currentStreet: Street;
  isComplete: boolean;
};

type MutableSession = {
  id: string;
  code: string;
  players: Player[];
  hands: MutableHand[];
  status: Session["status"];
  diagnosisResults: Record<string, DiagnosisResult>;
  createdAt: string;
};

function successJson<T>(data: T) {
  return { success: true as const, data };
}

function toSession(state: MutableSession): Session {
  return { ...state } as unknown as Session;
}

export type ApiMockerState = {
  readonly session: MutableSession;
};

/**
 * Playwright の page.route() で全APIエンドポイントをインターセプトするステートフルモッカー。
 * 内部に mutable な session state を保持し、リクエスト内容に応じて動的に更新して返す。
 */
export async function setupApiMocks(
  page: Page,
  initialSession: Session,
): Promise<{ getState: () => ApiMockerState }> {
  const state: MutableSession = JSON.parse(JSON.stringify(initialSession));
  let handIdCounter = state.hands.length;

  // --- POST /api/sessions (セッション作成) ---
  // Landing page からの新規作成。route は厳密にマッチさせる。
  await page.route("**/api/sessions", async (route: Route) => {
    const method = route.request().method();
    if (method === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(successJson(toSession(state))),
      });
    }
    // GET /api/sessions?code=XXX
    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(successJson(toSession(state))),
      });
    }
    return route.continue();
  });

  // --- POST /api/sessions/{id}/players (プレイヤー追加) ---
  await page.route(`**/api/sessions/${state.id}/players`, async (route: Route) => {
    if (route.request().method() !== "POST") return route.continue();
    const body = route.request().postDataJSON() as { name: string; seatNumber: number };
    const newPlayer: Player = {
      id: `player-${state.players.length + 1}`,
      name: body.name,
      seatNumber: body.seatNumber,
      joinedAt: new Date().toISOString(),
    };
    state.players.push(newPlayer);
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(successJson(toSession(state))),
    });
  });

  // --- POST /api/sessions/{id}/diagnose (診断実行) ---
  // NOTE: /diagnose を /hands/* の前に登録（パスの曖昧さ回避）
  await page.route(`**/api/sessions/${state.id}/diagnose`, async (route: Route) => {
    if (route.request().method() !== "POST") return route.continue();
    const results: Record<string, DiagnosisResult> = {};
    for (const player of state.players) {
      results[player.id] = createMockDiagnosisResult(player.id, player.name);
    }
    state.diagnosisResults = results;
    state.status = "completed";
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successJson(toSession(state))),
    });
  });

  // --- PUT /api/sessions/{id}/hands/{hid}/hole-cards ---
  await page.route(`**/api/sessions/${state.id}/hands/*/hole-cards`, async (route: Route) => {
    if (route.request().method() !== "PUT") return route.continue();
    const body = route.request().postDataJSON() as {
      playerId: string;
      holeCards: readonly [Card, Card];
    };
    const handId = extractHandId(route.request().url());
    const hand = state.hands.find((h) => h.id === handId);
    if (hand) {
      const ph = hand.playerHands.find((p) => p.playerId === body.playerId);
      if (ph) {
        (ph as MutablePlayerHand).holeCards = body.holeCards;
      }
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successJson(toSession(state))),
    });
  });

  // --- POST /api/sessions/{id}/hands/{hid}/actions ---
  await page.route(`**/api/sessions/${state.id}/hands/*/actions`, async (route: Route) => {
    if (route.request().method() !== "POST") return route.continue();
    const body = route.request().postDataJSON() as {
      playerId: string;
      type: ActionType;
      amount?: number | null;
    };
    const handId = extractHandId(route.request().url());
    const hand = state.hands.find((h) => h.id === handId);
    if (hand) {
      hand.actions.push({
        playerId: body.playerId,
        type: body.type,
        amount: body.amount ?? null,
        street: hand.currentStreet,
        order: hand.actions.length,
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successJson(toSession(state))),
    });
  });

  // --- POST /api/sessions/{id}/hands (ハンド作成) ---
  // --- GET /api/sessions/{id}/hands (ハンド一覧) ---
  await page.route(new RegExp(`/api/sessions/${state.id}/hands$`), async (route: Route) => {
    const method = route.request().method();
    if (method === "POST") {
      const body = route.request().postDataJSON() as { playerIds: readonly string[] };
      handIdCounter++;
      const newHand: MutableHand = {
        id: `hand-${handIdCounter}`,
        handNumber: handIdCounter,
        communityCards: [],
        playerHands: body.playerIds.map((pid) => ({
          playerId: pid,
          holeCards: null,
        })),
        actions: [],
        pot: 0,
        currentStreet: "preflop",
        isComplete: false,
      };
      state.hands.push(newHand);
      state.status = "playing";
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(successJson(toSession(state))),
      });
    }
    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(successJson(state.hands)),
      });
    }
    return route.continue();
  });

  // --- PUT /api/sessions/{id}/hands/{hid} (ハンド更新: コミュニティカード, ストリート進行, 完了) ---
  await page.route(
    new RegExp(`/api/sessions/${state.id}/hands/[^/]+$`),
    async (route: Route) => {
      if (route.request().method() !== "PUT") return route.continue();
      const body = route.request().postDataJSON() as {
        communityCards?: readonly Card[];
        currentStreet?: Street;
        isComplete?: boolean;
        pot?: number;
      };
      const handId = extractHandIdFromEnd(route.request().url());
      const hand = state.hands.find((h) => h.id === handId);
      if (hand) {
        if (body.communityCards) {
          hand.communityCards.push(...body.communityCards);
        }
        if (body.currentStreet) {
          hand.currentStreet = body.currentStreet;
        }
        if (body.isComplete !== undefined) {
          hand.isComplete = body.isComplete;
        }
        if (body.pot !== undefined) {
          hand.pot = body.pot;
        }
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(successJson(toSession(state))),
      });
    },
  );

  // --- GET /api/sessions/{id} (セッション取得) ---
  // NOTE: 最後に登録することで他のサブパスとの競合を回避
  await page.route(
    new RegExp(`/api/sessions/${state.id}$`),
    async (route: Route) => {
      if (route.request().method() !== "GET") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(successJson(toSession(state))),
      });
    },
  );

  return { getState: () => ({ session: state }) };
}

// URL から handId を抽出: /hands/{handId}/actions or /hands/{handId}/hole-cards
function extractHandId(url: string): string {
  const match = url.match(/\/hands\/([^/]+)\//);
  return match?.[1] ?? "";
}

// URL末尾から handId を抽出: /hands/{handId}
function extractHandIdFromEnd(url: string): string {
  const match = url.match(/\/hands\/([^/?]+)$/);
  return match?.[1] ?? "";
}
