interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function scoreColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 41) return "#d97706";
  return "#dc2626";
}

export default function ScoreGauge({ score, size = 120 }: ScoreGaugeProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#eef0f6"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-extrabold tabular-nums" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">/100</div>
      </div>
    </div>
  );
}
