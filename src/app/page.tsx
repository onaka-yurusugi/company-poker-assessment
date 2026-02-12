"use client";

import CreateSessionForm from "@/components/landing/CreateSessionForm";
import JoinSessionForm from "@/components/landing/JoinSessionForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-green-900 to-green-950">
      {/* ヒーローセクション */}
      <header className="flex flex-col items-center gap-4 px-4 pt-16 pb-12 text-center">
        <div className="flex items-center gap-3">
          <span className="text-4xl">♠</span>
          <span className="text-4xl text-poker-red">♥</span>
          <span className="text-4xl text-poker-red">♦</span>
          <span className="text-4xl">♣</span>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Company Poker Assessment
        </h1>
        <p className="max-w-md text-gray-300">
          ポーカーを通じた意思決定タイプ診断
        </p>
        <p className="max-w-lg text-sm text-gray-400">
          ポーカーのプレイスタイルから、あなたのビジネスにおける意思決定パターンを分析します。
          チーム全員でプレイして、お互いの強みと傾向を発見しましょう。
        </p>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-4xl px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* セッション作成セクション */}
          <section className="rounded-2xl border border-poker-gold/30 bg-black/20 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-poker-gold/20">
                <svg className="h-5 w-5 text-poker-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">セッションを作成</h2>
                <p className="text-xs text-gray-400">ディーラー（進行役）向け</p>
              </div>
            </div>
            <CreateSessionForm />
          </section>

          {/* セッション参加セクション */}
          <section className="rounded-2xl border border-poker-green/30 bg-black/20 p-6 backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-poker-green/20">
                <svg className="h-5 w-5 text-poker-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">セッションに参加</h2>
                <p className="text-xs text-gray-400">プレイヤー向け</p>
              </div>
            </div>
            <JoinSessionForm />
          </section>
        </div>

        {/* フローの説明 */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-black/10 p-6">
          <h3 className="mb-4 text-center text-lg font-bold text-poker-gold">使い方</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { step: "1", title: "セッション作成", desc: "ディーラーが作成し、コードを共有" },
              { step: "2", title: "プレイヤー参加", desc: "コードを入力して全員が参加" },
              { step: "3", title: "ポーカー記録", desc: "ハンドをプレイしてアクションを記録" },
              { step: "4", title: "診断結果", desc: "AIがプレイスタイルを分析" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-poker-gold/20 text-sm font-bold text-poker-gold">
                  {item.step}
                </div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
