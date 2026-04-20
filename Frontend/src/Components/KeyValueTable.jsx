import React, { useMemo } from "react";

function formatValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "-";
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
      value
    );
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value.length ? value : "-";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export default function KeyValueTable({
  title = "All Values",
  data,
  excludeKeys = [],
}) {
  const rows = useMemo(() => {
    const obj = data && typeof data === "object" ? data : {};
    const excluded = new Set(excludeKeys);
    return Object.keys(obj)
      .filter((k) => !excluded.has(k))
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({ key, value: obj[key] }));
  }, [data, excludeKeys]);

  return (
    <div className="bg-[#030F0E] rounded-lg p-3">
      <div className="text-[#68BFB6] font-medium text-sm mb-2">{title}</div>
      <div
        className="overflow-auto max-h-[320px]"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#0A3D38 #0F544C",
        }}
      >
        <table className="w-full border-collapse text-[#CACCCC] text-xs xl:text-sm">
          <thead className="bg-[#051E1C] text-left sticky top-0 z-10 text-[#68BFB6]">
            <tr>
              <th className="px-3 py-2 font-medium w-1/2">Key</th>
              <th className="px-3 py-2 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="bg-[#030F0E]">
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.key} className="border-t border-[#07312D]">
                  <td className="px-3 py-2 font-mono text-[11px] xl:text-xs">
                    {r.key}
                  </td>
                  <td className="px-3 py-2 break-all">{formatValue(r.value)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-3 text-[#8A8C8C]" colSpan={2}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
