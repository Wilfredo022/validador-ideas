interface RadarProps {
  problema: number;
  construccion: number;
  rentabilidad: number;
  competitividad: number;
  size?: number;
}

function point(cx: number, cy: number, r: number, angle: number, value: number, max = 25) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const rr = (Math.max(0, Math.min(max, value)) / max) * r;
  return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
}

export default function RadarChart({
  problema,
  construccion,
  rentabilidad,
  competitividad,
  size = 220,
}: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const axes = [problema, construccion, rentabilidad, competitividad];
  const labels = ["Problema", "Construcción", "Rentabilidad", "Competitividad"];

  const polygon = axes
    .map((v, i) => point(cx, cy, r, i * 90, v).join(","))
    .join(" ");

  const grid = [0.25, 0.5, 0.75, 1].map((f) =>
    axes
      .map((_, i) => point(cx, cy, r, i * 90, 25 * f, 25).join(","))
      .join(" ")
  );

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        {grid.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="#e6e8f2" strokeWidth={1} />
        ))}
        {axes.map((_, i) => {
          const [x, y] = point(cx, cy, r, i * 90, 25, 25);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e6e8f2" strokeWidth={1} />;
        })}
        <polygon
          points={polygon}
          fill="#6c5ce7"
          fillOpacity={0.18}
          stroke="#6c5ce7"
          strokeWidth={2}
        />
        {axes.map((v, i) => {
          const [x, y] = point(cx, cy, r, i * 90, v);
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#f5b942" />;
        })}
        {axes.map((_, i) => {
          const [x, y] = point(cx, cy, r + 16, i * 90, 25, 25);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              fontSize={11}
            >
              {labels[i]}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-center text-xs sm:grid-cols-4">
        {axes.map((v, i) => (
          <div key={i}>
            <div className="font-bold tabular-nums text-foreground">{v}/25</div>
            <div className="text-muted-foreground">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
