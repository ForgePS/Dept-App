const fs = require("fs");

function replaceOnce(text, before, after) {
  if (!text.includes(before)) throw new Error(`Expected block not found:\n${before}`);
  return text.replace(before, after);
}

let server = fs.readFileSync("server.cjs", "utf8");

server = replaceOnce(server,
`const DIST_DIR = path.join(__dirname, "dist");`,
`const DIST_DIR = path.join(__dirname, "dist");
const DAILY_ACTIVITY_EMAILS = (process.env.DAILY_ACTIVITY_EMAILS || "").split(/[;,]/).map((email) => email.trim()).filter(Boolean);
const DAILY_ACTIVITY_ALLOWED_EMAILS = (process.env.DAILY_ACTIVITY_ALLOWED_EMAILS || "").split(/[;,]/).map((email) => email.trim().toLowerCase()).filter(Boolean);`
);

server = replaceOnce(server,
`function calcFlowGpm(dischargeSize, pitotPsi) {
  const d = Number(dischargeSize);
  const p = Number(pitotPsi);
  if (!Number.isFinite(d) || !Number.isFinite(p) || d <= 0 || p <= 0) return "";
  return Math.round(29.83 * 0.9 * d * d * Math.sqrt(p));
}`,
`function calcFlowGpm(dischargeSize, pitotPsi) {
  const d = Number(dischargeSize);
  const p = Number(pitotPsi);
  if (!Number.isFinite(d) || !Number.isFinite(p) || d <= 0 || p <= 0) return "";
  return Math.round(29.83 * 0.9 * d * d * Math.sqrt(p));
}

function escapeCsv(value) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}

function buildCsv(headers, rows) {
  return [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\\n");
}

function activityDateValue(activity = {}) {
  return clean(activity.tested_at || activity.inspected_at || activity.updated_at || activity.created_at);
}

function matchesActivityDate(activity, date) {
  const value = activityDateValue(activity);
  return value ? value.slice(0, 10) === date : false;
}

function checklistSummary(checklist) {
  if (!Array.isArray(checklist) || !checklist.length) return "";
  return checklist.map((row) => `${clean(row.item)}: ${clean(row.result) || "No result"}${clean(row.repair_needed) === "Yes" ? " (repair needed)" : ""}`).join("; ");
}

function dailyActivity(date) {
  const tests = readJson(files.tests).filter((test) => matchesActivityDate(test, date));
  const inspections = readJson(files.inspections).filter((inspection) => matchesActivityDate(inspection, date));
  const headers = [
    "activity_type", "activity_id", "hydrant_id", "location_id", "district", "status", "tested_by", "shift",
    "date_time", "flow_gpm", "pitot_psi", "static_psi", "residual_psi", "notes", "checklist_summary",
  ];
  const rows = [
    ...tests.map((test) => [
      "Flow Test", test.id, test.hydrant_id, test.location_id, test.district, test.status, test.tested_by, test.shift,
      activityDateValue(test), test.flow_gpm, test.pitot_psi, test.static_psi, test.residual_psi, test.notes, "",
    ]),
    ...inspections.map((inspection) => [
      "Inspection", inspection.id, inspection.hydrant_id, inspection.location_id, inspection.district, inspection.status, inspection.tested_by, inspection.shift,
      activityDateValue(inspection), "", "", "", "", inspection.notes, checklistSummary(inspection.checklist),
    ]),
  ];

  rows.sort((a, b) => String(a[8]).localeCompare(String(b[8])));
  return { headers, rows, tests, inspections };
}

function normalizeEmailList(value) {
  const raw = Array.isArray(value) ? value.join(",") : clean(value);
  const emails = (raw ? raw.split(/[;,]/) : DAILY_ACTIVITY_EMAILS).map((email) => email.trim()).filter(Boolean);
  const unique = [...new Set(emails)];
  const invalid = unique.filter((email) => !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email));
  if (invalid.length) throw new Error(`Invalid email address: ${invalid.join(", ")}`);
  if (DAILY_ACTIVITY_ALLOWED_EMAILS.length) {
    const blocked = unique.filter((email) => !DAILY_ACTIVITY_ALLOWED_EMAILS.includes(email.toLowerCase()));
    if (blocked.length) throw new Error(`Email recipient is not allowed: ${blocked.join(", ")}`);
  }
  return unique;
}

async function sendDailyActivityEmail({ date, emails, csv, activityCount }) {
  const apiKey = clean(process.env.SENDGRID_API_KEY);
  const from = clean(process.env.DAILY_ACTIVITY_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL);
  if (!apiKey || !from) {
    throw new Error("Email is not configured. Set SENDGRID_API_KEY and DAILY_ACTIVITY_FROM_EMAIL in Render.");
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: emails.map((email) => ({ email })) }],
      from: { email: from },
      subject: `HLFD daily hydrant activity - ${date}`,
      content: [{ type: "text/plain", value: `Attached is the HLFD hydrant daily activity CSV for ${date}. Records: ${activityCount}.` }],
      attachments: [{
        content: Buffer.from(csv).toString("base64"),
        filename: `hlfd-daily-activity-${date}.csv`,
        type: "text/csv",
        disposition: "attachment",
      }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email service rejected the request (${response.status}): ${detail}`);
  }
}

