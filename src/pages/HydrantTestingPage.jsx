import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  Download,
  Droplets,
  FileText,
  Filter,
  Gauge,
  Home,
  ListChecks,
  MapPin,
  RefreshCw,
  Save,
  Search,
  Settings,
  Wrench,
} from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "hydrants", label: "Hydrants", icon: Droplets },
  { key: "flow", label: "Flow Tests", icon: Gauge },
  { key: "inspection", label: "Inspections", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "sync", label: "Sync / Import", icon: RefreshCw },
  { key: "settings", label: "Settings", icon: Settings },
];

const checklistItems = [
  ["No Obstructions", "Area clear and accessible."],
  ["Operable (Turns Open/Closed)", "Operated smoothly."],
  ["Caps Present", "All caps present."],
  ["Threads in Good Condition", "Threads clean and intact."],
  ["Tag Attached & Readable", "Tag attached and readable."],
  ["Oil Nut Provided", "Oil nut in place."],
  ["Barrel Drains Properly", "Drains as expected."],
  ["Leaks (Valve / Caps / Barrel)", "No leaks detected."],
  ["Paint / Reflective Visible", "Paint good, reflector visible."],
  ["Steamer Port / Pumper Outlet Good", "Outlet threads good."],
  ["Accessible (Not Blocked)", "Clear access."],
  ["Adequate Clearance (3 ft all sides)", "Meets clearance requirement."],
];

const emptyHydrant = {
  hydrant_id: "",
  location_id: "",
  district: "1",
  location: "",
  status: "In Service",
  provider: "",
  discharge_size: "2.5",
  pitot_psi: "",
  static_psi: "",
  residual_psi: "",
  tested_by: "",
  shift: "A",
  notes: "",
};

const todayInput = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const calcFlow = (dischargeSize, pitotPsi) => {
  const d = Number(dischargeSize);
  const p = Number(pitotPsi);
  if (!Number.isFinite(d) || !Number.isFinite(p) || d <= 0 || p <= 0) return "";
  return Math.round(29.83 * 0.9 * d * d * Math.sqrt(p));
};

