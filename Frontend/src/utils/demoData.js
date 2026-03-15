function round(value, digits = 2) {
  const m = 10 ** digits;
  return Math.round(value * m) / m;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function makeHourlySeries({
  points = 24,
  startHour = 0,
  baseUnit = 5,
  baseKwh = 120,
  baseKwTotal = 15,
} = {}) {
  const out = [];
  for (let i = 0; i < points; i += 1) {
    const hour = (startHour + i) % 24;
    const wave = Math.sin((i / Math.max(1, points - 1)) * Math.PI);
    const unit_generation = round(baseUnit * (0.25 + wave), 2);
    const kwh_reading = round(baseKwh + i * (unit_generation * 0.6), 2);
    const kw_total = round(baseKwTotal * (0.2 + wave), 2);
    out.push({
      hour,
      unit_generation,
      kwh_reading,
      kw_total,
      kw_phase1: round(kw_total / 3, 2),
      kw_phase2: round(kw_total / 3, 2),
      kw_phase3: round(kw_total / 3, 2),
      frequency: 50,
      power_factor: 0.85,
      voltagel_phase1: 410,
      voltagel_phase2: 411,
      voltagel_phase3: 409,
      current_phase1: round(clamp(kw_total * 2.2, 0, 120), 2),
      current_phase2: round(clamp(kw_total * 2.0, 0, 120), 2),
      current_phase3: round(clamp(kw_total * 2.1, 0, 120), 2),
      ts: new Date(Date.now() - (points - 1 - i) * 60 * 60 * 1000).toISOString(),
    });
  }
  return out;
}

export const demoSolarLive = {
  breaker_status: "ON",
  updated_at: new Date().toISOString(),
  kwh: 123.45,
  unit_generated: 7.2,
  frequency: 50,
  power_factor: 0.86,
  operating_hours: 12.5,
  hours_operated: 12.5,
  voltagel_phase1: 410,
  voltagel_phase2: 411,
  voltagel_phase3: 412,
  voltagen_phase1: 230,
  voltagen_phase2: 231,
  voltagen_phase3: 229,
  current_phase1: 34.2,
  current_phase2: 33.9,
  current_phase3: 34.5,
  kw_phase1: 4.8,
  kw_phase2: 4.7,
  kw_phase3: 4.9,
};

export const demoGensetLive = {
  breaker_status: "ON",
  updated_at: new Date().toISOString(),
  kwh: 456.78,
  unit_generated: 5.6,
  frequency: 50,
  power_factor: 0.81,
  operating_hours: 9.25,
  hours_operated: 9.25,
  voltagel_phase1: 408,
  voltagel_phase2: 410,
  voltagel_phase3: 409,
  voltagen_phase1: 229,
  voltagen_phase2: 230,
  voltagen_phase3: 228,
  current_phase1: 41.3,
  current_phase2: 40.1,
  current_phase3: 42.0,
  kw_phase1: 6.0,
  kw_phase2: 5.8,
  kw_phase3: 6.2,
  fuel_level: 62,
  coolant_temp: 78,
  oil_pressure: 3.1,
  battery_charged: 12.6,
};

export const demoMainsLatest = {
  updated_at: new Date().toISOString(),
  kwh: 987.65,
  unit_generated: 8.4,
  frequency: 50,
  power_factor: 0.92,
  operating_hours: 18.1,
  hours_operated: 18.1,
  voltagel_phase1: 412,
  voltagel_phase2: 411,
  voltagel_phase3: 413,
  voltagen_phase1: 231,
  voltagen_phase2: 230,
  voltagen_phase3: 232,
  current_phase1: 28.2,
  current_phase2: 27.9,
  current_phase3: 28.4,
  kw_phase1: 3.9,
  kw_phase2: 3.8,
  kw_phase3: 4.0,
};

export const demoOverview = {
  solar: { avg_total_generation: 120.5, ...demoSolarLive },
  genset: { avg_total_generation: 80.25, ...demoGensetLive },
  mains: { avg_total_generation: 160.75, ...demoMainsLatest },
  average: [],
  alert: { alert: 3, shutdown: 1 },
};

