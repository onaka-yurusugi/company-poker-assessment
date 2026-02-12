// ページタイトル
export const PAGE_TITLES = {
  landing: "Company Poker Assessment",
  playerEntry: "プレイヤー登録",
  dealerRecord: "ディーラー記録",
  diagnosis: "診断結果",
} as const;

// セッション状態の表示名
export const SESSION_STATUS_LABELS = {
  waiting: "参加者待ち",
  playing: "ゲーム中",
  diagnosing: "診断中",
  completed: "完了",
} as const;

// ストリート表示名
export const STREET_LABELS = {
  preflop: "プリフロップ",
  flop: "フロップ",
  turn: "ターン",
  river: "リバー",
} as const;

// 共通メッセージ
export const MESSAGES = {
  sessionNotFound: "セッションが見つかりません",
  handNotFound: "ハンドが見つかりません",
  playerNotFound: "プレイヤーが見つかりません",
  invalidCard: "無効なカードです",
  cardAlreadyUsed: "このカードは既に使用されています",
  invalidAction: "無効なアクションです",
  sessionFull: "セッションが満員です",
  diagnosisInProgress: "診断を実行中です...",
  diagnosisComplete: "診断が完了しました",
  unexpectedError: "予期しないエラーが発生しました",
  nameRequired: "名前を入力してください",
  seatRequired: "座席番号を選択してください",
  seatTaken: "その座席は既に使用されています",
} as const;

// ボタンラベル
export const BUTTON_LABELS = {
  createSession: "セッションを作成",
  joinSession: "セッションに参加",
  startGame: "ゲーム開始",
  nextHand: "次のハンドへ",
  nextStreet: "次のストリートへ",
  completeHand: "ハンド完了",
  runDiagnosis: "診断を実行",
  backToTop: "トップに戻る",
} as const;