function markHydrantChecked(hydrants, key, checkedAt, checkedBy, shift, source) {
  const hydrantIndex = findHydrantIndex(hydrants, key);
  if (hydrantIndex < 0) return false;
  const checkedDate = clean(checkedAt) || new Date().toISOString();
  hydrants[hydrantIndex] = {
    ...hydrants[hydrantIndex],
    last_checked: checkedDate.slice(0, 10),
    checked_year: checkedDate.slice(0, 4),
    checked_status: "Checked",
    checked_source: source,
    checked_by: clean(checkedBy),
    checked_shift: clean(shift),
    updated_at: new Date().toISOString(),
  };
  return true;
}`
);

server = replaceOnce(server,
`  const hydrantIndex = findHydrantIndex(hydrants, key);
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
  }`,
`  const hydrantIndex = findHydrantIndex(hydrants, key);
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
      checked_year: test.tested_at.slice(0, 4),
      checked_status: "Checked",
      checked_source: "Flow Test",
      checked_by: test.tested_by,
      checked_shift: test.shift,
      notes: test.notes,
      updated_at: new Date().toISOString(),
    };
    writeJson(files.hydrants, hydrants);
  }`
);

server = replaceOnce(server,
`app.get("/api/hydrants/export", (req, res) => {
  const hydrants = readJson(files.hydrants);
  const headers = [
    "location_id", "hydrant_id", "District", "location", "description", "latitude", "longitude",
    "provider", "status", "Discharge Size", "flow_gpm", "Pitot psi", "Residual psi",
    "static_psi", "last_checked", "tested_by", "shift", "issue", "alternate_supply", "notes",
  ];
  const escapeCsv = (value) => ` + "`\"${String(value ?? \"\").replaceAll('\\\"', '\\\"\\\"')}\"`" + `;
  const rows = hydrants.map((h) => [
    h.location_id, h.hydrant_id, h.district, h.location, h.description, h.latitude, h.longitude,
    h.provider, h.status, h.discharge_size, h.flow_gpm, h.pitot_psi, h.residual_psi,
    h.static_psi, h.last_checked, h.tested_by, h.shift, h.issue, h.alternate_supply, h.notes,
  ]);

  const csv = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=hlfd-hydrants-export.csv");
  res.send(csv);
});`,
`app.get("/api/hydrants/export", (req, res) => {
  const hydrants = readJson(files.hydrants);
  const headers = [
    "location_id", "hydrant_id", "District", "location", "description", "latitude", "longitude",
    "provider", "status", "Discharge Size", "flow_gpm", "Pitot psi", "Residual psi",
    "static_psi", "last_checked", "checked_year", "checked_status", "checked_source", "checked_by", "tested_by", "shift", "issue", "alternate_supply", "notes",
  ];
  const rows = hydrants.map((h) => [
    h.location_id, h.hydrant_id, h.district, h.location, h.description, h.latitude, h.longitude,
    h.provider, h.status, h.discharge_size, h.flow_gpm, h.pitot_psi, h.residual_psi,
    h.static_psi, h.last_checked, h.checked_year, h.checked_status, h.checked_source, h.checked_by, h.tested_by, h.shift, h.issue, h.alternate_supply, h.notes,
  ]);

  const csv = buildCsv(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=hlfd-hydrants-export.csv");
  res.send(csv);
});

app.get("/api/daily-activity/export", (req, res) => {
  const date = clean(req.query.date) || new Date().toISOString().slice(0, 10);
  const { headers, rows } = dailyActivity(date);
  const csv = buildCsv(headers, rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=hlfd-daily-activity-${date}.csv`);
  res.send(csv);
});

