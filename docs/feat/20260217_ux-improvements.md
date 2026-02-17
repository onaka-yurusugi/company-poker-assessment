# UX改善 SOW

## 概要

| 項目 | 内容 |
|------|------|
| 日付 | 2026-02-17 |
| 目的 | ユーザー体験向上のための3つの改善 |
| 対象 | AI診断プロンプト、プレイ振り返りUI、結果画面遷移 |

## 背景

ポーカー診断アプリのUX改善要望として以下3点が挙がった:
1. AI診断コメントがネガティブ要素を含んでおり、褒めが足りない
2. プレイ振り返り画面でプレイヤーのホールカードが表示されていない
3. 「結果を見る」ボタンが同タブ遷移のため、複数結果の比較がしにくい

## スコープ

### In Scope

#### 1. AI診断コメントをポジティブ全振りに変更

- `src/lib/prompt.ts`: システムプロンプトに「とにかく褒める」指示を追加、`weaknesses` を `growthPotentials`（さらなる可能性）に変更
- `src/lib/openai.ts`: `DiagnosisResponse` 型の `weaknesses` を `growthPotentials` にリネーム
- `src/types/diagnosis.ts`: `DiagnosisResult` 型の `weaknesses` を `growthPotentials` にリネーム
- `src/app/api/sessions/[sessionId]/diagnose/route.ts`: フィールド名の変更反映
- `src/components/result/DiagnosisCard.tsx`: 「改善ポイント」→「さらなる可能性」、警告アイコン→ポジティブなアイコンに変更
- `src/app/result/[sessionId]/[playerId]/page.tsx`: props名の変更反映

#### 2. プレイ振り返りでホールカードを分かりやすく表示

- `src/components/play/PlayReview.tsx`: `HandReviewCard` にプレイヤーごとのホールカード表示セクションを追加。背景色付きで視覚的にハイライト

#### 3. 「結果を見る」を新規タブで開く

- `src/app/play/[sessionId]/page.tsx`: `router.push()` を `<a target="_blank">` に変更

### Out of Scope

- AI診断ロジック（統計計算、スタイル判定）の変更
- Firestore スキーマの変更（フィールド名は JSON レベルの変更のみ）
- デザインの大幅なリニューアル

## 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/lib/prompt.ts` | プロンプトのポジティブ化 + `weaknesses` → `growthPotentials` |
| `src/lib/openai.ts` | 型定義のフィールド名変更 |
| `src/types/diagnosis.ts` | `DiagnosisResult` 型のフィールド名変更 |
| `src/app/api/sessions/[sessionId]/diagnose/route.ts` | フィールド名の変更反映 |
| `src/components/result/DiagnosisCard.tsx` | UI表示のポジティブ化 |
| `src/app/result/[sessionId]/[playerId]/page.tsx` | props名の変更反映 |
| `src/components/play/PlayReview.tsx` | ホールカード表示追加 |
| `src/app/play/[sessionId]/page.tsx` | 新規タブ遷移に変更 |

## リスク

- 既存のFirestoreに保存済みの診断結果には `weaknesses` フィールドが存在する。新しいフィールド名 `growthPotentials` との互換性を考慮し、結果表示ページでフォールバック処理を入れる
