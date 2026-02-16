# Firebase Firestore 移行 SOW

## 概要

| 項目 | 内容 |
|------|------|
| 日付 | 2026-02-16 |
| 目的 | インメモリストアからFirebase Firestoreへの移行によるデータ永続化 |
| 対象 | `src/lib/store.ts` および全APIルート |

## 背景

現在のポーカー診断アプリは `Map<string, MutableSession>` によるインメモリストアを使用しており、サーバー再起動でデータが消失する。Firebase Firestoreに移行してデータを永続化する。

## スコープ

### In Scope

- Firebase Admin SDK (`firebase-admin`) の導入
- `src/lib/firebase.ts`: Firebase初期化モジュール新規作成
- `src/lib/store.ts`: 全11関数をFirestore操作に書き換え（同期→非同期）
- 全8 APIルート: `await` 追加 + try-catchエラーハンドリング
- 環境変数設定 (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- `CLAUDE.md` 更新

### Out of Scope

- 型定義の変更（`src/types/*` は変更不要）
- クライアント側フック・ページの変更（APIインターフェースは不変）
- Firebase Emulator のセットアップ
- Firestoreセキュリティルール（Admin SDKはルールをバイパス）
- データマイグレーション（既存データはインメモリのため不要）

## 技術設計

### Firestoreデータモデル

```
Collection: sessions
  Document ID: {nanoid}
  Fields:
    id: string
    code: string (6文字)
    players: array<Player>
    hands: array<Hand>
    status: string
    diagnosisResults: map<string, DiagnosisResult>
    createdAt: string (ISO 8601)
```

- Session全体を1ドキュメントに格納（サブコレクション不使用）
- 最大データ量 ~200KB（Firestore上限1MBに十分余裕あり）

### 変更ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `package.json` | `firebase-admin` 追加 |
| `.env.example` | Firebase環境変数テンプレート追加 |
| `src/lib/firebase.ts` | 新規: Firebase Admin SDK初期化 |
| `src/lib/store.ts` | 全面書き換え: Firestore操作に移行 |
| `src/app/api/sessions/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/players/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/hands/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/hands/[handId]/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/hands/[handId]/actions/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/hands/[handId]/hole-cards/route.ts` | `await` + try-catch |
| `src/app/api/sessions/[sessionId]/diagnose/route.ts` | `await` + try-catch |
| `CLAUDE.md` | Tech Stack・データストア説明更新 |

## 受け入れ基準

- [ ] `npm run build` が型エラーなしで成功する
- [ ] セッション作成→プレイヤー追加→ハンド作成→アクション記録→診断実行の全フローが動作する
- [ ] ページリロード後もデータが保持される
- [ ] Firebaseコンソールでドキュメントが正しく保存されていることを確認できる