const api = async (path, options) => {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Request failed.");
  return data;
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export default function HydrantTestingPage() {
  const fileRef = useRef(null);
  const [screen, setScreen] = useState("dashboard");
  const [hydrants, setHydrants] = useState([]);
  const [tests, setTests] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [district, setDistrict] = useState("All");
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedHydrant, setSelectedHydrant] = useState(null);
  const [form, setForm] = useState({ ...emptyHydrant, tested_at: todayInput() });
  const [inspectionRows, setInspectionRows] = useState(() =>
    checklistItems.map(([item, notes]) => ({ item, result: "Yes", notes, repair_needed: "No", photo: "" })),
  );
  const [message, setMessage] = useState("");

  const selectedId = selectedHydrant?.hydrant_id || selectedHydrant?.location_id || form.hydrant_id || form.location_id;
  const flow = calcFlow(form.discharge_size, form.pitot_psi);

  const stats = useMemo(() => ({
    total: hydrants.length,
    inService: hydrants.filter((hydrant) => hydrant.status !== "Out of Service").length,
    outService: hydrants.filter((hydrant) => hydrant.status === "Out of Service").length,
    tests: tests.length,
  }), [hydrants, tests]);

  const visibleHydrants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hydrants.filter((hydrant) => {
      const text = `${hydrant.hydrant_id} ${hydrant.location_id} ${hydrant.location} ${hydrant.address} ${hydrant.provider}`.toLowerCase();
      return (district === "All" || hydrant.district === district) &&
        (status === "All" || hydrant.status === status) &&
        (!q || text.includes(q));
    });
  }, [district, hydrants, query, status]);

  const loadAll = async () => {
    const [hydrantsData, testsData, inspectionsData] = await Promise.all([
      api("/api/hydrants"),
      api("/api/tests"),
      api("/api/inspections"),
    ]);

    setHydrants(hydrantsData.hydrants || []);
    setTests(testsData.tests || []);
    setInspections(inspectionsData.inspections || []);

    if (!selectedHydrant && hydrantsData.hydrants?.[0]) {
      selectHydrant(hydrantsData.hydrants[0]);
    }
  };

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  const selectHydrant = (hydrant) => {
    setSelectedHydrant(hydrant);
    setForm({
      ...emptyHydrant,
      ...hydrant,
      hydrant_id: hydrant.hydrant_id || hydrant.location_id || "",
      location: hydrant.location || hydrant.address || "",
      discharge_size: hydrant.discharge_size || "2.5",
      tested_by: hydrant.tested_by || form.tested_by || "",
      shift: hydrant.shift || form.shift || "A",
      tested_at: todayInput(),
    });
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleHydrantIdInput = (value) => {
    updateForm("hydrant_id", value);
    setQuery(value);

    const typed = value.trim().toLowerCase();
    if (!typed) return;

    const exactMatch = hydrants.find((hydrant) =>
      String(hydrant.hydrant_id || "").toLowerCase() === typed ||
      String(hydrant.location_id || "").toLowerCase() === typed
    );

    if (exactMatch) {
      selectHydrant(exactMatch);
      setQuery(value);
    }
  };

  const updateInspectionRow = (index, patch) => {
    setInspectionRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const saveHydrant = async () => {
    const result = await api("/api/hydrants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage("Hydrant saved.");
    selectHydrant(result.hydrant);
    await loadAll();
  };

  const saveTest = async () => {
    const result = await api("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        location_id: selectedHydrant?.location_id || form.location_id,
        flow_gpm: flow,
      }),
    });
    setMessage(`Flow test saved: ${Number(result.test.flow_gpm || 0).toLocaleString()} GPM.`);
    await loadAll();
  };

  const saveInspection = async () => {
    await api("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hydrant_id: selectedId,
        location_id: selectedHydrant?.location_id || form.location_id,
        district: form.district,
        status: form.status,
        tested_by: form.tested_by,
        shift: form.shift,
        notes: form.notes,
        inspected_at: form.tested_at,
        checklist: inspectionRows,
      }),
    });
    setMessage("Inspection completed.");
    await loadAll();
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    const result = await api("/api/hydrants/import", { method: "POST", body });
    setMessage(`Imported ${result.imported} hydrants. Total inventory: ${result.total}.`);
    event.target.value = "";
    await loadAll();
  };

  return (
    <div className="min-h-screen bg-[#071019] p-3 text-white sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1500px] overflow-hidden rounded-[28px] border border-white/10 bg-[#f4f6f8] shadow-[0_28px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden bg-[linear-gradient(180deg,#111c28,#06101a)] text-white lg:flex lg:flex-col">
          <div className="px-8 pb-6 pt-7 text-center">
            <img src="/images/horn-lake-logo.png" alt="City of Horn Lake Fire Department" className="mx-auto h-40 w-40 object-contain drop-shadow-xl" />
            <p className="mt-5 text-lg font-black uppercase tracking-[0.16em]">Hydrant Testing</p>
          </div>

          <nav className="grid gap-2 px-4">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setScreen(item.key)}
                className={`flex min-h-12 items-center gap-3 rounded-md px-4 text-left text-sm font-bold transition-colors ${screen === item.key ? "bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg" : "text-white/72 hover:bg-white/8 hover:text-white"}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-red-600 bg-[#111] text-xs font-black">HLFD</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{form.tested_by || "Field User"}</p>
                <p className="text-sm text-white/70">{form.shift || "A"} Shift</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 text-white/60" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-[#eef1f5] text-slate-950">
          <header className="flex min-h-[74px] items-center justify-between gap-4 bg-gradient-to-r from-red-800 to-red-600 px-5 text-white shadow-md sm:px-7">
            <div className="flex min-w-0 items-center gap-4">
              <Link to="/" className="grid h-10 w-10 place-items-center rounded-md hover:bg-white/10" title="Back to Dept-App">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black tracking-tight">{screen === "inspection" ? "Hydrant Inspection" : "Hydrants"}</h1>
                <p className="truncate text-sm font-medium text-white/85">
                  {selectedId ? `${selectedId} - ${form.location || "No location"} - District ${form.district || "-"}` : "Horn Lake Fire Department"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={loadAll} className="top-icon" title="Refresh"><RefreshCw className="h-5 w-5" /></button>
              <button type="button" onClick={() => fileRef.current?.click()} className="top-icon" title="Import CSV"><CloudUpload className="h-5 w-5" /></button>
              <a href="/api/hydrants/export" className="top-icon" title="Export CSV"><Download className="h-5 w-5" /></a>
              <button type="button" className="top-icon" title="Filters"><Filter className="h-5 w-5" /></button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCsv} />
            </div>
          </header>

          {message && (
            <div className="mx-5 mt-4 rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
              {message}
            </div>
          )}

          {screen === "inspection" ? (
            <InspectionScreen
              form={form}
              inspectionRows={inspectionRows}
              updateForm={updateForm}
              updateInspectionRow={updateInspectionRow}
              saveInspection={saveInspection}
            />
          ) : (
            <DashboardScreen
              district={district}
              form={form}
              flow={flow}
              hydrants={hydrants}
              query={query}
              saveHydrant={saveHydrant}
              saveTest={saveTest}
              screen={screen}
              handleHydrantIdInput={handleHydrantIdInput}
              selectHydrant={selectHydrant}
              setDistrict={setDistrict}
              setQuery={setQuery}
              setScreen={setScreen}
              setStatus={setStatus}
              stats={stats}
              status={status}
              tests={tests}
              inspections={inspections}
              updateForm={updateForm}
              visibleHydrants={visibleHydrants}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardScreen(props) {
  const {
    district,
    form,
    flow,
    hydrants,
    query,
    saveHydrant,
    saveTest,
    screen,
    handleHydrantIdInput,
    selectHydrant,
    setDistrict,
    setQuery,
    setScreen,
    setStatus,
    stats,
    status,
    tests,
    inspections,
    updateForm,
    visibleHydrants,
  } = props;

  if (screen === "reports") {
    return (
      <div className="p-5">
        <Panel title="Reports" subtitle="Export hydrant, testing, and inspection activity.">
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <ReportCard label="Hydrants" value={hydrants.length} href="/api/hydrants/export" />
            <ReportCard label="Flow Tests" value={tests.length} />
            <ReportCard label="Inspections" value={inspections.length} />
          </div>
        </Panel>
      </div>
    );
  }

  if (screen === "sync" || screen === "settings") {
    return (
      <div className="p-5">
        <Panel title={screen === "sync" ? "Sync / Import" : "Settings"} subtitle="Render stores hydrant data through the Dept-App backend.">
          <div className="p-6 text-sm font-semibold text-slate-700">
            Use the upload and export buttons in the red toolbar. Data is saved through the server API and your configured Render data directory.
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Droplets} label="Total Hydrants" value={stats.total} tone="red" />
        <Metric icon={Check} label="In Service" value={stats.inService} tone="green" />
        <Metric icon={Wrench} label="Out of Service" value={stats.outService} tone="orange" />
        <Metric icon={Gauge} label="Tests This Year" value={stats.tests} tone="blue" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[310px_1fr]">
        <div className="grid gap-4">
          <Panel title="Filters">
            <div className="p-4">
              <p className="mb-2 text-sm font-bold">District</p>
              <div className="grid grid-cols-4 overflow-hidden rounded-md border border-slate-300">
                {["All", "1", "2", "3"].map((item) => (
                  <button key={item} type="button" onClick={() => setDistrict(item)} className={`h-10 border-r border-slate-300 text-sm font-black last:border-r-0 ${district === item ? "bg-red-700 text-white" : "bg-white"}`}>
                    {item}
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-4 text-sm font-bold">Status</p>
              <Select value={status} onChange={(value) => setStatus(value)} options={["All", "In Service", "Out of Service"]} />
              <p className="mb-2 mt-4 text-sm font-bold">Search Hydrant ID</p>
              <div className="relative">
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="hydrant-input pr-10" placeholder="Search by Hydrant ID" />
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </Panel>

          <Panel title={`Hydrant List (${visibleHydrants.length})`}>
            <div className="max-h-[420px] overflow-y-auto">
              {visibleHydrants.length ? visibleHydrants.map((hydrant) => (
                <button
                  key={hydrant.hydrant_id || hydrant.location_id}
                  type="button"
                  onClick={() => selectHydrant(hydrant)}
                  className={`grid w-full grid-cols-[34px_1fr_auto] items-center gap-3 border-b border-slate-200 px-4 py-3 text-left hover:bg-red-50 ${form.hydrant_id === hydrant.hydrant_id ? "bg-red-50 ring-1 ring-inset ring-red-500" : "bg-white"}`}
                >
                  <Droplets className="h-6 w-6 text-red-700" />
                  <span className="min-w-0">
                    <span className="block font-black">{hydrant.hydrant_id || hydrant.location_id || "No ID"}</span>
                    <span className="block truncate text-xs font-bold text-slate-700">{hydrant.location || hydrant.address || "No location"}</span>
                    <span className="block text-xs text-slate-500">District {hydrant.district || "-"}</span>
                  </span>
                  <span className={`rounded px-2 py-1 text-[11px] font-black ${hydrant.status === "Out of Service" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                    {hydrant.status || "In Service"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              )) : (
                <div className="p-5 text-sm font-bold text-slate-500">No hydrants found. Import a CSV or save a new hydrant.</div>
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title={screen === "hydrants" ? "Hydrant Record" : "Hydrant Test"}>
            <div className="grid gap-4 p-5 lg:grid-cols-4">
              <Field label="Hydrant ID" value={form.hydrant_id} onChange={handleHydrantIdInput} />
              <Select label="District" value={form.district} onChange={(value) => updateForm("district", value)} options={["1", "2", "3"]} />
              <Field className="lg:col-span-2" label="Address" value={form.location} onChange={(value) => updateForm("location", value)} />
              <Select label="Discharge Size" value={form.discharge_size} onChange={(value) => updateForm("discharge_size", value)} options={["2", "2.25", "2.5"]} />
              <Field label="Pitot PSI" type="number" value={form.pitot_psi} onChange={(value) => updateForm("pitot_psi", value)} />
              <Field label="Static PSI" type="number" value={form.static_psi} onChange={(value) => updateForm("static_psi", value)} />
              <Field label="Residual PSI" type="number" value={form.residual_psi} onChange={(value) => updateForm("residual_psi", value)} />
              <div className="rounded-md border border-slate-300 bg-white p-3 lg:col-span-4">
                <p className="text-sm font-bold">Flow GPM (Calculated)</p>
                <p className="mt-1 text-3xl font-black text-red-700">{flow ? `${flow.toLocaleString()} GPM` : "--"}</p>
                <p className="text-xs font-semibold text-slate-500">Flow GPM = 29.83 x 0.9 x discharge size^2 x sqrt(pitot PSI)</p>
              </div>
              <Select label="Status" value={form.status} onChange={(value) => updateForm("status", value)} options={["In Service", "Out of Service"]} />
              <Field label="Tested By" value={form.tested_by} onChange={(value) => updateForm("tested_by", value)} />
              <Select label="Shift" value={form.shift} onChange={(value) => updateForm("shift", value)} options={["A", "B", "C"]} />
              <Field label="Date / Time" type="datetime-local" value={form.tested_at} onChange={(value) => updateForm("tested_at", value)} />
              <label className="grid gap-2 lg:col-span-4">
                <span className="text-sm font-bold">Notes</span>
                <textarea value={form.notes || ""} onChange={(event) => updateForm("notes", event.target.value)} className="hydrant-input min-h-24 resize-y" placeholder="Enter notes..." />
              </label>
              <div className="flex flex-wrap gap-4 lg:col-span-4">
                <ActionButton icon={Save} label="Save Test" onClick={saveTest} />
                <ActionButton icon={Droplets} label="Save Hydrant" variant="outline" onClick={saveHydrant} />
                <ActionButton icon={Camera} label="Add Photo" variant="outline" />
                <ActionButton icon={ListChecks} label="View Tests" variant="outline" onClick={() => setScreen("flow")} />
                <ActionButton icon={MapPin} label="View on Map" variant="outline" />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InspectionScreen({ form, inspectionRows, updateForm, updateInspectionRow, saveInspection }) {
  const handlePhotoUpload = async (index, file) => {
    if (!file) return;
    const photo = await fileToDataUrl(file);
    updateInspectionRow(index, {
      photo,
      photo_name: file.name,
      photo_type: file.type,
      photo_size: file.size,
    });
  };

  return (
    <div className="bg-[#071019] p-5 text-white">
      <div className="mb-4 rounded-md border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 lg:grid-cols-4">
          <Field dark label="Inspection Date / Time" type="datetime-local" value={form.tested_at} onChange={(value) => updateForm("tested_at", value)} icon={CalendarDays} />
          <Select dark label="Inspector / Tested By" value={form.tested_by} onChange={(value) => updateForm("tested_by", value)} options={[form.tested_by || "Field User", "John Smith"]} icon={BriefcaseBusiness} />
          <Select dark label="Shift" value={form.shift} onChange={(value) => updateForm("shift", value)} options={["A", "B", "C"]} />
          <Select dark label="District" value={form.district} onChange={(value) => updateForm("district", value)} options={["1", "2", "3"]} />
          <Select dark label="Status" value={form.status} onChange={(value) => updateForm("status", value)} options={["In Service", "Out of Service"]} />
          <Field dark label="Weather Conditions" value="72F  Partly Cloudy" onChange={() => {}} />
          <Field dark className="lg:col-span-2" label="Notes" value={form.notes || ""} onChange={(value) => updateForm("notes", value)} />
        </div>
      </div>

      <section className="overflow-hidden rounded-md border border-white/10 bg-[#101820]">
        <div className="flex items-center justify-between bg-gradient-to-r from-red-800 to-red-600 px-4 py-3">
          <h2 className="text-lg font-black uppercase">Hydrant Inspection Checklist</h2>
          <button type="button" className="text-sm font-bold">Expand All</button>
        </div>
        <div className="hidden grid-cols-[1.55fr_80px_80px_80px_1.45fr_110px_120px] gap-3 border-b border-white/10 bg-black/25 px-4 py-3 text-xs font-black uppercase text-white/80 xl:grid">
          <span>Item</span><span>Yes</span><span>No</span><span>N/A</span><span>Notes / Details</span><span>Photo</span><span>Repair Needed</span>
        </div>
        <div>
          {inspectionRows.map((row, index) => (
            <div key={row.item} className="grid gap-3 border-b border-white/10 px-4 py-3 xl:grid-cols-[1.55fr_80px_80px_80px_1.45fr_110px_120px] xl:items-center">
              <p className="text-sm font-bold">{row.item}</p>
              {["Yes", "No", "N/A"].map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => updateInspectionRow(index, { result: choice })}
                  className={`h-9 rounded-md border text-sm font-bold ${row.result === choice ? "border-green-500 bg-green-700/60 text-white" : "border-white/25 bg-black/20 text-white"}`}
                >
                  {choice}
                </button>
              ))}
              <input value={row.notes} onChange={(event) => updateInspectionRow(index, { notes: event.target.value })} className="dark-input" />
              <label className="group relative grid min-h-11 cursor-pointer place-items-center overflow-hidden rounded-md border border-white/25 bg-black/20 text-white transition-colors hover:border-red-500 hover:bg-red-600/15">
                {row.photo ? (
                  <img src={row.photo} alt={`${row.item} inspection`} className="h-11 w-full object-cover" />
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide">
                    <Camera className="h-4 w-4" />
                    Photo
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => handlePhotoUpload(index, event.target.files?.[0]).catch(() => {})}
                />
              </label>
              <Select dark value={row.repair_needed} onChange={(value) => updateInspectionRow(index, { repair_needed: value })} options={["No", "Yes"]} />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 flex flex-wrap justify-between gap-4">
        <ActionButton icon={FileText} label="Add Note" variant="darkOutline" />
        <ActionButton icon={Save} label="Save Draft" variant="darkOutline" />
        <ActionButton icon={Check} label="Complete Inspection" onClick={saveInspection} />
      </div>
    </div>
  );
}

function Panel({ children, title, subtitle }) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,0.12)]">
      <div className="border-b border-red-200 px-4 py-3">
        <h2 className="font-black uppercase text-red-700">{title}</h2>
        {subtitle && <p className="text-sm font-semibold text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  const tones = {
    red: "bg-red-700",
    green: "bg-green-700",
    orange: "bg-orange-600",
    blue: "bg-blue-700",
  };

  return (
    <div className="flex min-h-[96px] items-center gap-5 rounded-md border border-slate-200 bg-white px-7 shadow-[0_5px_18px_rgba(15,23,42,0.12)]">
      <div className={`grid h-14 w-14 place-items-center rounded-full text-white ${tones[tone]}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-3xl font-black">{Number(value || 0).toLocaleString()}</p>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Field({ className = "", dark = false, icon: Icon, label, type = "text", value, onChange }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      {label && <span className={`text-sm font-bold ${dark ? "text-white" : "text-slate-950"}`}>{label}</span>}
      <span className="relative">
        {Icon && <Icon className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? "text-white/65" : "text-slate-500"}`} />}
        <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className={`${dark ? "dark-input" : "hydrant-input"} ${Icon ? "pl-9" : ""}`} />
      </span>
    </label>
  );
}

