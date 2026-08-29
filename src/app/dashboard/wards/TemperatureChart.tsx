"use client";

// A trend line for temperature readings over an admission's stay — the
// existing Vital Signs table above already serves as this chart's table
// view (temperature is one of its columns), so this component only adds
// the visual trend, not a duplicate data source. Single series: no legend
// (the section title already says what's plotted), one hue, direct end
// label, hover crosshair + tooltip per the project's charting guidelines.
import { useState } from "react";

export interface TemperaturePoint {
  recordedAt: string; // ISO timestamp
  temperatureC: number;
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD_LEFT = 32;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;
const FEVER_C = 38;

export default function TemperatureChart({
  points,
}: {
  points: TemperaturePoint[];
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <p className="text-muted">
        No temperature readings yet — record vital signs to plot a chart.
      </p>
    );
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const temps = points.map((p) => p.temperatureC);
  const yMin = Math.floor(Math.min(...temps, FEVER_C - 1) * 2) / 2 - 0.5;
  const yMax = Math.ceil(Math.max(...temps, FEVER_C) * 2) / 2 + 0.5;

  const times = points.map((p) => new Date(p.recordedAt).getTime());
  const xMin = times[0];
  const xSpan = Math.max(times[times.length - 1] - xMin, 1);

  const xFor = (t: number) => PAD_LEFT + ((t - xMin) / xSpan) * plotW;
  const yFor = (temp: number) =>
    PAD_TOP + (1 - (temp - yMin) / (yMax - yMin)) * plotH;

  const coords = points.map((p, i) => ({
    x: xFor(times[i]),
    y: yFor(p.temperatureC),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const yTicks: number[] = [];
  for (let t = Math.ceil(yMin); t <= Math.floor(yMax); t++) yTicks.push(t);

  const lastIndex = points.length - 1;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Temperature trend chart"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yFor(t)}
              y2={yFor(t)}
              className="stroke-[var(--color-neutral-300)]"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 6}
              y={yFor(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-[var(--color-neutral-500)]"
              fontSize={10}
            >
              {t}
            </text>
          </g>
        ))}

        {FEVER_C >= yMin && FEVER_C <= yMax && (
          <g>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={yFor(FEVER_C)}
              y2={yFor(FEVER_C)}
              className="stroke-[var(--color-divider)]"
              strokeWidth={1}
            />
            <text
              x={WIDTH - PAD_RIGHT}
              y={yFor(FEVER_C) - 4}
              textAnchor="end"
              className="fill-[var(--color-neutral-500)]"
              fontSize={9}
            >
              Fever &ge; {FEVER_C}&deg;C
            </text>
          </g>
        )}

        <text
          x={PAD_LEFT}
          y={HEIGHT - 6}
          textAnchor="start"
          className="fill-[var(--color-neutral-500)]"
          fontSize={10}
        >
          {new Date(points[0].recordedAt).toLocaleDateString()}
        </text>
        <text
          x={WIDTH - PAD_RIGHT}
          y={HEIGHT - 6}
          textAnchor="end"
          className="fill-[var(--color-neutral-500)]"
          fontSize={10}
        >
          {new Date(points[lastIndex].recordedAt).toLocaleDateString()}
        </text>

        <path
          d={linePath}
          fill="none"
          className="stroke-[var(--color-accent-500)]"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={4}
              className="fill-[var(--color-accent-500)] stroke-[var(--color-bg)]"
              strokeWidth={2}
            />
            {/* Hit target — bigger than the mark so hover/focus is easy to land. */}
            <circle
              cx={c.x}
              cy={c.y}
              r={12}
              fill="transparent"
              tabIndex={0}
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              aria-label={`${points[i].temperatureC}°C at ${new Date(
                points[i].recordedAt
              ).toLocaleString()}`}
            />
          </g>
        ))}

        {hoveredCoord && (
          <line
            x1={hoveredCoord.x}
            x2={hoveredCoord.x}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            className="stroke-[var(--color-neutral-500)]"
            strokeWidth={1}
          />
        )}

        <text
          x={coords[lastIndex].x}
          y={coords[lastIndex].y - 10}
          textAnchor="end"
          className="fill-[var(--color-text)] font-[600]"
          fontSize={11}
        >
          {points[lastIndex].temperatureC}&deg;C
        </text>
      </svg>

      {hovered && hoveredCoord && (
        <div
          className="absolute pointer-events-none bg-[var(--color-text)] text-[var(--color-bg)] text-xs px-2 py-1 whitespace-nowrap -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(hoveredCoord.x / WIDTH) * 100}%`,
            top: `${(hoveredCoord.y / HEIGHT) * 100}%`,
          }}
        >
          <div className="font-semibold">{hovered.temperatureC}°C</div>
          <div className="text-[var(--color-neutral-400)]">
            {new Date(hovered.recordedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
