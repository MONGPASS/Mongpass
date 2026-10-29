"use client";
import { useState } from "react";

export default function TrendChart({
  points,
  label,
  unit = "건",
  color = "#ff8636",
}: {
  points: { date: string; value: number }[];
  label: string;
  unit?: string;
  color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 680,
    height = 215,
    left = 30,
    right = 12,
    top = 25,
    bottom = 30;
  const max = Math.max(4, ...points.map((day) => day.value));
  const ceiling = Math.ceil(max / 4) * 4;
  const x = (index: number) =>
    left + (index / Math.max(1, points.length - 1)) * (width - left - right);
  const y = (value: number) =>
    height - bottom - (value / ceiling) * (height - top - bottom);
  const polyline = points
    .map((day, index) => `${x(index)},${y(day.value)}`)
    .join(" ");
  const active = hover === null ? points.length - 1 : hover;
  return (
    <svg
      className="mp-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}: ${points.map((row) => `${row.date} ${row.value}${unit}`).join(", ")}`}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="mp-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".09" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((step) => (
        <g key={step}>
          <line
            x1={left}
            x2={width - right}
            y1={y((step * ceiling) / 4)}
            y2={y((step * ceiling) / 4)}
            stroke="#eef0f2"
            strokeDasharray={step ? "3 4" : ""}
          />
          <text x={left - 12} y={y((step * ceiling) / 4) + 4} textAnchor="end">
            {(step * ceiling) / 4}
          </text>
        </g>
      ))}
      {!!points.length && (
        <>
          <polygon
            points={`${left},${height - bottom} ${polyline} ${x(points.length - 1)},${height - bottom}`}
            fill="url(#mp-chart-fill)"
          />
          <polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      {points.map((day, index) => (
        <g key={day.date}>
          {(index === 0 ||
            index === points.length - 1 ||
            index % Math.max(1, Math.floor(points.length / 6)) === 0) && (
            <text x={x(index)} y={height - 8} textAnchor="middle">
              {day.date.slice(5).replace("-", ".")}
            </text>
          )}
          <rect
            x={
              x(index) -
              (width - left - right) / Math.max(1, points.length - 1) / 2
            }
            y={top}
            width={(width - left - right) / Math.max(1, points.length - 1)}
            height={height - top - bottom}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
          >
            <title>{`${day.date}: ${day.value}`}</title>
          </rect>
        </g>
      ))}
      {points[active] && (
        <g pointerEvents="none">
          <line
            x1={x(active)}
            x2={x(active)}
            y1={top}
            y2={height - bottom}
            stroke={color}
            strokeDasharray="3 4"
            opacity=".4"
          />
          <circle
            cx={x(active)}
            cy={y(points[active].value)}
            r="4"
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
          <rect
            x={Math.min(width - 72, Math.max(34, x(active) - 29))}
            y={Math.max(0, y(points[active].value) - 30)}
            width="58"
            height="22"
            rx="5"
            fill="#fff"
            stroke={color}
          />
          <text
            x={Math.min(width - 43, Math.max(63, x(active)))}
            y={Math.max(0, y(points[active].value) - 30) + 15}
            textAnchor="middle"
            style={{ fill: color, fontWeight: 600 }}
          >
            {points[active].value}
            {unit}
          </text>
        </g>
      )}
    </svg>
  );
}
