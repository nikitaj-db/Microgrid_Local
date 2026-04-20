import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { FORCE_ZERO_GRAPHS } from "../utils/graphOverrides";

function isPlottableNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function toLabel(point, xKey) {
  if (!point || typeof point !== "object") return "";
  const x = point[xKey];
  if (xKey === "hour" && (typeof x === "number" || typeof x === "string")) {
    return `${x}:00`;
  }
  if (xKey === "ts" && typeof x === "string") {
    const d = new Date(x);
    if (!Number.isNaN(d.getTime())) return d.toLocaleTimeString();
  }
  return x != null ? String(x) : "";
}

export default function MetricLineChart({
  title = "Trends",
  series = [],
  defaultMetric,
  xKey = "hour",
  height = 260,
  metrics,
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }),
    []
  );

  const formatNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? numberFormatter.format(num) : "";
  };

  const derivedMetrics = useMemo(() => {
    if (Array.isArray(metrics) && metrics.length) return metrics;
    const first = Array.isArray(series) && series.length ? series[0] : null;
    if (!first || typeof first !== "object") return [];
    return Object.keys(first)
      .filter((k) => !["ts", "hour"].includes(k))
      .filter((k) => series.some((p) => isPlottableNumber(p?.[k])))
      .sort((a, b) => a.localeCompare(b));
  }, [series, metrics]);

  const [metric, setMetric] = useState(
    defaultMetric && derivedMetrics.includes(defaultMetric)
      ? defaultMetric
      : derivedMetrics[0] || ""
  );

  useEffect(() => {
    if (!metric && derivedMetrics[0]) setMetric(derivedMetrics[0]);
  }, [derivedMetrics, metric]);

  const labels = useMemo(
    () => (Array.isArray(series) ? series.map((p) => toLabel(p, xKey)) : []),
    [series, xKey]
  );

  const values = useMemo(() => {
    if (!Array.isArray(series) || !metric) return [];
    return series.map((p) => (isPlottableNumber(p?.[metric]) ? p[metric] : null));
  }, [series, metric]);

  const plottedValues = useMemo(() => {
    if (!FORCE_ZERO_GRAPHS) return values;
    return labels.map(() => 0);
  }, [labels, values]);

  const ySuggestedMax = useMemo(() => {
    const nums = plottedValues.filter(isPlottableNumber);
    if (!nums.length) return 1;
    const max = Math.max(...nums);
    return max > 0 ? max : 1;
  }, [plottedValues]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: metric || "metric",
            data: plottedValues,
            borderColor: "#68BFB6",
            backgroundColor: "rgba(104, 191, 182, 0.12)",
            pointRadius: 1,
            tension: 0,
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (ctx) => formatNumber(ctx.parsed?.y),
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#CACCCC", maxRotation: 0 },
            grid: { color: "rgba(255,255,255,0.06)" },
          },
          y: {
            min: 0,
            suggestedMax: ySuggestedMax,
            ticks: {
              color: "#CACCCC",
              callback: (v) => formatNumber(v),
            },
            grid: { color: "rgba(255,255,255,0.06)" },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
    };
  }, [labels, plottedValues, metric, ySuggestedMax]);

  return (
    <div className="bg-[#030F0E] rounded-lg p-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="text-[#68BFB6] font-medium text-sm">{title}</div>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="bg-[#051E1C] text-[#CACCCC] text-xs xl:text-sm rounded px-2 py-1 border border-[#07312D] outline-none"
          disabled={!derivedMetrics.length}
        >
          {derivedMetrics.length ? (
            derivedMetrics.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))
          ) : (
            <option value="">No metrics</option>
          )}
        </select>
      </div>
      <div style={{ height }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
