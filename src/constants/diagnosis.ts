import type { PokerStyle } from "@/types";

// スタイル判定閾値
export const VPIP_THRESHOLD = 40;
export const AF_THRESHOLD = 2.0;

// ビジネスタイプマッピング
export const BUSINESS_TYPE_MAP: Readonly<
  Record<PokerStyle, { readonly name: string; readonly description: string }>
> = {
  "loose-aggressive": {
    name: "革新的開拓者タイプ",
    description:
      "大胆な意思決定と高い行動力で新しい市場やプロジェクトを切り拓く。リスクを恐れず挑戦し、チームに勢いをもたらす存在。",
  },
  "tight-aggressive": {
    name: "戦略的リーダータイプ",
    description:
      "慎重な分析に基づいて的確な判断を下し、ここぞという場面で力強くリードする。効率的な資源配分と明確なビジョンでチームを導く。",
  },
  "loose-passive": {
    name: "協調的サポータータイプ",
    description:
      "柔軟な姿勢で多くの場面に関わり、チームの調和を保つ。周囲の意見を尊重し、コミュニケーションを通じて組織を支える縁の下の力持ち。",
  },
  "tight-passive": {
    name: "堅実な管理者タイプ",
    description:
      "リスクを最小限に抑え、安定した運営を実現する。データと実績に基づいた堅実な判断で、組織の土台を守り維持する。",
  },
} as const;

// 6軸診断定義
export const DIAGNOSIS_AXES = [
  { key: "riskTolerance", label: "リスク許容度" },
  { key: "decisionSpeed", label: "意思決定スピード" },
  { key: "analyticalThinking", label: "分析的思考力" },
  { key: "adaptability", label: "適応力・柔軟性" },
  { key: "stressManagement", label: "プレッシャー耐性" },
  { key: "resourceManagement", label: "リソース管理力" },
] as const;
