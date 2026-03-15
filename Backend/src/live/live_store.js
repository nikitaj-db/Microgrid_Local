const state = {
  solar: null,
  genset: null,
  solar_series: [],
  genset_series: [],
};

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSeriesNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function normalizeDevicePayload(device, payload) {
  // Accept either direct flat payload or controller envelope: { status, data }.
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  const base = data && typeof data === "object" ? data : {};

  const mapped = {
    // Common energy/power
    kwh: pick(base, ["kwh", "kilowatt_hour", "kilowattHour"]),
    frequency: pick(base, ["frequency", "hz"]),
    power_factor: pick(base, ["power_factor", "powerFactor"]),
    unit_generated: pick(base, ["unit_generated", "unit_generation"]),

    // Hours
    operating_hours: pick(base, ["operating_hours", "running_time", "runningTime"]),
    hours_operated: pick(base, ["hours_operated", "running_time", "runningTime"]),

    // Phase voltages (L-L): support a few likely controller keys
    voltagel_phase1: pick(base, ["voltagel_phase1", "main_voltage_ry"]) ?? base?.voltage?.ry,
    voltagel_phase2: pick(base, ["voltagel_phase2", "main_voltage_yb"]) ?? base?.voltage?.yb,
    voltagel_phase3: pick(base, ["voltagel_phase3", "main_voltage_rb"]) ?? base?.voltage?.rb,

    // Phase voltages (L-N)
    voltagen_phase1: pick(base, ["voltagen_phase1", "avg_voltage_pn"]) ?? 0,
    voltagen_phase2: pick(base, ["voltagen_phase2", "avg_voltage_pn"]) ?? 0,
    voltagen_phase3: pick(base, ["voltagen_phase3", "avg_voltage_pn"]) ?? 0,

    // Phase currents
    current_phase1: pick(base, ["current_phase1", "alternator_current"]) ?? base?.current?.r,
    current_phase2: pick(base, ["current_phase2", "alternator_current"]) ?? base?.current?.y,
    current_phase3: pick(base, ["current_phase3", "alternator_current"]) ?? base?.current?.b,

    // Phase kW
    kw_phase1:
      pick(base, ["kw_phase1"]) ??
      base?.active_power?.ry ??
      pick(base, ["avg_kw"]) ??
      (pick(base, ["total_kw"]) !== undefined ? normalizeNumber(base.total_kw) / 3 : 0),
    kw_phase2:
      pick(base, ["kw_phase2"]) ??
      base?.active_power?.yb ??
      pick(base, ["avg_kw"]) ??
      (pick(base, ["total_kw"]) !== undefined ? normalizeNumber(base.total_kw) / 3 : 0),
    kw_phase3:
      pick(base, ["kw_phase3"]) ??
      base?.active_power?.rb ??
      pick(base, ["avg_kw"]) ??
      (pick(base, ["total_kw"]) !== undefined ? normalizeNumber(base.total_kw) / 3 : 0),

    // Some genset-specific fields used in UI
    fuel_level: pick(base, ["fuel_level"]),
    coolant_temp: pick(base, ["coolant_temp", "coolant_temperature"]),
    oil_pressure: pick(base, ["oil_pressure", "lube_oil_pressure"]),
    battery_charged: pick(base, ["battery_charged", "battery_voltage"]),
  };

  // Keep original keys too, but mapped keys win for the UI.
  const normalized = { ...base, ...mapped };

  // Ensure numeric fields are numbers where the UI compares them.
  for (const k of [
    "kwh",
    "frequency",
    "power_factor",
    "unit_generated",
    "operating_hours",
    "hours_operated",
    "voltagel_phase1",
    "voltagel_phase2",
    "voltagel_phase3",
    "voltagen_phase1",
    "voltagen_phase2",
    "voltagen_phase3",
    "current_phase1",
    "current_phase2",
    "current_phase3",
    "kw_phase1",
    "kw_phase2",
    "kw_phase3",
    "fuel_level",
  ]) {
    if (normalized[k] !== undefined && normalized[k] !== null) {
      normalized[k] = normalizeNumber(normalized[k]);
    }
  }

  if (device === "solar" && normalized.breaker_status == null) {
    normalized.breaker_status = "OFF";
  }

  return normalized;
}

function pushSeries(device, payload) {
  const now = new Date();
  const kw1 = normalizeSeriesNumber(payload?.kw_phase1);
  const kw2 = normalizeSeriesNumber(payload?.kw_phase2);
  const kw3 = normalizeSeriesNumber(payload?.kw_phase3);
  const kwTotal =
    kw1 == null && kw2 == null && kw3 == null
      ? null
      : (kw1 ?? 0) + (kw2 ?? 0) + (kw3 ?? 0);

  const point = {
    hour: now.getHours(),
    kwh_reading: normalizeNumber(payload?.kwh),
    unit_generation: normalizeNumber(payload?.unit_generated ?? payload?.unit_generation),
    ts: now.toISOString(),

    frequency: normalizeSeriesNumber(payload?.frequency),
    power_factor: normalizeSeriesNumber(payload?.power_factor),
    operating_hours: normalizeSeriesNumber(payload?.operating_hours),

    voltagel_phase1: normalizeSeriesNumber(payload?.voltagel_phase1),
    voltagel_phase2: normalizeSeriesNumber(payload?.voltagel_phase2),
    voltagel_phase3: normalizeSeriesNumber(payload?.voltagel_phase3),

    voltagen_phase1: normalizeSeriesNumber(payload?.voltagen_phase1),
    voltagen_phase2: normalizeSeriesNumber(payload?.voltagen_phase2),
    voltagen_phase3: normalizeSeriesNumber(payload?.voltagen_phase3),

    current_phase1: normalizeSeriesNumber(payload?.current_phase1),
    current_phase2: normalizeSeriesNumber(payload?.current_phase2),
    current_phase3: normalizeSeriesNumber(payload?.current_phase3),

    kw_phase1: kw1,
    kw_phase2: kw2,
    kw_phase3: kw3,
    kw_total: kwTotal,

    fuel_level: normalizeSeriesNumber(payload?.fuel_level),
    coolant_temp: normalizeSeriesNumber(payload?.coolant_temp),
    oil_pressure: normalizeSeriesNumber(payload?.oil_pressure),
    battery_charged: normalizeSeriesNumber(payload?.battery_charged),
  };

  const key = device === "solar" ? "solar_series" : "genset_series";
  state[key].push(point);

  // Keep only the most recent 200 points.
  if (state[key].length > 200) state[key].splice(0, state[key].length - 200);
}

function update(device, payload) {
  if (device !== "solar" && device !== "genset") return;
  const now = new Date().toISOString();
  const normalized = normalizeDevicePayload(device, payload);
  state[device] = { ...normalized, updated_at: now };
  pushSeries(device, state[device]);
}

function get(device) {
  if (device !== "solar" && device !== "genset") return null;
  return state[device];
}

function series(device) {
  if (device !== "solar" && device !== "genset") return [];
  return state[device === "solar" ? "solar_series" : "genset_series"];
}

module.exports = { update, get, series };