function Select({ className = "", dark = false, icon: Icon, label, value, onChange, options }) {
  return (
    <label className={`grid gap-2 ${className}`}>
      {label && <span className={`text-sm font-bold ${dark ? "text-white" : "text-slate-950"}`}>{label}</span>}
      <span className="relative">
        {Icon && <Icon className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? "text-white/65" : "text-slate-500"}`} />}
        <select value={value || ""} onChange={(event) => onChange(event.target.value)} className={`${dark ? "dark-input" : "hydrant-input"} appearance-none ${Icon ? "pl-9" : ""}`}>
          {options.map((option) => <option key={option || "blank"} value={option}>{option || "Select"}</option>)}
        </select>
        <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${dark ? "text-white/65" : "text-slate-500"}`} />
      </span>
    </label>
  );
}

function ActionButton({ icon: Icon, label, onClick, variant = "solid" }) {
  const classes = {
    solid: "border-red-700 bg-red-700 text-white hover:bg-red-800",
    outline: "border-red-500 bg-white text-red-700 hover:bg-red-50",
    darkOutline: "border-red-600 bg-transparent text-red-500 hover:bg-red-600/10",
  };

  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-3 rounded-md border px-6 text-sm font-black ${classes[variant]}`}>
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function ReportCard({ label, value, href }) {
  const content = (
    <div className="rounded-md border border-slate-200 p-5">
      <p className="text-sm font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{Number(value || 0).toLocaleString()}</p>
      {href && <p className="mt-4 text-sm font-black text-red-700">Download CSV</p>}
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}
