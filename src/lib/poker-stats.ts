import type { Hand, PokerStats } from "@/types";

export const calculatePokerStats = (playerId: string, hands: readonly Hand[]): PokerStats => {
  let preflopVoluntaryActions = 0;
  let preflopRaises = 0;
  let totalBetsAndRaises = 0;
  let totalCalls = 0;
  let totalFolds = 0;
  let totalActions = 0;
  let cbetOpportunities = 0;
  let cbetMade = 0;
  let handsReachedRiver = 0;

  const participatedHands = hands.filter((hand) =>
    hand.playerHands.some((ph) => ph.playerId === playerId)
  );

  for (const hand of participatedHands) {
    const playerActions = hand.actions.filter((a) => a.playerId === playerId);

    // プリフロップアクション分析
    const preflopActions = playerActions.filter((a) => a.street === "preflop");
    const hasPreflopVoluntary = preflopActions.some(
      (a) => a.type === "call" || a.type === "bet" || a.type === "raise" || a.type === "all-in"
    );
    if (hasPreflopVoluntary) preflopVoluntaryActions++;

    const hasPreflopRaise = preflopActions.some(
      (a) => a.type === "raise" || a.type === "bet"
    );
    if (hasPreflopRaise) preflopRaises++;

    // 全ストリートアクション集計
    for (const action of playerActions) {
      totalActions++;
      if (action.type === "bet" || action.type === "raise" || action.type === "all-in") {
        totalBetsAndRaises++;
      }
      if (action.type === "call") {
        totalCalls++;
      }
      if (action.type === "fold") {
        totalFolds++;
      }
    }

    // CBet%: プリフロップでレイズしたプレイヤーがフロップで最初にベットしたか
    if (hasPreflopRaise) {
      const flopActions = hand.actions.filter((a) => a.street === "flop");
      if (flopActions.length > 0) {
        cbetOpportunities++;
        const firstFlopAction = flopActions[0];
        if (
          firstFlopAction &&
          firstFlopAction.playerId === playerId &&
          (firstFlopAction.type === "bet" || firstFlopAction.type === "raise")
        ) {
          cbetMade++;
        }
      }
    }

    // Showdown%: リバーまで残ったか（foldしていない）
    const hasFolded = playerActions.some((a) => a.type === "fold");
    const handReachedRiver = hand.actions.some((a) => a.street === "river");
    if (handReachedRiver && !hasFolded) {
      handsReachedRiver++;
    }
  }

  const totalHands = participatedHands.length;
  const safeTotal = Math.max(totalHands, 1);
  const safeTotalActions = Math.max(totalActions, 1);

  return {
    vpip: (preflopVoluntaryActions / safeTotal) * 100,
    pfr: (preflopRaises / safeTotal) * 100,
    aggressionFactor: totalBetsAndRaises / Math.max(totalCalls, 1),
    foldPercentage: (totalFolds / safeTotalActions) * 100,
    cbetPercentage: cbetOpportunities > 0 ? (cbetMade / cbetOpportunities) * 100 : 0,
    showdownPercentage: (handsReachedRiver / safeTotal) * 100,
    totalHands,
  };
};
