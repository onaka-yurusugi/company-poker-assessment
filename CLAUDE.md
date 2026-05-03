# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ポーカーのシミュレーションプレイを通じて、プレイスタイルからビジネスパーソンとしての意思決定タイプをAI診断するNext.jsアプリケーション。1台のタブレットを回して複数人がプレイする設計。

## Commands

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint実行
```

## Tech Stack

- **Next.js 16** (App Router) / **React 19** / **TypeScript** (strict mode)
- **Tailwind CSS 4** (PostCSS統合)
- **OpenAI SDK** (GPT-5.2) — AI診断に使用
- **Recharts** — レーダーチャート表示
- **nanoid** — ID生成
- **Firebase Admin SDK** (`firebase-admin`) — Firestore データ永続化

## Architecture

### データストア

Firebase Firestore（単一ドキュメントモデル）。Session全体を `sessions` コレクションの1ドキュメントに格納。Firebase Admin SDK (`src/lib/firebase.ts`) でサーバーサイドからアクセスし、ストア関数 (`src/lib/store.ts`) は全て非同期。

### API設計

全APIレスポンスは `ApiResponse<T>` 型（`{ success: true; data: T } | { success: false; error: string }`）。

REST APIは `src/app/api/sessions/` 配下にネストされたルート構造:
- `POST /api/sessions` — セッション作成
- `GET /api/sessions?code=XXXX` — コードでセッション検索
- `GET /api/sessions/[sessionId]` — セッション取得
- `POST /api/sessions/[sessionId]/players` — プレイヤー追加
- `GET|POST /api/sessions/[sessionId]/hands` — ハンド管理
- `PUT /api/sessions/[sessionId]/hands/[handId]` — ハンド更新
- `POST /api/sessions/[sessionId]/hands/[handId]/actions` — アクション記録
- `PUT /api/sessions/[sessionId]/hands/[handId]/hole-cards` — ホールカード設定
- `POST /api/sessions/[sessionId]/diagnose` — AI診断実行

### ゲームプレイの状態遷移 (`src/app/play/[sessionId]/page.tsx`)

`GamePhase` による手書きステートマシンで制御:
```
hand-start → player-intro → card-input → action-select → turn-complete
  ↻ (次プレイヤー/次ストリート)
→ dealer-turn → hand-complete → diagnosing → complete
```

### AI診断フロー (`src/app/api/sessions/[sessionId]/diagnose/route.ts`)

1. ポーカー統計計算（VPIP, PFR, AF, Fold%, CBet%, SD%）→ `src/lib/poker-stats.ts`
2. スタイル判定（Loose/Tight × Aggressive/Passive）→ `src/lib/diagnosis-mapper.ts`
3. ビジネスタイプマッピング → `src/constants/diagnosis.ts`
4. OpenAI呼び出し（JSON出力、6軸スコア+アドバイス）→ `src/lib/openai.ts`, `src/lib/prompt.ts`

### クライアント状態管理

- `src/hooks/useSession.ts` — セッション状態管理 + 3秒間隔ポーリング
- `src/hooks/usePolling.ts` — 汎用ポーリング
- `src/hooks/useLocalStorage.ts` — SSR対応のlocalStorage管理

### UI定数の一元管理

全UI文字列（メッセージ、ラベル、ボタン）は `src/constants/ui.ts` で管理。ポーカー関連の表示定数は `src/constants/poker.ts`。

## TypeScript Conventions

- `strict: true` + `noUncheckedIndexedAccess: true`
- `@/*` パスエイリアスで `./src/*` を参照
- `any` / `unknown` 使用禁止
- `class` は原則不使用（`Error` 拡張など必要な場合を除く）
- 型定義は `src/types/` に集約、`readonly` 修飾子を徹底使用

## Git Workflow / マージ戦略

### ブランチ運用

`feature → staging → main` の3層フロー。

- **feature ブランチ**: 新機能・バグ修正の作業ブランチ。base は `staging`。
- **staging**: 検証用ブランチ。feature をここへマージしてから main へ流す。
- **main**: 本番反映用。`staging` からのマージ専用。

### マージ戦略（PR種別ごと）

| PR種別 | base | head | マージ方式 |
|---|---|---|---|
| feature → staging | `staging` | `feature/*` `fix/*` 等 | **Squash merge** |
| staging → main（リリース） | `main` | `staging` | **マージコミット**（squash 禁止） |
| main → staging（追従） | `staging` | `main` | **マージコミット**（squash 禁止） |

`staging ↔ main` 間で squash すると履歴が乖離してコンフリクトを誘発するため、必ずマージコミットを使う。

### Claude Code 向け注意

- feature ブランチから PR を作る時は `gh pr create --base staging` を必ず指定する（デフォルトの `main` ではない）。
- `staging` 経由をスキップして main 直マージを行うと、後続の staging→main リリース PR でコンフリクトする。緊急 hotfix 等で main 直マージした場合は、すぐに `main → staging` 追従 PR を作成すること。

## Environment Variables

```
OPENAI_API_KEY=sk-...                    # OpenAI APIキー
FIREBASE_PROJECT_ID=your-project-id      # FirebaseプロジェクトID
FIREBASE_CLIENT_EMAIL=sa@project.iam...  # サービスアカウントメール
FIREBASE_PRIVATE_KEY="-----BEGIN..."     # サービスアカウント秘密鍵
```

全て `.env.local` に配置。
