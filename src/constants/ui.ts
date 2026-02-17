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

// セッション状態のバッジスタイル
export const SESSION_STATUS_BADGE_CLASSES: Readonly<Record<string, string>> = {
  waiting: "bg-gray-100 text-gray-600",
  playing: "bg-blue-100 text-blue-700",
  diagnosing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
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

// 管理者画面
export const ADMIN_LABELS = {
  pageTitle: "管理者ダッシュボード",
  sessionList: "セッション一覧",
  sessionDetail: "セッション詳細",
  noSessions: "セッションがまだありません",
  handHistory: "ハンド履歴",
  diagnosisResults: "診断結果",
  noDiagnosis: "診断未実施",
  printButton: "印刷 / PDF保存",
  backToList: "一覧に戻る",
  handNumber: "Hand",
  pot: "ポット",
  communityCards: "コミュニティカード",
  holeCards: "ホールカード",
  players: "参加者",
  sessionCode: "セッションコード",
  sessionDate: "実施日",
  handCount: "ハンド数",
  noHands: "ハンドがまだ記録されていません",
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
