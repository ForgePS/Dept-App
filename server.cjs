const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { parse } = require("csv-parse/sync");

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_DIR = process.env.DATA_DIR || process.env.RENDER_DISK_PATH || path.join(__dirname, "data");
const DIST_DIR = path.join(__dirname, "dist");

const files = {
  hydrants: path.join(DATA_DIR, "hydrants.json"),
  tests: path.join(DATA_DIR, "hydrant-tests.json"),
  inspections: path.join(DATA_DIR, "hydrant-inspections.json"),
};

const seedFiles = {
  hydrants: path.join(__dirname, "src", "data", "hydrants", "hydrants.json"),
  tests: path.join(__dirname, "src", "data", "hydrants", "hydrant-tests.json"),
  inspections: path.join(__dirname, "src", "data", "hydrants", "hydrant-inspections.json"),
};

const upload = multer({ storage: multer.memoryStorage() });

const DISTRICT_BOUNDARIES = {
  hornLakeRoadLon: -90.045,
  hurtRoadLon: -90.025,
};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

function clean(value) {
  return String(value ?? "").trim();
}

function ensureFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const [key, file] of Object.entries(files)) {
    const seed = fs.existsSync(seedFiles[key]) ? fs.readFileSync(seedFiles[key], "utf8") : "[]";
    const seedRows = safeParseArray(seed);

    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, seed || "[]", "utf8");
      continue;
    }

    const existingRows = safeParseArray(fs.readFileSync(file, "utf8"));
    if (!existingRows.length && seedRows.length) {
      fs.writeFileSync(file, seed, "utf8");
    }
  }
}

function safeParseArray(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readJson(file) {
  ensureFiles();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(file, value) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function numberOrBlank(value) {
  const text = clean(value).replace('"', "");
  if (!text) return "";
  const number = Number(text);
  return Number.isFinite(number) ? number : "";
}

function calcFlowGpm(dischargeSize, pitotPsi) {
  const d = Number(dischargeSize);
  const p = Number(pitotPsi);
  if (!Number.isFinite(d) || !Number.isFinite(p) || d <= 0 || p <= 0) return "";
  return Math.round(29.83 * 0.9 * d * d * Math.sqrt(p));
}

function assignHydrantDistrict(input = {}) {
  const lon = Number(input.longitude || input.lon || input.lng);
  if (!Number.isFinite(lon)) return clean(input.district ?? input.District);
  if (lon < DISTRICT_BOUNDARIES.hornLakeRoadLon) return "3";
  if (lon < DISTRICT_BOUNDARIES.hurtRoadLon) return "1";
  return "2";
}

function normalizeStatus(value) {
  const status = clean(value).toLowerCase();
  if (status === "out of service" || status === "oos") return "Out of Service";
  if (status === "in service" || status === "available" || status === "active") return "In Service";
  return clean(value) || "In Service";
}

function normalizeHydrant(input = {}) {
  const dischargeSize = numberOrBlank(input.discharge_size ?? input["Discharge Size"]);
  const pitotPsi = numberOrBlank(input.pitot_psi ?? input["Pitot psi"]);
  const flow = calcFlowGpm(dischargeSize, pitotPsi);

  return {
    location_id: clean(input.location_id ?? input["Location ID"]),
    hydrant_id: clean(input.hydrant_id ?? input["Hydrant ID"] ?? input.id),
    district: assignHydrantDistrict(input),
    location: clean(input.location ?? input.address ?? input.Location ?? input.Address),
    address: clean(input.address ?? input.location ?? input.Address ?? input.Location),
    description: clean(input.description ?? input.Description),
    latitude: numberOrBlank(input.latitude ?? input.lat ?? input.Latitude),
    longitude: numberOrBlank(input.longitude ?? input.lon ?? input.lng ?? input.Longitude),
    provider: clean(input.provider ?? input.Provider),
    status: normalizeStatus(input.status ?? input.Status),
    discharge_size: dischargeSize,
    flow_gpm: flow || numberOrBlank(input.flow_gpm),
    pitot_psi: pitotPsi,
    static_psi: numberOrBlank(input.static_psi ?? input["Static psi"]),
    residual_psi: numberOrBlank(input.residual_psi ?? input["Residual psi"]),
    last_checked: clean(input.last_checked),
    tested_by: clean(input.tested_by),
    shift: clean(input.shift),
    issue: clean(input.issue),
    alternate_supply: clean(input.alternate_supply),
    notes: clean(input.notes ?? input.Notes),
    updated_at: new Date().toISOString(),
  };
}

function hydrantKey(hydrant) {
  return clean(hydrant.location_id || hydrant.hydrant_id);
}

function findHydrantIndex(hydrants, id) {
  return hydrants.findIndex((hydrant) => hydrantKey(hydrant) === id || clean(hydrant.hydrant_id) === id);
}

function migrateHydrantDistricts() {
  ensureFiles();
  const hydrants = safeParseArray(fs.readFileSync(files.hydrants, "utf8"));
  let changed = false;

  const updated = hydrants.map((hydrant) => {
    const district = assignHydrantDistrict(hydrant);
    if (!district || hydrant.district === district) return hydrant;
    changed = true;
    return {
      ...hydrant,
      district,
      district_source: "Road boundary assignment",
    };
  });

  if (changed) writeJson(files.hydrants, updated);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "Horn Lake Fire/EMS Dept-App", time: new Date().toISOString() });
});

