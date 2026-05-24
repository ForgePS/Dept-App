const fs = require('fs');
const file = 'src/pages/HydrantTestingPage.jsx';
let src = fs.readFileSync(file, 'utf8');

const replace = (from, to, label) => {
  if (!src.includes(from)) throw new Error(`Missing pattern: ${label}`);
  src = src.replace(from, to);
};

if (!src.includes('const crewUserOptions = [')) {
  replace(`const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "hydrants", label: "Hydrants", icon: Droplets },
  { key: "flow", label: "Flow Tests", icon: Gauge },
  { key: "inspection", label: "Inspections", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "sync", label: "Sync / Import", icon: RefreshCw },
  { key: "settings", label: "Settings", icon: Settings },
];`, `const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "hydrants", label: "Hydrants", icon: Droplets },
  { key: "flow", label: "Flow Tests", icon: Gauge },
  { key: "inspection", label: "Inspections", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "sync", label: "Sync / Import", icon: RefreshCw },
  { key: "settings", label: "Settings", icon: Settings },
];

const crewUserOptions = ["", "Field User", "John Smith", "Jeremy Powell"];`, 'add crew user options');
}

replace(`  const [crew, setCrew] = useState({ tested_by: "", shift: "A" });`, `  const [crew, setCrew] = useState({ tested_by: "", shift: "A", tested_at: todayInput() });`, 'add date to crew state');

if (!src.includes('const timer = window.setTimeout(() => setMessage(""), 3500);')) {
  replace(`  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);`, `  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);`, 'auto clear message');
}

replace(`      tested_at: todayInput(),`, `      tested_at: crew.tested_at || form.tested_at || todayInput(),`, 'preserve shared date on selection');

replace(`      body: JSON.stringify({ ...form, tested_by: crew.tested_by, shift: crew.shift }),`, `      body: JSON.stringify({ ...form, tested_by: crew.tested_by, shift: crew.shift, tested_at: crew.tested_at }),`, 'saveHydrant shared date payload');
replace(`        tested_by: crew.tested_by,
        shift: crew.shift,
        location_id: selectedHydrant?.location_id || form.location_id,`, `        tested_by: crew.tested_by,
        shift: crew.shift,
        tested_at: crew.tested_at,
        location_id: selectedHydrant?.location_id || form.location_id,`, 'saveTest shared date payload');
replace(`        inspected_at: form.tested_at,`, `        inspected_at: crew.tested_at,`, 'saveInspection shared date payload');

replace(`                <p className="text-sm text-white/70">{crew.shift || "A"} Shift</p>`, `                <p className="text-sm text-white/70">{crew.shift || "A"} Shift</p>
                <p className="text-xs text-white/50">{crew.tested_at?.slice(0, 10) || "No date"}</p>`, 'sidebar crew date');

replace(`              <Field label="Tested By" value={crew.tested_by} onChange={(value) => updateCrew("tested_by", value)} />
              <Select label="Shift" value={crew.shift} onChange={(value) => updateCrew("shift", value)} options={["A", "B", "C"]} />`, `              <Select label="User" value={crew.tested_by} onChange={(value) => updateCrew("tested_by", value)} options={crewUserOptions} />
              <Select label="Shift" value={crew.shift} onChange={(value) => updateCrew("shift", value)} options={["A", "B", "C"]} />
              <Field label="Date / Time" type="datetime-local" value={crew.tested_at} onChange={(value) => updateCrew("tested_at", value)} />`, 'dashboard shared fields');

src = src.replace(`          <Field label="Date / Time" type="datetime-local" value={form.tested_at} onChange={(value) => updateForm("tested_at", value)} />
`, '');
src = src.replace(`          <Field dark label="Inspection Date / Time" type="datetime-local" value={form.tested_at} onChange={(value) => updateForm("tested_at", value)} icon={CalendarDays} />
`, '');

replace(`            <p className="mt-1 text-sm font-bold">{crew.tested_by || "Field User"} - {crew.shift || "A"} Shift</p>`, `            <p className="mt-1 text-sm font-bold">{crew.tested_by || "Field User"} - {crew.shift || "A"} Shift</p>
            <p className="mt-1 text-xs font-semibold text-white/70">{crew.tested_at ? new Date(crew.tested_at).toLocaleString() : "No date selected"}</p>`, 'inspection crew date summary');

fs.writeFileSync(file, src);
