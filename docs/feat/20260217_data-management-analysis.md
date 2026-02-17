# データ管理状況分析 SOW

## 概要

| 項目 | 内容 |
|------|------|
| 日付 | 2026-02-17 |
| 目的 | 現行システムのデータ管理状況を棚卸しし、DB管理すべきデータを特定する |
| 対象 | Firestore永続化データ、クライアント側状態（localStorage/インメモリ） |

## 背景

本アプリはFirebase Firestore（単一ドキュメントモデル）でセッションデータを管理しているが、ゲーム進行に関わる一部の重要データがクライアント側のインメモリ状態やlocalStorageにのみ保持されている。データ消失リスクと運用上の課題を整理し、DB管理の拡充を検討する。

---

## 1. 現在DB管理されているデータ

Firestoreの `sessions` コレクションに1セッション = 1ドキュメントとして格納。

### 1-1. Session（ルートドキュメント）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `id` | `string` | nanoidで生成されるセッションID | `src/types/session.ts:8` |
| `code` | `string` | 6文字の参加コード（例: `AB3K2M`） | `src/types/session.ts:9` |
| `players` | `Player[]` | 参加プレイヤー一覧（ネスト配列） | `src/types/session.ts:10` |
| `hands` | `Hand[]` | 全ハンド履歴（ネスト配列） | `src/types/session.ts:11` |
| `status` | `SessionStatus` | `"waiting"` / `"playing"` / `"diagnosing"` / `"completed"` | `src/types/session.ts:12` |
| `diagnosisResults` | `Record<string, DiagnosisResult>` | プレイヤーIDをキーとした診断結果マップ | `src/types/session.ts:13` |
| `createdAt` | `string` | セッション作成日時（ISO 8601） | `src/types/session.ts:14` |

### 1-2. Player（`session.players[]` にネスト）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `id` | `string` | nanoidで生成されるプレイヤーID | `src/types/player.ts:2` |
| `name` | `string` | プレイヤー表示名 | `src/types/player.ts:3` |
| `seatNumber` | `number` | 座席番号（1〜10） | `src/types/player.ts:4` |
| `joinedAt` | `string` | 参加日時（ISO 8601） | `src/types/player.ts:5` |

### 1-3. Hand（`session.hands[]` にネスト）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `id` | `string` | nanoidで生成されるハンドID | `src/types/hand.ts:22` |
| `handNumber` | `number` | 1始まりの連番 | `src/types/hand.ts:23` |
| `communityCards` | `Card[]` | コミュニティカード（最大5枚） | `src/types/hand.ts:24` |
| `playerHands` | `PlayerHand[]` | 各プレイヤーのホールカード | `src/types/hand.ts:25` |
| `actions` | `Action[]` | 全アクション履歴 | `src/types/hand.ts:26` |
| `pot` | `number` | ポット金額 | `src/types/hand.ts:27` |
| `currentStreet` | `Street` | 現在のストリート（`preflop`/`flop`/`turn`/`river`） | `src/types/hand.ts:28` |
| `isComplete` | `boolean` | ハンド完了フラグ | `src/types/hand.ts:29` |

### 1-4. PlayerHand（`hand.playerHands[]` にネスト）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `playerId` | `string` | プレイヤーID | `src/types/hand.ts:17` |
| `holeCards` | `[Card, Card] \| null` | ホールカード2枚（未入力時null） | `src/types/hand.ts:18` |

### 1-5. Action（`hand.actions[]` にネスト）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `playerId` | `string` | アクションしたプレイヤーのID | `src/types/hand.ts:9` |
| `type` | `ActionType` | `"fold"` / `"check"` / `"call"` / `"raise"` | `src/types/hand.ts:10` |
| `amount` | `number \| null` | ベット額（raise時のみ） | `src/types/hand.ts:11` |
| `street` | `Street` | アクション時のストリート | `src/types/hand.ts:12` |
| `order` | `number` | アクション順序（0始まり） | `src/types/hand.ts:13` |

### 1-6. Card（`communityCards` / `holeCards` 内にネスト）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `suit` | `Suit` | `"spade"` / `"heart"` / `"diamond"` / `"club"` | `src/types/card.ts:7` |
| `rank` | `Rank` | `"A"` / `"2"` 〜 `"K"` | `src/types/card.ts:8` |

### 1-7. DiagnosisResult（`session.diagnosisResults[playerId]` にネスト）