app.get("/api/hydrants", (req, res) => {
  let hydrants = readJson(files.hydrants);
  const district = clean(req.query.district);
  const status = clean(req.query.status).toLowerCase();
  const q = clean(req.query.q).toLowerCase();

  hydrants = hydrants.filter((hydrant) => {
    const searchable = `${hydrant.location_id} ${hydrant.hydrant_id} ${hydrant.location} ${hydrant.address} ${hydrant.provider}`.toLowerCase();
    return (!district || district === "All" || clean(hydrant.district) === district) &&
      (!status || status === "all" || clean(hydrant.status).toLowerCase() === status) &&
      (!q || searchable.includes(q));
  });

  res.json({ ok: true, count: hydrants.length, hydrants });
});

app.post("/api/hydrants", (req, res) => {
  const hydrants = readJson(files.hydrants);
  const hydrant = normalizeHydrant(req.body);
  const key = hydrantKey(hydrant);

  if (!key) {
    return res.status(400).json({ ok: false, error: "Hydrant ID or Location ID is required." });
  }

  const index = findHydrantIndex(hydrants, key);
  if (index >= 0) hydrants[index] = { ...hydrants[index], ...hydrant };
  else hydrants.unshift(hydrant);

  writeJson(files.hydrants, hydrants);
  res.json({ ok: true, hydrant });
});

app.post("/api/hydrants/import", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, error: "CSV file is required." });

  const records = parse(req.file.buffer.toString("utf8"), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  const byKey = new Map(readJson(files.hydrants).map((hydrant) => [hydrantKey(hydrant), hydrant]));
  let imported = 0;

  for (const row of records) {
    const hydrant = normalizeHydrant(row);
    const key = hydrantKey(hydrant);
    if (!key) continue;
    byKey.set(key, { ...(byKey.get(key) || {}), ...hydrant });
    imported += 1;
  }

  const hydrants = Array.from(byKey.values());
  writeJson(files.hydrants, hydrants);
  res.json({ ok: true, imported, total: hydrants.length });
});

app.get("/api/hydrants/export", (req, res) => {
  const hydrants = readJson(files.hydrants);
  const headers = [
    "location_id", "hydrant_id", "District", "location", "description", "latitude", "longitude",
    "provider", "status", "Discharge Size", "flow_gpm", "Pitot psi", "Residual psi",
    "static_psi", "last_checked", "tested_by", "shift", "issue", "alternate_supply", "notes",
  ];
  const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = hydrants.map((h) => [
    h.location_id, h.hydrant_id, h.district, h.location, h.description, h.latitude, h.longitude,
    h.provider, h.status, h.discharge_size, h.flow_gpm, h.pitot_psi, h.residual_psi,
    h.static_psi, h.last_checked, h.tested_by, h.shift, h.issue, h.alternate_supply, h.notes,
  ]);

  const csv = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=hlfd-hydrants-export.csv");
  res.send(csv);
});