app.post("/api/daily-activity/email", async (req, res) => {
  try {
    const date = clean(req.body.date) || new Date().toISOString().slice(0, 10);
    const emails = normalizeEmailList(req.body.emails);
    if (!emails.length) return res.status(400).json({ ok: false, error: "At least one recipient email is required." });

    const { headers, rows } = dailyActivity(date);
    const csv = buildCsv(headers, rows);
    await sendDailyActivityEmail({ date, emails, csv, activityCount: rows.length });
    res.json({ ok: true, sent_to: emails, count: rows.length, date });
  } catch (error) {
    const status = /configured|Invalid|allowed|required/.test(error.message) ? 400 : 500;
    res.status(status).json({ ok: false, error: error.message });
  }
});`
);

server = replaceOnce(server,
`app.post("/api/inspections", (req, res) => {
  const inspections = readJson(files.inspections);
  const inspection = {`,
`app.post("/api/inspections", (req, res) => {
  const inspections = readJson(files.inspections);
  const hydrants = readJson(files.hydrants);
  const inspection = {`
);

server = replaceOnce(server,
`  inspections.unshift(inspection);
  writeJson(files.inspections, inspections);
  res.json({ ok: true, inspection });
});`,
`  inspections.unshift(inspection);
  writeJson(files.inspections, inspections);

  const key = inspection.location_id || inspection.hydrant_id;
  if (markHydrantChecked(hydrants, key, inspection.inspected_at, inspection.tested_by, inspection.shift, "Inspection")) {
    writeJson(files.hydrants, hydrants);
  }

  res.json({ ok: true, inspection });
});`
);

fs.writeFileSync("server.cjs", server);

let page = fs.readFileSync("src/pages/HydrantTestingPage.jsx", "utf8");
page = replaceOnce(page, `  Download,\n  Droplets,`, `  Download,\n  Droplets,\n  Mail,`);

page = replaceOnce(page,
`const getHydrantPosition = (hydrant) => {
  if (!hydrant) return null;
  const lat = Number(hydrant.latitude || hydrant.lat);
  const lon = Number(hydrant.longitude || hydrant.lon || hydrant.lng);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
};`,
`const getHydrantPosition = (hydrant) => {
  if (!hydrant) return null;
  const lat = Number(hydrant.latitude || hydrant.lat);
  const lon = Number(hydrant.longitude || hydrant.lon || hydrant.lng);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
};

const currentCheckYear = () => String(new Date().getFullYear());

const isHydrantCheckedThisYear = (hydrant = {}) => {
  const year = currentCheckYear();
  return String(hydrant.checked_year || "") === year || String(hydrant.last_checked || "").slice(0, 4) === year;
};

const hydrantCheckLabel = (hydrant = {}) => isHydrantCheckedThisYear(hydrant) ? `Checked ${currentCheckYear()}` : `Due ${currentCheckYear()}`;`
);

page = replaceOnce(page,
`    tests: tests.length,
  }), [hydrants, tests]);`,
`    tests: tests.length,
    checkedThisYear: hydrants.filter(isHydrantCheckedThisYear).length,
  }), [hydrants, tests]);`
);

page = replaceOnce(page,
`        <Metric icon={Gauge} label="Tests This Year" value={stats.tests} tone="blue" />`,
`        <Metric icon={ClipboardList} label="Checked This Year" value={stats.checkedThisYear} tone="blue" />`
);

page = replaceOnce(page,
`        <Panel title="Reports" subtitle="Export hydrant, testing, and inspection activity.">
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <ReportCard label="Hydrants" value={hydrants.length} href="/api/hydrants/export" />
            <ReportCard label="Flow Tests" value={tests.length} />
            <ReportCard label="Inspections" value={inspections.length} />
          </div>
        </Panel>`,
`        <div className="grid gap-5">
          <Panel title="Reports" subtitle="Export hydrant, testing, and inspection activity.">
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <ReportCard label="Hydrants" value={hydrants.length} href="/api/hydrants/export" />
              <ReportCard label="Flow Tests" value={tests.length} />
              <ReportCard label="Inspections" value={inspections.length} />
            </div>
          </Panel>
          <DailyActivityEmailPanel />
        </div>`
);

page = replaceOnce(page,
`                    <span className="block text-xs text-slate-500">District {hydrant.district || "-"}</span>`,
`                    <span className="block text-xs text-slate-500">District {hydrant.district || "-"}</span>
                    <span className={\`mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-black uppercase \${isHydrantCheckedThisYear(hydrant) ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-800"}\`}>
                      {hydrantCheckLabel(hydrant)}
                    </span>`
);