| フィールド | 型 | 説明 | 定義元 |
|---|---|---|---|
| `playerId` | `string` | プレイヤーID | `src/types/diagnosis.ts:21` |
| `playerName` | `string` | プレイヤー名 | `src/types/diagnosis.ts:22` |
| `pokerStyle` | `PokerStyle` | `"loose-aggressive"` 等4種 | `src/types/diagnosis.ts:23` |
| `businessType` | `string` | ビジネスタイプ名 | `src/types/diagnosis.ts:24` |
| `businessTypeDescription` | `string` | ビジネスタイプ説明文 | `src/types/diagnosis.ts:25` |
| `axes` | `DiagnosisAxis[]` | 6軸スコア（レーダーチャート用） | `src/types/diagnosis.ts:26` |
| `stats` | `PokerStats` | ポーカー統計値（VPIP, PFR等7項目） | `src/types/diagnosis.ts:27` |
| `advice` | `string` | AIアドバイス文 | `src/types/diagnosis.ts:28` |
| `strengths` | `string[]` | 強み一覧 | `src/types/diagnosis.ts:29` |
| `weaknesses` | `string[]` | 弱み一覧 | `src/types/diagnosis.ts:30` |
| `createdAt` | `string` | 診断実行日時（ISO 8601） | `src/types/diagnosis.ts:31` |

### 1-8. Firestoreデータモデル図

```
Collection: sessions
  └─ Document: {nanoid}
       ├── id, code, status, createdAt
       ├── players[]
       │     └── { id, name, seatNumber, joinedAt }
       ├── hands[]
       │     ├── { id, handNumber, pot, currentStreet, isComplete }
       │     ├── communityCards[]  → { suit, rank }
       │     ├── playerHands[]    → { playerId, holeCards: [Card, Card] | null }
       │     └── actions[]        → { playerId, type, amount, street, order }
       └── diagnosisResults
             └── [playerId]: { pokerStyle, businessType, axes[], stats, advice, ... }
```

---

## 2. DB管理されていないが、管理すべきと考えられるデータ

### 2-1. ゲーム進行フェーズ（GamePhase）

| 項目 | 内容 |
|---|---|
| **現状** | `src/app/play/[sessionId]/page.tsx:58` の `useState` でインメモリ管理 |
| **データ型** | `GamePhase`（`"loading"` / `"hand-start"` / `"player-intro"` / `"card-input"` / `"action-select"` / `"turn-complete"` / `"dealer-turn"` / `"hand-complete"` / `"review"` / `"diagnosing"` / `"complete"`） |
| **問題** | ページリロード時に正確なフェーズ復元ができない。現在は `session.status` と `hands` から部分的に推測して復元しているが、ハンド途中（action-select中等）の復元は不完全 |
| **影響度** | **高** — ゲーム進行中のリロードでプレイ位置を見失う |
| **推奨** | Session内に `currentPhase` フィールドを追加してDB永続化、または `session.status` を細分化 |

### 2-2. フォールド済みプレイヤー管理（foldedPlayerIds）

| 項目 | 内容 |
|---|---|
| **現状** | `src/app/play/[sessionId]/page.tsx:67` の `useState<Set<string>>` でインメモリ管理 |
| **データ型** | `Set<string>`（フォールドしたプレイヤーIDの集合） |
| **問題** | リロード時にフォールド情報が消失する。`actions` 配列のfoldレコードから再計算は理論上可能だが、現在その復元ロジックは未実装 |
| **影響度** | **高** — フォールド済みプレイヤーに再度アクションを求めてしまう |
| **推奨** | A案: Hand内に `foldedPlayerIds: string[]` を追加してDB永続化 / B案: リロード時にactions配列からfoldを再計算する復元ロジックを実装 |

### 2-3. アクション未完了プレイヤー管理（playersToAct）

| 項目 | 内容 |
|---|---|
| **現状** | `src/app/play/[sessionId]/page.tsx:68` の `useState<Set<number>>` でインメモリ管理 |
| **データ型** | `Set<number>`（アクション未完了プレイヤーのindex集合） |
| **問題** | フォールド管理と同様、リロード時に消失。各ストリートで誰がアクション済みかの追跡が失われる |
| **影響度** | **高** — リロード後にアクション済みプレイヤーに再度問い合わせてしまう可能性 |
| **推奨** | Hand内の `actions` 配列から派生可能なため、復元ロジック実装で対応可能。DB追加は不要の可能性あり |

### 2-4. 現在進行中のハンドID（currentHandId）

| 項目 | 内容 |
|---|---|
| **現状** | `src/app/play/[sessionId]/page.tsx:59` の `useState<string \| null>` でインメモリ管理 |
| **問題** | リロード時に進行中ハンドの特定ができない。`hands` 配列の最後の `isComplete === false` のハンドから推測はできるが明示的ではない |
| **影響度** | **中** — `isComplete` フラグから推測可能だが、明示的な管理がない |
| **推奨** | Session内に `currentHandId` を追加、または `hands` から `isComplete === false` のハンドを復元ロジックで特定 |

### 2-5. プレイするハンド数上限（totalHands）

| 項目 | 内容 |
|---|---|
| **現状** | `localStorage` キー `poker-total-hands-{sessionId}` に保存（`src/app/play/[sessionId]/page.tsx:65`） |
| **データ型** | `number`（5 / 10 / 15 / 20 のいずれか） |
| **問題** | ブラウザのlocalStorageに依存。別端末でアクセスした場合やlocalStorageクリア時にデフォルト値（10）にリセット |
| **影響度** | **中** — セッション設定としてDB管理が望ましい |
| **推奨** | Session内に `totalHands: number` を追加してDB永続化 |

