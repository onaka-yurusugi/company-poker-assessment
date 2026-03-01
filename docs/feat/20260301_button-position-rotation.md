# ボタンポジション（ディーラーボタン）のローテーション実装

## 背景・目的

ポーカーではハンドごとにディーラーボタン（BTN）が時計回りに移動し、ボタンの左隣のプレイヤーから行動が始まる。現在の実装ではこの概念がなく、毎ハンドで `players[0]` が常に最初にアクションする状態になっている。

ポーカーにおいてポジションは戦略の根幹であり、AI診断の精度にも影響するため、ボタンのローテーションを実装する。

## 要件

1. ハンドごとにボタンポジションが1つずつ時計回りに移動する
2. 各ストリート（プリフロップ/フロップ/ターン/リバー）の行動開始プレイヤーがボタンの次のアクティブプレイヤーになる
3. ハンド開始画面で誰がBTNかを視覚的に表示する
4. 既存データ（`buttonPlayerIndex` が未定義のハンド）との後方互換性を維持する

## 変更内容

### 型定義
- `Hand` 型に `buttonPlayerIndex: number` フィールド追加 (`src/types/hand.ts`)
- `CreateHandRequest` に `buttonPlayerIndex: number` 追加 (`src/types/api.ts`)

### データストア
- `createHand()` に `buttonPlayerIndex` 引数追加 (`src/lib/store.ts`)

### APIルート
- `POST /api/sessions/[sessionId]/hands` で `buttonPlayerIndex` を受け取り `createHand` に渡す

### ゲームロジック
- `getFirstActivePlayerAfterButton()` ヘルパー関数追加 (`src/lib/game-state.ts`)
  - ボタン位置から循環探索して最初のアクティブプレイヤーを返す
- `startHand()`: 前ハンドのボタン位置 +1 でローテーション、最初のプレイヤーを計算
- `submitCommunityCards()`: `activePlayerIndices[0]` → ボタン基準の開始プレイヤーに変更

### UI
- ハンド開始画面のプレイヤーリストでBTNプレイヤーをゴールドで強調表示

## 影響範囲

- 6ファイル変更
- 既存のFirestoreデータは `buttonPlayerIndex` が undefined だが、`?? 0` でフォールバックするため互換性あり
- AI診断ロジック（`poker-stats.ts`, `diagnosis-mapper.ts`）への影響なし（アクション順序自体は変わらないため）
