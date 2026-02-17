import type { Hand, Street, Player } from "@/types";

const STREET_ORDER: readonly Street[] = ["preflop", "flop", "turn", "river"];

/** 完了ハンド数を導出する */
export const deriveHandCount = (hands: readonly Hand[]): number =>
  hands.filter((h) => h.isComplete).length;

/** 現在のハンドIDを導出する（未完了ハンドがあればそのID） */
export const deriveCurrentHandId = (hands: readonly Hand[]): string | null =>
  hands.find((h) => !h.isComplete)?.id ?? null;

/** 指定ハンドでフォールド済みのプレイヤーIDセットを導出する */
export const deriveFoldedPlayerIds = (hand: Hand): Set<string> => {
  const folded = new Set<string>();
  for (const action of hand.actions) {
    if (action.type === "fold") {
      folded.add(action.playerId);
    }
  }
  return folded;
};

/**
 * 指定ハンドの指定ストリートで、まだアクションが必要なプレイヤーのindexセットを導出する。
 *
 * ロジック:
 * 1. 現ストリート以前のfoldプレイヤーを除外
 * 2. 全アクティブプレイヤーに行動権を付与
 * 3. 現ストリートのアクションを順番に再生:
 *    - fold → アクティブ除外 + 行動権消費
 *    - check/call → 行動権消費
 *    - raise → 行動権消費 + 他全アクティブに行動権再付与
 */
export const derivePlayersToAct = (
  hand: Hand,
  street: Street,
  players: readonly Player[]
): Set<number> => {
  const currentStreetIndex = STREET_ORDER.indexOf(street);

  // 現ストリート以前のfoldプレイヤーを収集
  const foldedIds = new Set<string>();
  for (const action of hand.actions) {
    const actionStreetIndex = STREET_ORDER.indexOf(action.street);
    if (actionStreetIndex < currentStreetIndex && action.type === "fold") {
      foldedIds.add(action.playerId);
    }
  }

  // playerId → playerIndex マップ
  const playerIdToIndex = new Map<string, number>();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player) {
      playerIdToIndex.set(player.id, i);
    }
  }

  // アクティブプレイヤーのindexセット
  const activeIndices = new Set<number>();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    if (player && !foldedIds.has(player.id)) {
      activeIndices.add(i);
    }
  }

  // 全アクティブプレイヤーがまず行動権を持つ
  const toAct = new Set<number>(activeIndices);

  // 現ストリートのアクションを再生
  const streetActions = hand.actions
    .filter((a) => a.street === street)
    .sort((a, b) => a.order - b.order);

  for (const action of streetActions) {
    const idx = playerIdToIndex.get(action.playerId);
    if (idx === undefined) continue;

    if (action.type === "fold") {
      toAct.delete(idx);
      activeIndices.delete(idx);
    } else if (action.type === "raise") {
      toAct.delete(idx);
      for (const activeIdx of activeIndices) {
        if (activeIdx !== idx) {
          toAct.add(activeIdx);
        }
      }
    } else {
      // check / call
      toAct.delete(idx);
    }
  }

  return toAct;
};

/** GamePhaseからストリートを抽出する */
export const getStreetFromPhase = (
  phase: { readonly step: string; readonly street?: Street }
): Street | null => {
  if ("street" in phase && phase.street) return phase.street;
  if (phase.step === "card-input") return "preflop";
  return null;
};
