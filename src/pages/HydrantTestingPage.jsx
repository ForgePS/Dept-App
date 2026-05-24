import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
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

const crewUserOptions = [
  "",
  "Adam Tutor",
  "Billy White",
  "Blake Turnmire",
  "Brandon Jefferies",
  "Clay Willingham",
  "Cole Casey",
  "Cory Hill",
  "Gregory Scruggs",
  "Jay Mitchell",
  "Jay Wade",
  "Jeff Tidwell",
  "Jeremy Johnson",
  "Jeremy Powell",
  "John Paul Lavender",
  "Joseph Gardner",
  "Justin Correro",
  "Lee Chillis",
  "Mike Mallett",
  "Paul Destefanis",
  "Shane Headley",
  "Stephen White",
  "Steven Whitten",
  "Timothy Jones",
  "Troy Vest",
  "Tyler Lee",
  "William Sigurdson",
  "William Sisk",
];

const checklistItems = [
  ["No Obstructions", "Area clear and accessible."],
  ["Operable (Turns Open/Closed)", "Operated smoothly."],
  ["Caps Present", "All caps present."],
  ["Threads in Good Condition", "Threads clean and intact."],
  ["Oil Nut Provided", "Oil nut in place."],
  ["Barrel Drains Properly", "Drains as expected."],
  ["Leaks (Valve / Caps / Barrel)", "No leaks detected."],
  ["Steamer Port / Pumper Outlet Good", "Outlet threads good."],
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

const nfpaClasses = [
  { label: "Class AA", range: "1500+ gpm", min: 1500, color: "#2563eb", text: "Blue" },
  { label: "Class A", range: "1000-1499 gpm", min: 1000, color: "#16a34a", text: "Green" },
  { label: "Class B", range: "500-999 gpm", min: 500, color: "#f97316", text: "Orange" },
  { label: "Class C", range: "0-499 gpm", min: 0, color: "#dc2626", text: "Red" },
];

const getNfpaClass = (flowGpm) => {
  const flowValue = Number(flowGpm || 0);
  return nfpaClasses.find((item) => flowValue >= item.min) || nfpaClasses[nfpaClasses.length - 1];
};

const getHydrantStyle = (hydrant = {}) => {
  if (hydrant?.status === "Out of Service") return { label: "Out of Service", range: "Out of service", min: 0, color: "#111827", text: "Black" };
  const flowValue = Number(hydrant?.flow_gpm || 0);
  if (!Number.isFinite(flowValue) || flowValue <= 0) return { label: "Not Tested", range: "No flow result", min: 0, color: "#64748b", text: "Gray" };
  return getNfpaClass(flowValue);
};

const getHydrantPosition = (hydrant) => {
  if (!hydrant) return null;
  const lat = Number(hydrant.latitude || hydrant.lat);
  const lon = Number(hydrant.longitude || hydrant.lon || hydrant.lng);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
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
  const [selectedDistricts, setSelectedDistricts] = useState(["1", "2", "3"]);
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedHydrant, setSelectedHydrant] = useState(null);
  const [crew, setCrew] = useState({ tested_by: "", shift: "A", tested_at: todayInput() });
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

  const mappedHydrants = useMemo(() => hydrants.filter((hydrant) => getHydrantPosition(hydrant)), [hydrants]);

  const visibleHydrants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hydrants.filter((hydrant) => {
      const text = `${hydrant.hydrant_id} ${hydrant.location_id} ${hydrant.location} ${hydrant.address} ${hydrant.provider}`.toLowerCase();
      return selectedDistricts.includes(String(hydrant.district || "")) &&
        (status === "All" || hydrant.status === status) &&
        (!q || text.includes(q));
    });
  }, [hydrants, query, selectedDistricts, status]);

  const toggleDistrict = (districtValue) => {
    setSelectedDistricts((current) => {
      if (districtValue === "All") return current.length === 3 ? [] : ["1", "2", "3"];
      return current.includes(districtValue)
        ? current.filter((item) => item !== districtValue)
        : [...current, districtValue].sort();
    });
  };

  const loadAll = async () => {
    const [hydrantsData, testsData, inspectionsData] = await Promise.all([
      api("/api/hydrants"),
      api("/api/tests"),
      api("/api/inspections"),
    ]);

    setHydrants(hydrantsData.hydrants || []);
    setTests(testsData.tests || []);
    setInspections(inspectionsData.inspections || []);
  };

  useEffect(() => {
    loadAll().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const selectHydrant = (hydrant) => {
    setSelectedHydrant(hydrant);
    setForm({
      ...emptyHydrant,
      ...hydrant,
      hydrant_id: hydrant.hydrant_id || hydrant.location_id || "",
      location: hydrant.location || hydrant.address || "",
      discharge_size: hydrant.discharge_size || "2.5",
      tested_by: crew.tested_by,
      shift: crew.shift,
      tested_at: crew.tested_at || form.tested_at || todayInput(),
    });
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateCrew = (field, value) => {
    setCrew((current) => ({ ...current, [field]: value }));
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
      body: JSON.stringify({ ...form, tested_by: crew.tested_by, shift: crew.shift, tested_at: crew.tested_at }),
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
        tested_by: crew.tested_by,
        shift: crew.shift,
        tested_at: crew.tested_at,
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
        tested_by: crew.tested_by,
        shift: crew.shift,
        notes: form.notes,
        inspected_at: crew.tested_at,
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
                <p className="truncate text-sm font-bold">{crew.tested_by || "Field User"}</p>
                <p className="text-sm text-white/70">{crew.shift || "A"} Shift</p>
                <p className="text-xs text-white/50">{crew.tested_at?.slice(0, 10) || "No date"}</p>
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
              crew={crew}
              handleHydrantIdInput={handleHydrantIdInput}
              inspectionRows={inspectionRows}
              saveHydrant={saveHydrant}
              updateForm={updateForm}
              updateInspectionRow={updateInspectionRow}
              saveInspection={saveInspection}
            />
          ) : (
            <DashboardScreen
              crew={crew}
              form={form}
              flow={flow}
              hydrants={hydrants}
              query={query}
              saveHydrant={saveHydrant}
              saveTest={saveTest}
              screen={screen}
              handleHydrantIdInput={handleHydrantIdInput}
              selectHydrant={selectHydrant}
              setQuery={setQuery}
              setScreen={setScreen}
              selectedDistricts={selectedDistricts}
              setStatus={setStatus}
              stats={stats}
              status={status}
              tests={tests}
              toggleDistrict={toggleDistrict}
              inspections={inspections}
              mappedHydrants={mappedHydrants}
              updateCrew={updateCrew}
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
    crew,
    form,
    flow,
    hydrants,
    query,
    saveHydrant,
    saveTest,
    screen,
    handleHydrantIdInput,
    selectHydrant,
    setQuery,
    setScreen,
    selectedDistricts,
    setStatus,
    stats,
    status,
    tests,
    toggleDistrict,
    inspections,
    mappedHydrants,
    updateCrew,
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

  if (screen === "map" || screen === "hydrants") {
    return (
      <HydrantMapScreen
        hydrants={visibleHydrants}
        mappedHydrants={mappedHydrants}
        query={query}
        selectedHydrant={form}
        selectedDistricts={selectedDistricts}
        selectHydrant={selectHydrant}
        setQuery={setQuery}
        setScreen={setScreen}
        stats={stats}
        toggleDistrict={toggleDistrict}
      />
    );
  }

  if (screen === "flow") {
    return (
      <FlowTestScreen
        flow={flow}
        form={form}
        handleHydrantIdInput={handleHydrantIdInput}
        saveHydrant={saveHydrant}
        saveTest={saveTest}
        setScreen={setScreen}
        updateForm={updateForm}
      />
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

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-4">
          <Panel title="Crew">
            <div className="grid gap-4 p-4">
              <Select label="User" value={crew.tested_by} onChange={(value) => updateCrew("tested_by", value)} options={crewUserOptions} />
              <Select label="Shift" value={crew.shift} onChange={(value) => updateCrew("shift", value)} options={["A", "B", "C"]} />
              <Field label="Date / Time" type="datetime-local" value={crew.tested_at} onChange={(value) => updateCrew("tested_at", value)} icon={CalendarDays} />
            </div>
          </Panel>

          <Panel title="Filters">
            <div className="p-4">
              <p className="mb-2 text-sm font-bold">District</p>
              <DistrictVisibilityButtons selectedDistricts={selectedDistricts} toggleDistrict={toggleDistrict} />
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
                  <Droplets className="h-6 w-6" style={{ color: getHydrantStyle(hydrant).color }} />
                  <span className="min-w-0">
                    <span className="block font-black">{hydrant.hydrant_id || hydrant.location_id || "No ID"}</span>
                    <span className="block truncate text-xs font-bold text-slate-700">{hydrant.location || hydrant.address || "No location"}</span>
                    <span className="block text-xs text-slate-500">District {hydrant.district || "-"}</span>
                  </span>
                  <span className={`rounded px-2 py-1 text-[11px] font-black ${hydrant.status === "Out of Service" ? "bg-slate-950 text-white" : "bg-green-100 text-green-700"}`}>
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

        <div className="grid min-h-[720px] gap-4 xl:grid-rows-[minmax(0,1fr)_auto]">
          <AerialPanel
            hydrants={visibleHydrants}
            selectedHydrant={form}
            selectHydrant={selectHydrant}
            setScreen={setScreen}
          />
          <NfpaStandardsPanel />
        </div>
      </div>
    </div>
  );
}

function DistrictVisibilityButtons({ selectedDistricts, toggleDistrict }) {
  const allSelected = selectedDistricts.length === 3;

  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-md border border-slate-300">
      {["All", "1", "2", "3"].map((item) => {
        const isSelected = item === "All" ? allSelected : selectedDistricts.includes(item);
        const label = item === "All" ? "All" : `D${item}`;

        return (
          <button
            key={item}
            type="button"
            onClick={() => toggleDistrict(item)}
            className={`h-10 border-r border-slate-300 text-sm font-black last:border-r-0 ${isSelected ? "bg-red-700 text-white" : "bg-white text-slate-800"}`}
            aria-pressed={isSelected}
            title={item === "All" ? "Show or hide all districts" : `Show or hide District ${item}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function HydrantMapScreen({ hydrants, mappedHydrants, query, selectedHydrant, selectedDistricts, selectHydrant, setQuery, setScreen, stats, toggleDistrict }) {
  const selectedPosition = getHydrantPosition(selectedHydrant);
  const visibleMappedHydrants = hydrants.filter((hydrant) => getHydrantPosition(hydrant));
  const visibleInService = hydrants.filter((hydrant) => hydrant.status !== "Out of Service").length;
  const visibleOutService = hydrants.filter((hydrant) => hydrant.status === "Out of Service").length;

  return (
    <div className="grid min-h-[calc(100vh-114px)] gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex min-h-[640px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="font-black uppercase text-red-700">Aerial Hydrant Map</h2>
            <p className="text-sm font-semibold text-slate-500">{visibleMappedHydrants.length.toLocaleString()} visible of {mappedHydrants.length.toLocaleString()} mapped city hydrants</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
            <div className="w-full sm:w-[320px]">
              <DistrictVisibilityButtons selectedDistricts={selectedDistricts} toggleDistrict={toggleDistrict} />
            </div>
            <div className="relative w-full sm:w-80">
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="hydrant-input pr-10" placeholder="Search hydrant ID" />
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>
        <div className="min-h-[560px] flex-1">
          <AerialHydrantMap hydrants={hydrants} selectedHydrant={selectedHydrant} selectHydrant={selectHydrant} setScreen={setScreen} />
        </div>
      </section>

      <aside className="grid min-h-[640px] content-start gap-4">
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="Total" value={stats.total} />
          <MiniMetric label="Visible" value={hydrants.length} />
          <MiniMetric label="In Service" value={visibleInService} />
          <MiniMetric label="OOS" value={visibleOutService} />
        </div>

        <QuickHydrantCard hydrant={selectedHydrant} selectedPosition={selectedPosition} setScreen={setScreen} />

        <Panel title={`Quick Info Cards (${hydrants.length})`}>
          <div className="max-h-[calc(100vh-430px)] min-h-64 overflow-y-auto">
            {hydrants.slice(0, 40).map((hydrant) => (
              <HydrantQuickRow key={hydrant.hydrant_id || hydrant.location_id} hydrant={hydrant} onClick={() => selectHydrant(hydrant)} />
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function AerialPanel({ hydrants, selectedHydrant, selectHydrant, setScreen }) {
  return (
    <section className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_5px_18px_rgba(15,23,42,0.12)]">
      <div className="border-b border-red-200 px-4 py-3">
        <h2 className="font-black uppercase text-red-700">Aerial View</h2>
        <p className="text-sm font-semibold text-slate-500">Satellite map with hydrant overlays and quick action popups.</p>
      </div>
      <div className="min-h-[420px] flex-1">
        <AerialHydrantMap hydrants={hydrants} selectedHydrant={selectedHydrant} selectHydrant={selectHydrant} setScreen={setScreen} />
      </div>
    </section>
  );
}

function FlowTestScreen({ flow, form, handleHydrantIdInput, saveHydrant, saveTest, setScreen, updateForm }) {
  const nfpaClass = form.nfpa_class || getNfpaClass(flow || form.flow_gpm).label;

  return (
    <div className="p-5">
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Panel title="Hydrant Info" subtitle="Save hydrant details without creating a flow test.">
          <div className="grid gap-4 p-5">
            <Field label="Hydrant ID" value={form.hydrant_id} onChange={handleHydrantIdInput} />
            <Select label="District" value={form.district} onChange={(value) => updateForm("district", value)} options={["", "1", "2", "3"]} />
            <Field label="Address" value={form.location} onChange={(value) => updateForm("location", value)} />
            <Field label="Provider" value={form.provider} onChange={(value) => updateForm("provider", value)} />
            <Select label="Status" value={form.status} onChange={(value) => updateForm("status", value)} options={["In Service", "Out of Service"]} />
            <label className="grid gap-2">
              <span className="text-sm font-bold">Hydrant Notes</span>
              <textarea value={form.notes || ""} onChange={(event) => updateForm("notes", event.target.value)} className="hydrant-input min-h-24 resize-y" placeholder="Enter hydrant notes..." />
            </label>
            <ActionButton icon={Droplets} label="Save Hydrant Info" onClick={saveHydrant} />
          </div>
        </Panel>

        <Panel title="Flow Test" subtitle="Record pitot, static, residual, and NFPA color classification.">
          <div className="grid gap-4 p-5 lg:grid-cols-4">
          <Field label="Hydrant ID" value={form.hydrant_id} onChange={handleHydrantIdInput} />
          <Select label="District" value={form.district} onChange={(value) => updateForm("district", value)} options={["", "1", "2", "3"]} />
          <Field className="lg:col-span-2" label="Address" value={form.location} onChange={(value) => updateForm("location", value)} />
          <Select label="Discharge Size" value={form.discharge_size} onChange={(value) => updateForm("discharge_size", value)} options={["2", "2.25", "2.5"]} />
          <Field label="Pitot PSI" type="number" value={form.pitot_psi} onChange={(value) => updateForm("pitot_psi", value)} />
          <Field label="Static PSI" type="number" value={form.static_psi} onChange={(value) => updateForm("static_psi", value)} />
          <Field label="Residual PSI" type="number" value={form.residual_psi} onChange={(value) => updateForm("residual_psi", value)} />
          <div className="rounded-md border border-slate-300 bg-white p-3 lg:col-span-2">
            <p className="text-sm font-bold">Flow GPM (Calculated)</p>
            <p className="mt-1 text-4xl font-black text-red-700">{flow ? `${flow.toLocaleString()} GPM` : "--"}</p>
            <p className="text-xs font-semibold text-slate-500">29.83 x 0.9 x discharge size^2 x sqrt(pitot PSI)</p>
          </div>
          <div className="rounded-md border border-slate-300 bg-white p-3 lg:col-span-2">
            <p className="text-sm font-bold">NFPA Color Standard</p>
            <Select value={nfpaClass} onChange={(value) => updateForm("nfpa_class", value)} options={nfpaClasses.map((item) => item.label)} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[...nfpaClasses, { label: "Out of Service", range: "Unavailable", color: "#111827", text: "Black" }, { label: "Not Tested", range: "No flow result", color: "#64748b", text: "Gray" }].map((item) => (
                <div key={item.label} className="rounded border border-slate-200 p-2 text-xs font-bold">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}: {item.range}
                </div>
              ))}
            </div>
          </div>
          <Select label="Status" value={form.status} onChange={(value) => updateForm("status", value)} options={["In Service", "Out of Service"]} />
          <label className="grid gap-2 lg:col-span-4">
            <span className="text-sm font-bold">Notes</span>
            <textarea value={form.notes || ""} onChange={(event) => updateForm("notes", event.target.value)} className="hydrant-input min-h-24 resize-y" placeholder="Enter notes..." />
          </label>
          <div className="flex flex-wrap gap-4 lg:col-span-4">
            <ActionButton icon={Save} label="Save Test" onClick={saveTest} />
            <ActionButton icon={Droplets} label="Save Hydrant Info" variant="outline" onClick={saveHydrant} />
            <ActionButton icon={MapPin} label="View on Map" variant="outline" onClick={() => setScreen("map")} />
          </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function InspectionScreen({ form, crew, handleHydrantIdInput, inspectionRows, updateForm, updateInspectionRow, saveInspection, saveHydrant }) {
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
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 lg:col-span-2">
            <p className="text-xs font-black uppercase text-white/60">Crew</p>
            <p className="mt-1 text-sm font-bold">{crew.tested_by || "Field User"} - {crew.shift || "A"} Shift</p>
            <p className="mt-1 text-xs font-semibold text-white/70">{crew.tested_at ? new Date(crew.tested_at).toLocaleString() : "No date selected"}</p>
          </div>
          <Field dark label="Hydrant ID" value={form.hydrant_id || form.location_id || ""} onChange={handleHydrantIdInput} icon={Droplets} />
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
        <ActionButton icon={Save} label="Save Hydrant Info" variant="darkOutline" onClick={saveHydrant} />
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

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{Number(value || 0).toLocaleString()}</p>
    </div>
  );
}

function AerialHydrantMap({ hydrants, selectedHydrant, selectHydrant, setScreen }) {
  const [userLocation, setUserLocation] = useState(null);
  const mappedHydrants = hydrants.filter((hydrant) => getHydrantPosition(hydrant));
  const cityCenter = [34.955, -90.055];

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return (
    <MapContainer center={cityCenter} zoom={12} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution="Labels &copy; Esri"
        url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      />
      <MapAutoFrame hydrants={mappedHydrants} selectedHydrant={selectedHydrant} userLocation={userLocation} />
      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={9}
          pathOptions={{ color: "#ffffff", fillColor: "#2563eb", fillOpacity: 0.95, weight: 3 }}
        >
          <Popup>
            <div className="text-sm font-bold text-slate-900">Current iPad location</div>
          </Popup>
        </CircleMarker>
      )}
      {mappedHydrants.map((hydrant) => {
        const position = getHydrantPosition(hydrant);
        const nfpa = getHydrantStyle(hydrant);
        const isSelected = (selectedHydrant?.hydrant_id || selectedHydrant?.location_id) === (hydrant.hydrant_id || hydrant.location_id);

        return (
          <CircleMarker
            key={hydrant.hydrant_id || hydrant.location_id}
            center={position}
            radius={isSelected ? 10 : 7}
            pathOptions={{
              color: "#ffffff",
              fillColor: nfpa.color,
              fillOpacity: 0.92,
              weight: isSelected ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => selectHydrant(hydrant) }}
          >
            <Popup>
              <div className="min-w-[230px] text-slate-900">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black">Hydrant {hydrant.hydrant_id || hydrant.location_id}</p>
                    <p className="text-xs font-semibold text-slate-600">{hydrant.location || hydrant.address || "No location listed"}</p>
                  </div>
                  <span className="rounded px-2 py-1 text-[10px] font-black text-white" style={{ backgroundColor: nfpa.color }}>
                    {nfpa.label}
                  </span>
                </div>
                <dl className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-1 text-xs">
                  <dt className="font-bold text-slate-500">Provider</dt><dd>{hydrant.provider || "Unknown"}</dd>
                  <dt className="font-bold text-slate-500">Flow</dt><dd>{hydrant.flow_gpm ? `${Number(hydrant.flow_gpm).toLocaleString()} GPM` : "Not tested"}</dd>
                  <dt className="font-bold text-slate-500">Status</dt><dd>{hydrant.status || "In Service"}</dd>
                  <dt className="font-bold text-slate-500">Lat/Lon</dt><dd>{position[0].toFixed(6)}, {position[1].toFixed(6)}</dd>
                </dl>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setScreen("inspection")} className="rounded bg-blue-600 px-3 py-2 text-xs font-black text-white">Service</button>
                  <button type="button" onClick={() => setScreen("flow")} className="rounded bg-blue-600 px-3 py-2 text-xs font-black text-white">Flow Test</button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

function MapAutoFrame({ hydrants, selectedHydrant, userLocation }) {
  const map = useMap();

  useEffect(() => {
    const positions = hydrants.map(getHydrantPosition).filter(Boolean).slice(0, 1000);
    if (userLocation) positions.push(userLocation);

    if (!positions.length) {
      map.setView([34.955, -90.055], 12, { animate: true });
      return;
    }

    const bounds = positions.reduce((acc, position) => acc.extend(position), L.latLngBounds(positions[0], positions[0]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
  }, [hydrants, map, selectedHydrant, userLocation]);

  return null;
}

function QuickHydrantCard({ hydrant, selectedPosition, setScreen }) {
  const nfpa = getHydrantStyle(hydrant);

  return (
    <Panel title="Selected Hydrant">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black">{hydrant?.hydrant_id || hydrant?.location_id || "No hydrant selected"}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{hydrant?.location || hydrant?.address || "Choose a hydrant from the map."}</p>
          </div>
          <span className="rounded px-2 py-1 text-xs font-black text-white" style={{ backgroundColor: nfpa.color }}>
            {nfpa.label}
          </span>
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <InfoLine label="Flow" value={hydrant?.flow_gpm ? `${Number(hydrant.flow_gpm).toLocaleString()} GPM` : "Not tested"} />
          <InfoLine label="Provider" value={hydrant?.provider || "Unknown"} />
          <InfoLine label="Status" value={hydrant?.status || "In Service"} />
          <InfoLine label="Latitude / Longitude" value={selectedPosition ? `${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}` : "No GPS"} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ActionButton icon={ClipboardList} label="Service" onClick={() => setScreen("inspection")} />
          <ActionButton icon={Gauge} label="Flow Test" variant="outline" onClick={() => setScreen("flow")} />
        </div>
      </div>
    </Panel>
  );
}

function HydrantQuickRow({ hydrant, onClick }) {
  const nfpa = getHydrantStyle(hydrant);

  return (
    <button type="button" onClick={onClick} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-slate-200 px-4 py-3 text-left hover:bg-red-50">
      <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ backgroundColor: nfpa.color }} />
      <span className="min-w-0">
        <span className="block font-black">{hydrant.hydrant_id || hydrant.location_id}</span>
        <span className="block truncate text-xs font-semibold text-slate-500">{hydrant.location || hydrant.address || "No location"}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <span className="font-black text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function NfpaStandardsPanel() {
  return (
    <Panel title="NFPA Color Standards">
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {nfpaClasses.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3">
            <span className="h-8 w-8 rounded-full shadow-inner" style={{ backgroundColor: item.color }} />
            <div>
              <p className="font-black">{item.label} - {item.text}</p>
              <p className="text-sm font-semibold text-slate-500">{item.range}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
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