page = replaceOnce(page,
`                  <dt className="font-bold text-slate-500">Status</dt><dd>{hydrant.status || "In Service"}</dd>
                  <dt className="font-bold text-slate-500">Lat/Lon</dt><dd>{position[0].toFixed(6)}, {position[1].toFixed(6)}</dd>`,
`                  <dt className="font-bold text-slate-500">Status</dt><dd>{hydrant.status || "In Service"}</dd>
                  <dt className="font-bold text-slate-500">Year Check</dt><dd>{hydrantCheckLabel(hydrant)}</dd>
                  <dt className="font-bold text-slate-500">Lat/Lon</dt><dd>{position[0].toFixed(6)}, {position[1].toFixed(6)}</dd>`
);

page = replaceOnce(page,
`          <InfoLine label="Status" value={hydrant?.status || "In Service"} />
          <InfoLine label="Latitude / Longitude" value={selectedPosition ? `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}` : "No GPS"} />`,
`          <InfoLine label="Status" value={hydrant?.status || "In Service"} />
          <InfoLine label="Year Check" value={hydrantCheckLabel(hydrant)} />
          <InfoLine label="Latitude / Longitude" value={selectedPosition ? `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}` : "No GPS"} />`
);

page = replaceOnce(page,
`function ReportCard({ label, value, href }) {`,
`function DailyActivityEmailPanel() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const exportHref = `/api/daily-activity/export?date=${encodeURIComponent(date)}`;

  const sendEmail = async () => {
    setSending(true);
    setResult("");
    try {
      const response = await api("/api/daily-activity/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, emails }),
      });
      setResult(`Sent ${response.count} daily activity records to ${response.sent_to.join(", ")}.`);
    } catch (error) {
      setResult(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Panel title="Daily Activity CSV" subtitle="Download or email flow tests and inspections for a selected date.">
      <div className="grid gap-4 p-5 lg:grid-cols-[220px_1fr_auto_auto] lg:items-end">
        <Field label="Activity Date" type="date" value={date} onChange={setDate} icon={CalendarDays} />
        <label className="grid gap-2">
          <span className="text-sm font-bold text-slate-950">Email Recipients</span>
          <textarea
            value={emails}
            onChange={(event) => setEmails(event.target.value)}
            className="hydrant-input min-h-11 resize-y"
            placeholder="chief@example.com, training@example.com"
          />
        </label>
        <a href={exportHref} className="inline-flex min-h-11 items-center justify-center gap-3 rounded-md border border-red-500 bg-white px-5 text-sm font-black text-red-700 hover:bg-red-50">
          <Download className="h-5 w-5" />
          Download CSV
        </a>
        <button type="button" onClick={sendEmail} disabled={sending} className="inline-flex min-h-11 items-center justify-center gap-3 rounded-md border border-red-700 bg-red-700 px-5 text-sm font-black text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
          <Mail className="h-5 w-5" />
          {sending ? "Sending..." : "Email CSV"}
        </button>
        {result && <p className="text-sm font-bold text-slate-700 lg:col-span-4">{result}</p>}
      </div>
    </Panel>
  );
}

function ReportCard({ label, value, href }) {`
);

fs.writeFileSync("src/pages/HydrantTestingPage.jsx", page);
