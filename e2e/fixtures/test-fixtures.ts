import { test as base } from "@playwright/test";
import { setupApiMocks, type ApiMockerState } from "./api-mocker";
import {
  createTwoPlayerSession,
  createCompletedHandSession,
  createCompletedSessionWithDiagnosis,
  type Session,
  type Player,
} from "./mock-data";

type SessionData = {
  readonly session: Session;
  readonly player1: Player;
  readonly player2: Player;
};

type TestFixtures = {
  /** 2人プレイヤーの初期セッション（hands空） */
  twoPlayerSession: SessionData;
  /** 1ハンド完了済みセッション */
  completedHandSession: SessionData;
  /** 診断結果付き完了セッション */
  completedDiagnosisSession: SessionData;
  /** API モッカー（twoPlayerSession ベース） */
  apiMocker: { getState: () => ApiMockerState };
};

export const test = base.extend<TestFixtures>({
  twoPlayerSession: async ({}, use) => {
    await use(createTwoPlayerSession());
  },

  completedHandSession: async ({}, use) => {
    await use(createCompletedHandSession());
  },

  completedDiagnosisSession: async ({}, use) => {
    await use(createCompletedSessionWithDiagnosis());
  },

  apiMocker: async ({ page, twoPlayerSession }, use) => {
    const mocker = await setupApiMocks(page, twoPlayerSession.session);
    await use(mocker);
  },
});

export { expect } from "@playwright/test";
