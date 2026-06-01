const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "src", "data");
const HYDRANTS_FILE = path.join(DATA_DIR, "hydrants", "hydrants.json");
const TESTS_FILE = path.join(DATA_DIR, "tests.json");
const INSPECTIONS_FILE = path.join(DATA_DIR, "inspections.json");
const PRE_FIRE_PLANS_FILE = path.join(DATA_DIR, "pre-fire-plans.json");

app.use(express.json({ limit: "10mb" }));

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function hydrantWrapper() {
  const data = readJson(HYDRANTS_FILE, { ok: true, count: 0, hydrants: [] });
  if (Array.isArray(data)) return { ok: true, count: data.length, hydrants: data };
  return { ok: true, count: (data.hydrants || []).length, ...data, hydrants: data.hydrants || [] };
}

function saveHydrants(hydrants, extra = {}) {
  writeJson(HYDRANTS_FILE, { ok: true, count: hydrants.length, hydrants, ...extra });
}

function readList(file, key) {
  const data = readJson(file, { ok: true, count: 0, [key]: [] });
  if (Array.isArray(data)) return data;
  return data[key] || [];
}

function saveList(file, key, rows) {
  writeJson(file, { ok: true, count: rows.length, [key]: rows });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findHydrantIndex(hydrants, patch) {
  const keys = [patch.original_location_id, patch.original_hydrant_id, patch.location_id, patch.hydrant_id, patch.official_hydrant_id]
    .map(normalize)
    .filter(Boolean);
  return hydrants.findIndex((h) => keys.includes(normalize(h.location_id)) || keys.includes(normalize(h.hydrant_id)) || keys.includes(normalize(h.official_hydrant_id)) || keys.includes(normalize(h.arcgis_objectid)));
}

function mergeHydrant(existing, patch) {
  const editor = {
    edited_at: new Date().toISOString(),
    edited_by: patch.edited_by || patch.tested_by || "",
    edited_shift: patch.edited_shift || patch.shift || "",
    edited_date: patch.edited_date || "",
    source: patch.edit_source || "Hydrant editor"
  };
  const merged = { ...existing, ...patch };
  if (!String(patch.location_id || "").trim()) merged.location_id = existing.location_id;
  if (!String(patch.hydrant_id || "").trim()) merged.hydrant_id = existing.hydrant_id;
  merged.edit_history = [...(Array.isArray(existing.edit_history) ? existing.edit_history : []), editor];
  merged.updated_at = new Date().toISOString();
  delete merged.original_location_id;
  delete merged.original_hydrant_id;
  delete merged.edited_by;
  delete merged.edited_shift;
  delete merged.edited_date;
  delete merged.edit_source;
  return merged;
}

function markChecked(hydrants, locationId, hydrantId, checkedAt, checkedBy, shift, source, patch = {}) {
  const idx = findHydrantIndex(hydrants, { location_id: locationId, hydrant_id: hydrantId });
  if (idx === -1) return null;
  const date = checkedAt || new Date().toISOString();
  hydrants[idx] = {
    ...hydrants[idx],
    last_checked: date.slice(0, 10),
    checked_year: date.slice(0, 4),
    checked_status: "Checked",
    checked_source: source,
    checked_by: checkedBy || hydrants[idx].checked_by || hydrants[idx].tested_by || "",
    checked_shift: shift || hydrants[idx].checked_shift || hydrants[idx].shift || "",
    ...patch,
    updated_at: new Date().toISOString()
  };
  return hydrants[idx];
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n");
}

function activityDate(row) {
  return String(row.tested_at || row.inspected_at || row.created_at || row.date || "").slice(0, 10);
}

function dailyActivity(date) {
  const tests = readList(TESTS_FILE, "tests").map((row) => ({ type: "Flow Test", ...row }));
  const inspections = readList(INSPECTIONS_FILE, "inspections").map((row) => ({ type: "Inspection", ...row }));
  return [...tests, ...inspections].filter((row) => !date || activityDate(row) === date);
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/hydrants", (req, res) => res.json(hydrantWrapper()));

app.post("/api/hydrants", (req, res) => {
  const wrapper = hydrantWrapper();
  const hydrants = wrapper.hydrants;
  const patch = req.body || {};
  const idx = findHydrantIndex(hydrants, patch);
  let saved;
  if (idx >= 0) {
    saved = mergeHydrant(hydrants[idx], patch);
    hydrants[idx] = saved;
  } else {
    saved = { ...patch, location_id: patch.location_id || patch.hydrant_id || Date.now().toString(), updated_at: new Date().toISOString() };
    hydrants.push(saved);
  }
  saveHydrants(hydrants, { merge_summary: wrapper.merge_summary });
  res.json({ ok: true, hydrant: saved });
});

app.get("/api/tests", (req, res) => {
  const tests = readList(TESTS_FILE, "tests");
  res.json({ ok: true, count: tests.length, tests });
});

app.post("/api/tests", (req, res) => {
  const tests = readList(TESTS_FILE, "tests");
  const test = { id: req.body.id || Date.now().toString(), tested_at: req.body.tested_at || new Date().toISOString(), ...req.body };
  tests.push(test);
  saveList(TESTS_FILE, "tests", tests);
  const wrapper = hydrantWrapper();
  const hydrant = markChecked(wrapper.hydrants, test.location_id, test.hydrant_id, test.tested_at, test.tested_by, test.shift, "Flow Test", {
    flow_gpm: test.flow_gpm,
    flow_result: test.flow_result,
    nfpa_class: test.nfpa_class,
    nfpa_color: test.nfpa_color,
    discharge_size: test.discharge_size,
    pitot_psi: test.pitot_psi,
    static_psi: test.static_psi,
    residual_psi: test.residual_psi,
    status: test.status
  });
  saveHydrants(wrapper.hydrants, { merge_summary: wrapper.merge_summary });
  res.json({ ok: true, test, hydrant });
});

app.get("/api/inspections", (req, res) => {
  const inspections = readList(INSPECTIONS_FILE, "inspections");
  res.json({ ok: true, count: inspections.length, inspections });
});

app.post("/api/inspections", (req, res) => {
  const inspections = readList(INSPECTIONS_FILE, "inspections");
  const inspection = { id: req.body.id || Date.now().toString(), inspected_at: req.body.inspected_at || new Date().toISOString(), ...req.body };
  inspections.push(inspection);
  saveList(INSPECTIONS_FILE, "inspections", inspections);
  const wrapper = hydrantWrapper();
  const hydrant = markChecked(wrapper.hydrants, inspection.location_id, inspection.hydrant_id, inspection.inspected_at, inspection.tested_by, inspection.shift, "Inspection");
  saveHydrants(wrapper.hydrants, { merge_summary: wrapper.merge_summary });
  res.json({ ok: true, inspection, hydrant });
});

app.get("/api/pre-fire-plans", (req, res) => {
  const plans = readList(PRE_FIRE_PLANS_FILE, "plans");
  const query = normalize(req.query.q || "");
  const filtered = query
    ? plans.filter((plan) => normalize(`${plan.address} ${plan.businessName} ${plan.occupancyType}`).includes(query))
    : plans;
  res.json({ ok: true, count: filtered.length, plans: filtered });
});

app.post("/api/pre-fire-plans", (req, res) => {
  const plans = readList(PRE_FIRE_PLANS_FILE, "plans");
  const body = req.body || {};
  const plan = { ...body, id: body.id || Date.now().toString(), updated_at: new Date().toISOString() };
  const next = [plan, ...plans.filter((item) => item.id !== plan.id)];
  saveList(PRE_FIRE_PLANS_FILE, "plans", next);
  res.json({ ok: true, plan, plans: next });
});

app.delete("/api/pre-fire-plans/:id", (req, res) => {
  const plans = readList(PRE_FIRE_PLANS_FILE, "plans");
  const next = plans.filter((plan) => plan.id !== req.params.id);
  saveList(PRE_FIRE_PLANS_FILE, "plans", next);
  res.json({ ok: true, count: next.length, plans: next });
});

app.get("/api/hydrants/export", (req, res) => {
  const rows = hydrantWrapper().hydrants;
  res.header("Content-Type", "text/csv");
  res.attachment("hydrants.csv");
  res.send(toCsv(rows));
});

app.get("/api/daily-activity/export", (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = dailyActivity(date);
  res.header("Content-Type", "text/csv");
  res.attachment(`daily-activity-${date}.csv`);
  res.send(toCsv(rows));
});

app.post("/api/daily-activity/email", async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const emails = String(req.body.emails || "").split(/[;,\n]/).map((x) => x.trim()).filter(Boolean);
  const rows = dailyActivity(date);
  const csv = toCsv(rows);
  if (!emails.length) return res.status(400).json({ ok: false, error: "At least one recipient email is required." });
  if (!process.env.SENDGRID_API_KEY) {
    return res.json({ ok: true, queued: false, message: "Email provider is not configured yet. CSV export is available.", date, recipients: emails, activityCount: rows.length });
  }
  const from = process.env.DAILY_ACTIVITY_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL;
  if (!from) return res.status(500).json({ ok: false, error: "Missing DAILY_ACTIVITY_FROM_EMAIL or SENDGRID_FROM_EMAIL." });
  const body = {
    personalizations: [{ to: emails.map((email) => ({ email })) }],
    from: { email: from },
    subject: `Horn Lake daily activity ${date}`,
    content: [{ type: "text/plain", value: `Attached is the daily activity CSV for ${date}. Records: ${rows.length}` }],
    attachments: [{ content: Buffer.from(csv).toString("base64"), filename: `daily-activity-${date}.csv`, type: "text/csv", disposition: "attachment" }]
  };
  const send = await fetch("https://api.sendgrid.com/v3/mail/send", { method: "POST", headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!send.ok) return res.status(502).json({ ok: false, error: "Email provider rejected the request." });
  res.json({ ok: true, queued: true, date, recipients: emails, activityCount: rows.length });
});

const dist = path.join(__dirname, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ ok: false, error: "Not found" });
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(PORT, () => console.log(`Dept-App listening on ${PORT}`));