app.get("/api/tests", (req, res) => {
  const hydrantId = clean(req.query.hydrant_id);
  let tests = readJson(files.tests);
  if (hydrantId) tests = tests.filter((test) => clean(test.hydrant_id) === hydrantId || clean(test.location_id) === hydrantId);
  res.json({ ok: true, count: tests.length, tests });
});

app.post("/api/tests", (req, res) => {
  const tests = readJson(files.tests);
  const hydrants = readJson(files.hydrants);
  const dischargeSize = numberOrBlank(req.body.discharge_size);
  const pitotPsi = numberOrBlank(req.body.pitot_psi);
  const flow = calcFlowGpm(dischargeSize, pitotPsi);

  const test = {
    id: `FLOW-${Date.now()}`,
    hydrant_id: clean(req.body.hydrant_id),
    location_id: clean(req.body.location_id),
    district: clean(req.body.district),
    discharge_size: dischargeSize,
    pitot_psi: pitotPsi,
    static_psi: numberOrBlank(req.body.static_psi),
    residual_psi: numberOrBlank(req.body.residual_psi),
    flow_gpm: flow,
    status: normalizeStatus(req.body.status),
    tested_by: clean(req.body.tested_by),
    shift: clean(req.body.shift),
    notes: clean(req.body.notes),
    tested_at: clean(req.body.tested_at) || new Date().toISOString(),
  };

  tests.unshift(test);
  writeJson(files.tests, tests);

  const key = test.location_id || test.hydrant_id;
  const hydrantIndex = findHydrantIndex(hydrants, key);
  if (hydrantIndex >= 0) {
    hydrants[hydrantIndex] = {
      ...hydrants[hydrantIndex],
      district: test.district || hydrants[hydrantIndex].district,
      discharge_size: test.discharge_size,
      pitot_psi: test.pitot_psi,
      static_psi: test.static_psi,
      residual_psi: test.residual_psi,
      flow_gpm: test.flow_gpm,
      status: test.status,
      tested_by: test.tested_by,
      shift: test.shift,
      last_checked: test.tested_at.slice(0, 10),
      notes: test.notes,
      updated_at: new Date().toISOString(),
    };
    writeJson(files.hydrants, hydrants);
  }

  res.json({ ok: true, test });
});

app.get("/api/inspections", (req, res) => {
  const hydrantId = clean(req.query.hydrant_id);
  let inspections = readJson(files.inspections);
  if (hydrantId) inspections = inspections.filter((inspection) => clean(inspection.hydrant_id) === hydrantId || clean(inspection.location_id) === hydrantId);
  res.json({ ok: true, count: inspections.length, inspections });
});

app.post("/api/inspections", (req, res) => {
  const inspections = readJson(files.inspections);
  const inspection = {
    id: `INSP-${Date.now()}`,
    hydrant_id: clean(req.body.hydrant_id),
    location_id: clean(req.body.location_id),
    district: clean(req.body.district),
    status: normalizeStatus(req.body.status),
    tested_by: clean(req.body.tested_by),
    shift: clean(req.body.shift),
    notes: clean(req.body.notes),
    checklist: Array.isArray(req.body.checklist) ? req.body.checklist : [],
    inspected_at: clean(req.body.inspected_at) || new Date().toISOString(),
  };

  inspections.unshift(inspection);
  writeJson(files.inspections, inspections);
  res.json({ ok: true, inspection });
});

app.use(express.static(DIST_DIR));
app.get("*", (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  ensureFiles();
  migrateHydrantDistricts();
  console.log(`Dept-App running on port ${PORT}`);
});