### 2-6. プレイヤーIDとセッションの紐付け

| 項目 | 内容 |
|---|---|
| **現状** | `localStorage` キー `poker-player-{sessionId}` に保存（`src/hooks/useSession.ts:18`） |
| **データ型** | `string \| null`（プレイヤーID） |
| **問題** | 「自分がどのプレイヤーか」の認証情報がlocalStorageにのみ存在。他人のプレイヤーIDを手動設定すれば成りすましが可能 |
| **影響度** | **低〜中** — 社内利用のため認証脅威は限定的だが、端末切り替え時に不便 |
| **推奨** | 将来的に認証機構を導入する場合はDB管理が必要。現時点ではリスク許容可能 |

### 2-7. 完了済みハンド数カウンター（handCount）

| 項目 | 内容 |
|---|---|
| **現状** | `src/app/play/[sessionId]/page.tsx:66` の `useState(0)` でインメモリ管理 |
| **問題** | `session.hands.filter(h => h.isComplete).length` から復元可能だが、リロード時にずれる可能性 |
| **影響度** | **低** — 派生データであり、DBの `hands` 配列から計算可能 |
| **推奨** | DB追加不要。リロード時の復元ロジックで対応（現在は部分的に実装済み） |

---

## 3. 優先度サマリー

| 優先度 | データ | 推奨対応 |
|---|---|---|
| **高** | GamePhase（ゲーム進行フェーズ） | Session内にフィールド追加してDB永続化 |
| **高** | foldedPlayerIds（フォールド状態） | Hand内にフィールド追加 or actions配列からの復元ロジック実装 |
| **高** | playersToAct（未アクション管理） | actions配列からの復元ロジック実装 |
| **中** | currentHandId（進行中ハンドID） | Session内にフィールド追加 or `isComplete` からの復元ロジック |
| **中** | totalHands（ハンド数上限） | Session内にフィールド追加してDB永続化 |
| **低〜中** | プレイヤーID紐付け | 現状維持（将来の認証導入時に対応） |
| **低** | handCount（完了ハンド数） | DB追加不要（派生データ） |

---

## 4. 現行Firestoreドキュメントサイズ見積もり

| 要素 | 1件あたり概算 | 最大件数 | 合計概算 |
|---|---|---|---|
| Session基本 | ~200B | 1 | ~200B |
| Player | ~100B | 10 | ~1KB |
| Hand | ~150B | 20 | ~3KB |
| PlayerHand | ~80B | 200 (10人×20手) | ~16KB |
| Action | ~100B | ~2000 (10人×20手×10アクション) | ~200KB |
| DiagnosisResult | ~1KB | 10 | ~10KB |
| **合計** | | | **~230KB** |

Firestore上限1MBに対して十分な余裕がある。上記の追加フィールド（GamePhase, foldedPlayerIds, totalHands等）を加えても問題なし。

---

## 5. 実装決定事項（2026-02-17 実装済み）

### 採用した方式: B案（既存APIに相乗り）

ゲーム進行のスムーズさを優先し、追加APIエンドポイント・追加APIコールなしの設計を採用。

| データ | 採用方式 | 詳細 |
|---|---|---|
| `gamePhase` | **Session.gameStateに保存** | 既存APIリクエストボディに `gamePhase` フィールドを追加し、同一DB書き込みで保存 |
| `totalHands` | **Session.gameStateに保存** | 初回ハンド開始時に `createHand` APIで同時保存 |
| `currentHandId` | **Session.gameStateに保存** | `createHand` 時に自動設定、`updateHand(isComplete)` 時にnullクリア |
| `foldedPlayerIds` | **actionsから導出** | `src/lib/game-state.ts` の `deriveFoldedPlayerIds()` で算出 |
| `playersToAct` | **actionsから導出** | `src/lib/game-state.ts` の `derivePlayersToAct()` でレイズ再開ロジック含めて算出 |
| `handCount` | **handsから導出** | `src/lib/game-state.ts` の `deriveHandCount()` で算出 |

### 新規ファイル

- `src/types/game-state.ts` — `PersistedGamePhase`, `GamePhase`, `GameState` 型定義
- `src/lib/game-state.ts` — 導出ユーティリティ関数（`deriveFoldedPlayerIds`, `derivePlayersToAct` 等）

### Session型の変更

`gameState: GameState | null` フィールドを追加。null はゲーム未開始またはレガシーデータを意味する。

### リロード時の挙動

最後のAPIコール時点のフェーズに復元される。UI-only遷移（player-introのOKボタン等）の直後にリロードした場合は1つ前のフェーズに戻るが、データは失われないため再操作で復帰可能。
