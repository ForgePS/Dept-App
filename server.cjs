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
  hornLakeRoadLon: -90.0626,
  hurtRoadLon: -90.035423,
};

const REMOVED_HYDRANT_IDS = new Set(["31467973"]);
const MANUAL_DISTRICT_3_HYDRANT_IDS = new Set([
  "31469169", "31469154", "31468989", "31468987", "31468986", "31468991", "31468980", "31468982", "31468979", "31468961", "31468959", "31468958", "31468960", "31468953", "31468954", "31468952", "31468945", "31468948", "31468944", "31469040", "31468909", "31468910", "31468908", "31468907", "31469034", "31469033", "31469032",
  "31469153", "31468906", "31468891", "31468890", "31468889", "31468888", "31468887", "31468886",
]);

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

function hydrantIds(hydrant = {}) {
  return [clean(hydrant.location_id), clean(hydrant.hydrant_id)].filter(Boolean);
}

function hasHydrantId(hydrant, ids) {
  return hydrantIds(hydrant).some((id) => ids.has(id));
}

function applyManualHydrantCorrections(hydrants) {
  let changed = false;
  const corrected = [];

  for (const hydrant of hydrants) {
    if (hasHydrantId(hydrant, REMOVED_HYDRANT_IDS)) {
      changed = true;
      continue;
    }

    if (hasHydrantId(hydrant, MANUAL_DISTRICT_3_HYDRANT_IDS)) {
      const nextHydrant = {
        ...hydrant,
        district: "3",
        district_source: "Manual",
      };
      if (hydrant.district !== "3" || hydrant.district_source !== "Manual") changed = true;
      corrected.push(nextHydrant);
      continue;
    }

    corrected.push(hydrant);
  }

  return { hydrants: corrected, changed };
}

function readJson(file) {
  ensureFiles();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(parsed)) return [];

    if (file === files.hydrants) {
      const { hydrants, changed } = applyManualHydrantCorrections(parsed);
      if (changed) fs.writeFileSync(file, JSON.stringify(hydrants, null, 2), "utf8");
      return hydrants;
    }

    return parsed;
  } catch {
    return [];
  }
}

function writeJson(file, value) {
  ensureFiles();
  const nextValue = file === files.hydrants ? applyManualHydrantCorrections(value).hydrants : value;
  fs.writeFileSync(file, JSON.stringify(nextValue, null, 2), "utf8");
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
  const explicitDistrict = clean(input.district ?? input.District);
  const assignedDistrict = assignHydrantDistrict(input);

  return {
    location_id: clean(input.location_id ?? input["Location ID"]),
    hydrant_id: clean(input.hydrant_id ?? input["Hydrant ID"] ?? input.id),
    district: explicitDistrict || assignedDistrict,
    district_source: explicitDistrict ? "Manual" : "Road boundary assignment",
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

function sameHydrantCoordinates(a = {}, b = {}) {
  const aLat = clean(a.latitude || a.lat);
  const aLon = clean(a.longitude || a.lon || a.lng);
  const bLat = clean(b.latitude || b.lat);
  const bLon = clean(b.longitude || b.lon || b.lng);
  return aLat && aLon && aLat === bLat && aLon === bLon;
}

function findHydrantIndex(hydrants, id) {
  return hydrants.findIndex((hydrant) => hydrantKey(hydrant) === id || clean(hydrant.hydrant_id) === id);
}

function findHydrantIndexForUpdate(hydrants, input, normalizedHydrant) {
  const lookupKeys = [
    hydrantKey(normalizedHydrant),
    clean(input.original_location_id),
    clean(input.original_hydrant_id),
  ].filter(Boolean);

  for (const key of lookupKeys) {
    const index = findHydrantIndex(hydrants, key);
    if (index >= 0) return index;
  }

  return hydrants.findIndex((hydrant) => sameHydrantCoordinates(hydrant, input));
}

function mergeHydrant(existing, incoming) {
  return {
    ...existing,
    ...incoming,
    location_id: incoming.location_id || existing.location_id,
    hydrant_id: incoming.hydrant_id || existing.hydrant_id,
  };
}

function migrateHydrantDistricts() {
  ensureFiles();
  const hydrants = safeParseArray(fs.readFileSync(files.hydrants, "utf8"));
  let changed = false;

  const updated = hydrants.map((hydrant) => {
    const district = assignHydrantDistrict(hydrant);
    const shouldAutoUpdate =
      !clean(hydrant.district) ||
      !clean(hydrant.district_source) ||
      hydrant.district_source === "Road boundary assignment";

    if (!district || !shouldAutoUpdate || hydrant.district === district) return hydrant;
    changed = true;
    return {
      ...hydrant,
      district,
      district_source: "Road boundary assignment",
    };
  });

  const manualCorrections = applyManualHydrantCorrections(updated);
  if (manualCorrections.changed) changed = true;
  if (changed) writeJson(files.hydrants, manualCorrections.hydrants);
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

  if (!key && !clean(req.body.original_location_id) && !clean(req.body.original_hydrant_id)) {
    return res.status(400).json({ ok: false, error: "Hydrant ID or Location ID is required." });
  }

  const index = findHydrantIndexForUpdate(hydrants, req.body, hydrant);
  let savedHydrant;

  if (index >= 0) {
    savedHydrant = mergeHydrant(hydrants[index], hydrant);
    hydrants[index] = savedHydrant;
  } else {
    savedHydrant = hydrant;
    hydrants.unshift(savedHydrant);
  }

  writeJson(files.hydrants, hydrants);
  res.json({ ok: true, hydrant: savedHydrant });
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
  res.json({ ok: true, imported, total: readJson(files.hydrants).length });
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
