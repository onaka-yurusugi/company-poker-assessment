"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type Axis = {
  readonly label: string;
  readonly score: number;
};

type RadarChartDisplayProps = {
  readonly axes: readonly Axis[];
};

export default function RadarChartDisplay({ axes }: RadarChartDisplayProps) {
  const chartData = axes.map((axis) => ({
    subject: axis.label,
    value: axis.score,
  }));

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-2 text-lg font-semibold text-foreground">能力プロファイル</h3>
      <div className="h-72 w-full sm:h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#374151", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name="スコア"
              dataKey="value"
              stroke="#d97706"
              strokeWidth={2}
              fill="url(#radarGradient)"
              fillOpacity={1}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
