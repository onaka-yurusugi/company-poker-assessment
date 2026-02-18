# 管理者ダッシュボード SOW

## 概要

| 項目 | 内容 |
|------|------|
| 日付 | 2026-02-17 |
| 目的 | セッションのハンド履歴・診断結果を一覧・閲覧できる管理者用画面の構築 |
| 対象 | 管理者（ファシリテーター）向け。企業へのレポート提出を想定 |

## 背景

ポーカー診断セッション終了後、以下のニーズがある:
1. **セッション管理**: 過去に実施したセッション一覧を日付・参加者付きで確認したい
2. **詳細閲覧**: 各セッションのハンド履歴と全プレイヤーの診断結果をまとめて見たい
3. **企業納品**: 研修結果として企業に渡せる形でデータを提示したい

現状、診断結果は `/result/[sessionId]/[playerId]` で個別プレイヤー単位でしか閲覧できず、セッション全体を俯瞰する画面が存在しない。

## 設計方針

### ページ構成

| ルート | 画面 | 内容 |
|--------|------|------|
| `/admin` | セッション一覧 | 全セッションをカード/テーブル形式で表示 |
| `/admin/[sessionId]` | セッション詳細 | ハンド履歴 + 全プレイヤー診断結果 |

### アクセス制御

- **Phase 1（今回）**: URL直アクセスのみ（認証なし）。管理者がURLを知っていれば閲覧可能
- **Phase 2（将来）**: 必要に応じてパスワード保護やFirebase Authを導入

### 企業提出向け機能

- セッション詳細ページをブラウザ印刷（`Ctrl+P`）で綺麗にPDF化できるよう `@media print` スタイルを適用
- 画面上にも「印刷 / PDF保存」ボタンを配置して導線を明確にする

## スコープ

### In Scope

#### 1. Firestoreからの全セッション取得API

- `GET /api/admin/sessions` — 全セッション一覧を取得（`createdAt` 降順）
- `src/lib/store.ts` に `listSessions()` 関数を追加
- レスポンスはセッション一覧（プレイヤー情報・ステータス・ハンド数を含む軽量版）

#### 2. セッション一覧ページ (`/admin`)

- 各セッションをカード形式で表示
  - **実施日**: `createdAt` をフォーマット表示（例: 2026年2月17日）
  - **参加者**: プレイヤー名一覧（例: 田中, 佐藤, 鈴木）
  - **ステータス**: waiting / playing / diagnosing / completed をバッジ表示
  - **ハンド数**: 実施ハンド数
  - **セッションコード**: 4桁コード表示
- カードクリックでセッション詳細へ遷移
- 空状態（セッション0件）の表示対応

#### 3. セッション詳細ページ (`/admin/[sessionId]`)

**ヘッダーセクション**:
- セッション基本情報（日付、コード、ステータス、参加者名）
- 「印刷 / PDF保存」ボタン

**診断結果セクション**:
- 全プレイヤーの診断結果を横並び or カード形式で表示
  - ビジネスタイプ名・説明
  - レーダーチャート（6軸スコア）
  - ポーカー統計（VPIP, PFR, AF等）
  - 強み・成長ポテンシャル
  - AIアドバイス
- 未診断セッションの場合は「診断未実施」表示

**ハンド履歴セクション**:
- アコーディオン形式で各ハンドを展開/折りたたみ
  - ハンド番号
  - コミュニティカード表示
  - 各プレイヤーのホールカード
  - ストリートごとのアクション（Preflop → Flop → Turn → River）
  - ポット額

**印刷用スタイル**:
- `@media print` でナビゲーション非表示、背景色調整、改ページ制御
- レーダーチャートは印刷時も表示されるよう対応

#### 4. UIコンポーネント

| コンポーネント | 責務 |
|----------------|------|
| `src/components/admin/SessionCard.tsx` | 一覧用セッションカード |
| `src/components/admin/SessionHeader.tsx` | 詳細ページのヘッダー |
| `src/components/admin/DiagnosisPanel.tsx` | 全プレイヤー診断結果パネル |
| `src/components/admin/HandHistory.tsx` | ハンド履歴アコーディオン |
| `src/components/admin/HandDetail.tsx` | 個別ハンド詳細 |
| `src/components/admin/PrintButton.tsx` | 印刷 / PDF保存ボタン |

#### 5. UI定数

- `src/constants/ui.ts` に管理者画面用の文字列を追加

### Out of Scope

- 認証・認可機能（Phase 2以降）
- CSV/Excelエクスポート（印刷/PDF保存で代替）
- セッションの編集・削除機能
- リアルタイム更新（ページリロードで最新化）
- レスポンシブ対応の最適化（PC利用前提）

## 変更対象ファイル

| ファイル | 変更内容 | 新規/既存 |
|----------|----------|-----------|
| `src/lib/store.ts` | `listSessions()` 関数追加 | 既存 |
| `src/app/api/admin/sessions/route.ts` | 全セッション取得API | 新規 |
| `src/app/admin/page.tsx` | セッション一覧ページ | 新規 |
| `src/app/admin/[sessionId]/page.tsx` | セッション詳細ページ | 新規 |
| `src/components/admin/SessionCard.tsx` | セッションカードコンポーネント | 新規 |
| `src/components/admin/SessionHeader.tsx` | 詳細ヘッダーコンポーネント | 新規 |
| `src/components/admin/DiagnosisPanel.tsx` | 診断結果パネルコンポーネント | 新規 |
| `src/components/admin/HandHistory.tsx` | ハンド履歴コンポーネント | 新規 |
| `src/components/admin/HandDetail.tsx` | ハンド詳細コンポーネント | 新規 |
| `src/components/admin/PrintButton.tsx` | 印刷ボタンコンポーネント | 新規 |
| `src/constants/ui.ts` | 管理者画面用文字列追加 | 既存 |

## API設計

### `GET /api/admin/sessions`

全セッション一覧を返す。

**レスポンス例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "code": "1234",
      "status": "completed",
      "players": [
        { "id": "p1", "name": "田中太郎", "seatNumber": 1, "joinedAt": "..." }
      ],
      "handCount": 3,
      "createdAt": "2026-02-17T10:00:00.000Z",
      "hasDiagnosis": true
    }
  ]
}
```

## リスク

- **Firestoreの全ドキュメント取得**: セッション数が増えると一覧取得のパフォーマンスに影響。当面はセッション数が限られるため問題ないが、将来的にはページネーション対応を検討
- **印刷時のレーダーチャート**: Rechartsのチャートはブラウザ印刷時に正しくレンダリングされない場合がある。SVGベースのため基本的に対応可能だが、検証が必要
- **認証なしのリスク**: URLを知っていれば誰でもアクセス可能。内部利用限定であれば許容範囲だが、本番運用時は認証必須

## 将来的な拡張案（参考）

- Firebase Auth による管理者認証
- セッション検索・フィルタリング（日付範囲、ステータス別）
- CSV/Excelエクスポート
- 企業別のセッショングルーピング
- セッション間の統計比較ビュー
