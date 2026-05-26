import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Activity, CheckCircle2, ClipboardCheck, ClipboardList, Download, Droplets, Edit3, FileText, Gauge, Home, LocateFixed, Mail, MapPin, RefreshCcw, Save, Search, Settings, UploadCloud, Wrench } from "lucide-react";

const crewUserOptions = [
  "", "Adam Tutor", "Billy White", "Blake Turnmire", "Brandon Jefferies", "Clay Willingham", "Cole Casey", "Cory Hill", "Gregory Scruggs", "Jay Mitchell", "Jay Wade", "Jeff Tidwell", "Jeremy Johnson", "Jeremy Powell", "John Paul Lavender", "Joseph Gardner", "Justin Correro", "Lee Chillis", "Mike Mallett", "Paul Destefanis", "Shane Headley", "Stephen White", "Steven Whitten", "Timothy Jones", "Troy Vest", "Tyler Lee", "William Sigurdson", "William Sisk"
];
const reportEmailRecipients = ["gscruggs@hornlake.org", "Swhite@hornlake.org", "mmueller@hornlake.org"];

const shiftOptions = ["", "A Shift", "B Shift", "C Shift"];
const inspectionItems = [
  ["No Obstructions", "Area clear and accessible."],
  ["Operable (Turns Open/Closed)", "Operated smoothly."],
  ["Caps Present", "All caps present."],
  ["Threads in Good Condition", "Threads clean and intact."],
  ["Oil Nut Provided", "Oil nut in place."],
  ["Barrel Drains Properly", "Drains as expected."],
  ["Leaks (Valve / Caps / Barrel)", "No leaks detected."],
  ["Steamer Port / Pumper Outlet Good", "Outlet threads good."],
  ["Adequate Clearance (3 ft all sides)", "Meets clearance requirement."]
];
const cityBounds = [[34.928, -90.125], [34.995, -89.965]];
const crewStorageKey = "horn-lake-hydrant-crew-session";
const themeStorageKey = "horn-lake-hydrant-theme";
const crewSessionHours = 8;
const districtOptions = ["All Districts", "1", "2", "3", "Unassigned"];
const flowStandards = [
  { code: "B", className: "Class AA", colorName: "Blue", gpm: "1500+ gpm", color: "#2563eb" },
  { code: "G", className: "Class A", colorName: "Green", gpm: "1000-1499 gpm", color: "#16a34a" },
  { code: "O", className: "Class B", colorName: "Orange", gpm: "500-999 gpm", color: "#f97316" },
  { code: "R", className: "Class C", colorName: "Red", gpm: "0-499 gpm", color: "#dc2626" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function hydrantKey(h) {
  return h.location_id || h.hydrant_id || h.official_hydrant_id || h.arcgis_objectid;
}

function isPrivateHydrant(h) {
  return /P$/i.test(String(h.hydrant_id || h.official_hydrant_id || "").trim());
}

function currentYear() {
  return String(new Date().getFullYear());
}

function isCheckedThisYear(h) {
  if (isPrivateHydrant(h)) return true;
  const year = currentYear();
  return String(h.checked_year || "") === year || String(h.last_checked || "").startsWith(year);
}

function checkedLabel(h) {
  if (isPrivateHydrant(h)) return "Private - Do Not Test";
  return isCheckedThisYear(h) ? `Checked ${currentYear()}` : `Due ${currentYear()}`;
}

function isDueThisYear(h) {
  return !isPrivateHydrant(h) && !isCheckedThisYear(h);
}

function flowStandard(hOrCode) {
  const code = typeof hOrCode === "string" ? hOrCode : String(hOrCode?.flow_result || hOrCode?.flow_gpm || "").trim().toUpperCase();
  return flowStandards.find((item) => item.code === code) || null;
}

function flowColor(h) {
  const status = String(h.status || "").toLowerCase();
  const flow = String(h.flow_result || h.flow_gpm || "").trim().toUpperCase();
  if (isPrivateHydrant(h)) return "#7c3aed";
  if (status.includes("out")) return "#050505";
  const standard = flowStandard(flow);
  if (standard) return standard.color;
  if (flow === "UK" || flow === "UNKNOWN") return "#64748b";
  if (flow === "A") return "#16a34a";
  if (flow === "C") return "#f97316";
  if (flow === "D" || flow === "LOW") return "#dc2626";
  const n = Number(flow.replace(/[^0-9.]/g, ""));
  if (Number.isFinite(n) && n > 0) {
    if (n >= 1000) return "#15803d";
    if (n >= 500) return "#2563eb";
    if (n >= 250) return "#f59e0b";
    return "#dc2626";
  }
  return "#64748b";
}

function flowText(h) {
  if (isPrivateHydrant(h)) return "Private Hydrant (Do Not Test)";
  const standard = flowStandard(h);
  if (standard) return `${standard.className} - ${standard.colorName}`;
  const flow = h.flow_result || h.flow_gpm || "Unknown";
  if (String(h.status || "").toLowerCase().includes("out")) return "Out of Service";
  return flow;
}

function flowGpmText(h) {
  if (isPrivateHydrant(h)) return "Do Not Test";
  return flowStandard(h)?.gpm || displayValue(h.flow_gpm);
}

function newBlankCrew() {
  return { tested_by: "", shift: "", date: today(), district: "All Districts", expires_at: "" };
}

function loadCrewSession() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(crewStorageKey) || "null");
    if (!parsed?.expires_at || Date.now() >= Number(parsed.expires_at)) {
      window.localStorage.removeItem(crewStorageKey);
      return newBlankCrew();
    }
    return { tested_by: parsed.tested_by || "", shift: parsed.shift || "", date: parsed.date || today(), district: parsed.district || "All Districts", expires_at: parsed.expires_at };
  } catch {
    return newBlankCrew();
  }
}

function crewExpiresLabel(crew) {
  if (!crew.expires_at) return "Not set";
  return new Date(Number(crew.expires_at)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function districtMatches(h, district) {
  if (!district || district === "All Districts") return true;
  if (district === "Unassigned") return !String(h.district || "").trim();
  return String(h.district || "") === district;
}

function displayValue(value) {
  return String(value ?? "").trim() || "N/A";
}

const detailFields = [
  ["Hydrant ID", "hydrant_id"],
  ["Official ID", "official_hydrant_id"],
  ["Location ID", "location_id"],
  ["ArcGIS Object", "arcgis_objectid"],
  ["District", "district"],
  ["Address", "address"],
  ["Location", "location"],
  ["Description", "description"],
  ["Hydrant Type", "hydrant_type"],
  ["Flow Result", "flow_result"],
  ["Flow/GPM", "flow_gpm"],
  ["Status", "status"],
  ["Provider", "provider"],
  ["Water Assoc", "water_assoc"],
  ["Subdivision", "subdivision"],
  ["Additional", "additional"],
  ["Fire Response Area", "fire_response_area"],
  ["City", "city"],
  ["Latitude", "latitude"],
  ["Longitude", "longitude"],
  ["Last Checked", "last_checked"],
  ["Checked Year", "checked_year"],
  ["Checked Source", "checked_source"],
  ["Checked By", "checked_by"],
  ["Checked Shift", "checked_shift"],
  ["Static PSI", "static_psi"],
  ["Residual PSI", "residual_psi"],
  ["Pitot PSI", "pitot_psi"],
  ["Discharge Size", "discharge_size"],
  ["Issue", "issue"],
  ["Alternate Supply", "alternate_supply"],
  ["Notes", "notes"],
  ["District Source", "district_source"],
  ["Source", "source"]
];

const editableFields = [
  "hydrant_id",
  "official_hydrant_id",
  "location_id",
  "arcgis_objectid",
  "district",
  "address",
  "location",
  "description",
  "hydrant_type",
  "flow_result",
  "flow_gpm",
  "status",
  "provider",
  "water_assoc",
  "subdivision",
  "additional",
  "fire_response_area",
  "city",
  "latitude",
  "longitude",
  "last_checked",
  "checked_year",
  "checked_status",
  "checked_source",
  "checked_by",
  "checked_shift",
  "static_psi",
  "residual_psi",
  "pitot_psi",
  "discharge_size",
  "issue",
  "alternate_supply",
  "notes",
  "district_source",
  "source"
];

const fieldLabels = Object.fromEntries(detailFields.map(([label, key]) => [key, label]));

function updateList(list, saved) {
  const key = hydrantKey(saved);
  return list.map((h) => hydrantKey(h) === key || h.location_id === saved.location_id || h.hydrant_id === saved.hydrant_id ? saved : h);
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Metric({ icon: Icon, label, value }) {
  return <div className="metric"><Icon size={19} /><span>{label}</span><strong>{value}</strong></div>;
}

function TestedBySearch({ value, onChange }) {
  return <input type="search" list="tested-by-options" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Start typing a name" />;
}

function CrewSessionPanel({ crew, draftCrew, setDraftCrew, setCrewSession, clearCrewSession }) {
  const isSet = Boolean(crew.expires_at);
  return (
    <section className="crew-session-card">
      <div className="section-title">
        <div>
          <strong>Shift Session</strong>
          <span>{isSet ? `Set until ${crewExpiresLabel(crew)}` : "Set user, shift, and date for this browser"}</span>
        </div>
        <span className={isSet ? "session-pill active" : "session-pill"}>{isSet ? "Active" : "Not Set"}</span>
      </div>
      <div className="crew-bar">
        <Field label="User"><TestedBySearch value={draftCrew.tested_by} onChange={(v) => setDraftCrew((c) => ({ ...c, tested_by: v }))} /></Field>
        <Field label="Shift"><select value={draftCrew.shift} onChange={(e) => setDraftCrew((c) => ({ ...c, shift: e.target.value }))}>{shiftOptions.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Date"><input type="date" value={draftCrew.date} onChange={(e) => setDraftCrew((c) => ({ ...c, date: e.target.value }))} /></Field>
        <Field label="District"><select value={draftCrew.district} onChange={(e) => setDraftCrew((c) => ({ ...c, district: e.target.value }))}>{districtOptions.map((d) => <option key={d}>{d}</option>)}</select></Field>
        <div className="crew-actions">
          <button className="primary small" onClick={setCrewSession}>Set Shift</button>
          <button className="secondary small" onClick={clearCrewSession}>Reset</button>
        </div>
      </div>
    </section>
  );
}

function HydrantMap({ hydrants, selected, onSelect }) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markerRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const elRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !elRef.current) return;
    const map = L.map(elRef.current, {
      preferCanvas: true,
      zoomControl: true,
      renderer: L.canvas({ padding: 0.35 })
    });
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri"
    }).addTo(map);
    map.fitBounds(cityBounds, { padding: [24, 24] });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) layerRef.current.remove();
    const group = L.layerGroup().addTo(map);
    const canvasRenderer = L.canvas({ padding: 0.35 });
    const markers = new Map();
    let cancelled = false;
    let index = 0;

    function addChunk() {
      if (cancelled) return;
      const end = Math.min(index + 175, hydrants.length);
      for (; index < end; index += 1) {
        const h = hydrants[index];
      const lat = Number(h.lat || h.latitude);
      const lon = Number(h.lon || h.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const key = hydrantKey(h);
        const isSelected = selected && hydrantKey(selected) === key;
        const marker = L.circleMarker([lat, lon], {
          renderer: canvasRenderer,
          interactive: true,
        radius: selected && hydrantKey(selected) === hydrantKey(h) ? 9 : 6,
          color: isSelected ? "#f8fafc" : "#111827",
          weight: isSelected ? 3 : 1,
        fillColor: flowColor(h),
        fillOpacity: 0.95
      });
      marker.on("click", () => onSelect(h));
      marker.bindPopup(`<b>${h.hydrant_id || h.location_id}</b><br>${h.address || h.location || ""}<br>Flow: ${flowText(h)}<br>${checkedLabel(h)}`);
      marker.addTo(group);
        markers.set(key, marker);
      }
      if (index < hydrants.length) window.requestAnimationFrame(addChunk);
    }

    window.requestAnimationFrame(addChunk);
    layerRef.current = group;
    markerRef.current = markers;
    return () => {
      cancelled = true;
    };
  }, [hydrants, selected, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected) return;
    const lat = Number(selected.lat || selected.latitude);
    const lon = Number(selected.lon || selected.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    map.panTo([lat, lon], { animate: true, duration: 0.35 });
  }, [selected]);

  function locateMe() {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const ll = [pos.coords.latitude, pos.coords.longitude];
      if (userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current = L.marker(ll).addTo(map).bindPopup("You are here").openPopup();
      map.setView(ll, 15);
    });
  }

  function zoomCity() {
    mapRef.current?.fitBounds(cityBounds, { padding: [24, 24] });
  }

  return <section className="map-panel"><div className="map-toolbar"><button onClick={zoomCity}><MapPin size={16} /> City</button><button onClick={locateMe}><LocateFixed size={16} /> Me</button></div><div className="map-legend">{flowStandards.map((item) => <span key={item.code}><i style={{ background: item.color }} />{item.className}</span>)}<span><i style={{ background: "#64748b" }} />Unknown</span><span><i style={{ background: "#7c3aed" }} />Private</span><span><i style={{ background: "#050505" }} />OOS</span></div><div ref={elRef} className="map-canvas" /></section>;
}

function HydrantMiniCard({ hydrant, selected, onSelect }) {
  return (
    <button className={`hydrant-card ${selected ? "selected" : ""}`} onClick={() => onSelect(hydrant)}>
      <div className="hydrant-card-head">
        <span className="dot" style={{ background: flowColor(hydrant) }} />
        <div>
          <strong>{hydrant.hydrant_id || hydrant.location_id}</strong>
          <span>{hydrant.address || hydrant.location}</span>
        </div>
        <em className={isCheckedThisYear(hydrant) ? "checked" : "due"}>{checkedLabel(hydrant)}</em>
      </div>
      <div className="card-facts">
        <span>District <b>{displayValue(hydrant.district)}</b></span>
        <span>Flow <b>{flowText(hydrant)}</b></span>
        <span>GPM <b>{flowGpmText(hydrant)}</b></span>
        <span>Type <b>{displayValue(hydrant.hydrant_type)}</b></span>
        <span>Water <b>{displayValue(hydrant.water_assoc || hydrant.provider)}</b></span>
        {isPrivateHydrant(hydrant) && <span className="private-warning">Private <b>Do Not Test</b></span>}
      </div>
    </button>
  );
}

function HydrantList({ hydrants, selected, onSelect, title = "Hydrant Cards", limit = 250 }) {
  const [query, setQuery] = useState("");
  const filtered = hydrants.filter((h) => [h.hydrant_id, h.location_id, h.official_hydrant_id, h.address, h.location, h.district, h.subdivision, h.water_assoc, h.fire_response_area].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0, limit);
  return <section className="list-panel"><div className="panel-title"><strong>{title}</strong><span>{filtered.length} shown</span></div><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID, address, district, subdivision" /></div><div className="hydrant-list">{filtered.map((h) => <HydrantMiniCard key={hydrantKey(h)} hydrant={h} selected={selected && hydrantKey(selected) === hydrantKey(h)} onSelect={onSelect} />)}</div></section>;
}

function HydrantsPage({ hydrants, selected, onSelect }) {
  const [district, setDistrict] = useState("All Districts");
  const visible = useMemo(() => hydrants.filter((h) => districtMatches(h, district)), [hydrants, district]);
  const counts = useMemo(() => ({
    all: hydrants.length,
    d1: hydrants.filter((h) => String(h.district) === "1").length,
    d2: hydrants.filter((h) => String(h.district) === "2").length,
    d3: hydrants.filter((h) => String(h.district) === "3").length,
    unassigned: hydrants.filter((h) => !String(h.district || "").trim()).length
  }), [hydrants]);
  return (
    <section className="hydrants-page">
      <div className="district-strip">
        {[
          ["All Districts", counts.all],
          ["1", counts.d1],
          ["2", counts.d2],
          ["3", counts.d3],
          ["Unassigned", counts.unassigned]
        ].map(([label, count]) => (
          <button key={label} className={district === label ? "active" : ""} onClick={() => setDistrict(label)}>
            <span>{label === "All Districts" ? "All" : label === "Unassigned" ? "Unassigned" : `District ${label}`}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>
      <HydrantList hydrants={visible} selected={selected} onSelect={onSelect} title="Hydrant List" limit={2000} />
    </section>
  );
}

function Dashboard({ hydrants, selected, onSelect, crew, draftCrew, setDraftCrew, setCrewSession, clearCrewSession }) {
  const visibleHydrants = useMemo(() => hydrants.filter((h) => districtMatches(h, crew.district)), [hydrants, crew.district]);
  const stats = useMemo(() => ({ total: hydrants.length, privateCount: hydrants.filter(isPrivateHydrant).length }), [hydrants]);
  return <div className="dashboard-grid dashboard-no-list"><aside className="left-stack"><CrewSessionPanel crew={crew} draftCrew={draftCrew} setDraftCrew={setDraftCrew} setCrewSession={setCrewSession} clearCrewSession={clearCrewSession} /></aside><section className="dashboard-main"><div className="metrics"><Metric icon={Droplets} label="Hydrants" value={visibleHydrants.length} /><Metric icon={ClipboardList} label="Due This Year" value={visibleHydrants.filter(isDueThisYear).length} /><Metric icon={Activity} label="Out of Service" value={visibleHydrants.filter((h) => flowColor(h) === "#050505").length} /><Metric icon={Settings} label="Private" value={visibleHydrants.filter(isPrivateHydrant).length || stats.privateCount} /></div><HydrantMap hydrants={visibleHydrants} selected={selected} onSelect={onSelect} /><NfpaStandards /></section></div>;
}

function NfpaStandards() {
  return (
    <section className="nfpa-panel">
      <div className="panel-title standards-title"><strong>NFPA Color Standards</strong></div>
      <div className="standards-grid">
        {flowStandards.map((item) => (
          <div key={item.code} className="standard-card">
            <i style={{ background: item.color }} />
            <div><strong>{item.className} - {item.colorName}</strong><span>{item.gpm}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function nfpaClassForGpm(gpm) {
  const n = Number(gpm);
  if (!Number.isFinite(n) || n <= 0) return "Not Tested";
  if (n >= 1500) return "Class AA";
  if (n >= 1000) return "Class A";
  if (n >= 500) return "Class B";
  return "Class C";
}

function flowCodeForGpm(gpm) {
  const label = nfpaClassForGpm(gpm);
  if (label === "Class AA") return "B";
  if (label === "Class A") return "G";
  if (label === "Class B") return "O";
  if (label === "Class C") return "R";
  return "UK";
}

function calculateFlowGpm(dischargeSize, pitotPsi) {
  const diameter = Number(dischargeSize);
  const pitot = Number(pitotPsi);
  if (!Number.isFinite(diameter) || !Number.isFinite(pitot) || pitot <= 0) return "";
  return Math.round(29.83 * 0.9 * diameter ** 2 * Math.sqrt(pitot));
}

function NfpaSelector({ value, onChange }) {
  return (
    <section className="nfpa-selector">
      <Field label="NFPA Color Standard">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {["Class AA", "Class A", "Class B", "Class C", "Out of Service", "Not Tested"].map((option) => <option key={option}>{option}</option>)}
        </select>
      </Field>
      <div className="standards-grid compact-standards">
        {flowStandards.map((item) => (
          <div key={item.code} className="standard-card">
            <i style={{ background: item.color }} />
            <div><strong>{item.className}: {item.gpm}</strong></div>
          </div>
        ))}
        <div className="standard-card"><i style={{ background: "#050505" }} /><div><strong>Out of Service: Unavailable</strong></div></div>
        <div className="standard-card"><i style={{ background: "#64748b" }} /><div><strong>Not Tested: No flow result</strong></div></div>
      </div>
    </section>
  );
}

function HydrantCard({ selected }) {
  if (!selected) return <section className="empty-state"><Droplets size={34} /><strong>No hydrant selected</strong><span>Choose a hydrant from the map or list.</span></section>;
  return (
    <section className="quick-card">
      <div className="selected-head">
        <span className="dot big" style={{ background: flowColor(selected) }} />
        <div>
          <strong>{selected.hydrant_id}</strong>
          <span>{selected.address || selected.location}</span>
        </div>
        <em className={isCheckedThisYear(selected) ? "checked" : "due"}>{checkedLabel(selected)}</em>
      </div>
      {isPrivateHydrant(selected) && <div className="private-banner">Private Hydrant (Do Not Test)</div>}
      <div className="detail-grid">
        {detailFields.map(([label, key]) => (
          <div key={key} className={String(selected[key] || "").length > 42 ? "wide" : ""}>
            <span>{label}</span>
            <strong>{key === "flow_result" || key === "flow_gpm" ? flowText(selected) : displayValue(selected[key])}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function HydrantEditorModal({ hydrant, crew, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(Object.fromEntries(editableFields.map((key) => [key, hydrant?.[key] ?? ""])));
  }, [hydrant]);

  if (!hydrant) return null;

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const payload = {
      ...form,
      original_location_id: hydrant.location_id,
      original_hydrant_id: hydrant.hydrant_id,
      edited_by: crew.tested_by,
      edited_shift: crew.shift,
      edited_date: crew.date,
      edit_source: "Hydrant detail card"
    };
    const res = await fetch("/api/hydrants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setSaving(false);
    if (data.hydrant) onSaved(data.hydrant, "Hydrant information updated");
  }

  const history = Array.isArray(hydrant.edit_history) ? hydrant.edit_history.slice(-5).reverse() : [];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="hydrant-modal">
        <div className="modal-header">
          <div>
            <span className="dot big" style={{ background: flowColor(hydrant) }} />
            <div>
              <strong>{hydrant.hydrant_id || hydrant.location_id}</strong>
              <span>{hydrant.address || hydrant.location || "Hydrant details"}</span>
            </div>
          </div>
          <button className="secondary small" onClick={onClose}>Close</button>
        </div>
        {isPrivateHydrant(hydrant) && <div className="private-banner">Private Hydrant (Do Not Test)</div>}
        <div className="editor-grid">
          {editableFields.map((key) => (
            <Field key={key} label={fieldLabels[key] || key}>
              {key === "notes" || key === "description" || key === "source" || key === "additional" ? (
                <textarea value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)} rows={3} />
              ) : key === "status" ? (
                <select value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)}>
                  {["", "In Service", "Out of Service", "Needs Repair", "Private Hydrant (Do Not Test)"].map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : key === "district" ? (
                <select value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)}>
                  {["", "1", "2", "3"].map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input value={form[key] ?? ""} onChange={(e) => setField(key, e.target.value)} />
              )}
            </Field>
          ))}
        </div>
        <div className="edit-history">
          <strong>Edit History</strong>
          {history.length ? history.map((entry, index) => (
            <span key={`${entry.edited_at}-${index}`}>{displayValue(entry.edited_by)} | {displayValue(entry.edited_shift)} | {displayValue(entry.edited_date)} | {new Date(entry.edited_at).toLocaleString()}</span>
          )) : <span>No edits recorded yet.</span>}
        </div>
        <div className="modal-actions">
          <button className="primary" disabled={saving} onClick={save}><Save size={16} /> {saving ? "Saving" : "Save Hydrant Info"}</button>
        </div>
      </section>
    </div>
  );
}

function HydrantInfoModal({ hydrant, onClose, onEdit }) {
  if (!hydrant) return null;
  const details = [
    ["Hydrant ID", hydrant.hydrant_id],
    ["District", hydrant.district || "Unassigned"],
    ["Provider", hydrant.provider || hydrant.water_assoc],
    ["Lat & Long", `${displayValue(hydrant.latitude)} / ${displayValue(hydrant.longitude)}`],
    ["Hydrant Type", hydrant.hydrant_type],
    ["Flow", flowText(hydrant)],
    ["GPM", flowGpmText(hydrant)]
  ];
  return (
    <div className="modal-backdrop compact" role="dialog" aria-modal="true">
      <section className="hydrant-info-card">
        <div className="info-card-top">
          <span className="dot big" style={{ background: flowColor(hydrant) }} />
          <div>
            <strong>{hydrant.hydrant_id || hydrant.location_id}</strong>
            <span>{hydrant.address || hydrant.location || "Hydrant"}</span>
          </div>
          <button className="icon-close" onClick={onClose}>Close</button>
        </div>
        {isPrivateHydrant(hydrant) && <div className="private-banner compact-banner">Private Hydrant (Do Not Test)</div>}
        <div className="small-detail-grid">
          {details.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{displayValue(value)}</strong>
            </div>
          ))}
        </div>
        <div className="info-card-actions">
          <button className="secondary" onClick={onClose}>Close</button>
          <button className="primary" onClick={onEdit}><Edit3 size={16} /> Edit</button>
        </div>
      </section>
    </div>
  );
}

function Inspection({ selected, crew, onSaved }) {
  const [rows, setRows] = useState([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setRows(inspectionItems.map(([item, note]) => ({ item, result: "Yes", notes: note, repair_needed: "No", photo_name: "", photo_data: "" })));
    setGeneralNotes("");
  }, [selected?.location_id]);

  function updateRow(index, patch) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function uploadPhoto(index, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateRow(index, { photo_name: file.name, photo_data: reader.result });
    reader.readAsDataURL(file);
  }

  function addNote() {
    setRows((current) => [...current, { item: "Additional Note", result: "N/A", notes: "", repair_needed: "No", photo_name: "", photo_data: "" }]);
  }

  async function saveHydrantInfo() {
    if (!selected) return;
    const res = await fetch("/api/hydrants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...selected,
        original_location_id: selected.location_id,
        original_hydrant_id: selected.hydrant_id,
        notes: generalNotes || selected.notes,
        edited_by: crew.tested_by,
        edited_shift: crew.shift,
        edited_date: crew.date,
        edit_source: "Inspection hydrant info"
      })
    });
    const data = await res.json();
    if (data.hydrant) onSaved(data.hydrant, "Hydrant information saved");
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const payload = { location_id: selected.location_id, hydrant_id: selected.hydrant_id, inspected_at: `${crew.date || today()}T12:00:00.000Z`, tested_by: crew.tested_by, shift: crew.shift, checklist: rows, notes: generalNotes };
    const res = await fetch("/api/inspections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (data.hydrant) onSaved(data.hydrant, "Inspection saved");
  }
  return (
    <section className="inspection-page">
      <div className="inspection-shell">
        <div className="inspection-header">
          <div>
            <strong>Hydrant Inspection Checklist</strong>
            <span>{selected ? `${selected.hydrant_id} | District ${displayValue(selected.district)} | ${displayValue(selected.latitude)}, ${displayValue(selected.longitude)}` : "Select a hydrant before completing inspection."}</span>
          </div>
          <button className="secondary small" onClick={() => setRows((current) => current.map((row) => ({ ...row, expanded: !row.expanded })))}>Expand All</button>
        </div>
        <div className="inspection-table">
          <div className="inspection-row table-head">
            <span>Item</span><span>Yes</span><span>No</span><span>N/A</span><span>Notes / Details</span><span>Photo</span><span>Repair Needed</span>
          </div>
          {rows.map((row, index) => (
            <div className="inspection-row" key={`${row.item}-${index}`}>
              <strong>{row.item}</strong>
              {["Yes", "No", "N/A"].map((choice) => (
                <button key={choice} className={row.result === choice ? "choice active" : "choice"} onClick={() => updateRow(index, { result: choice })}>{choice}</button>
              ))}
              <input value={row.notes} onChange={(e) => updateRow(index, { notes: e.target.value })} />
              <label className="photo-upload">
                <input type="file" accept="image/*" capture="environment" onChange={(e) => uploadPhoto(index, e.target.files?.[0])} />
                <span>{row.photo_name ? row.photo_name : "Photo"}</span>
              </label>
              <select value={row.repair_needed} onChange={(e) => updateRow(index, { repair_needed: e.target.value })}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
          ))}
        </div>
        <Field label="General Notes"><textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} rows={3} placeholder="Inspection notes..." /></Field>
        <div className="inspection-actions">
          <button className="secondary" onClick={addNote}><FileText size={16} /> Add Note</button>
          <button className="secondary" disabled={!selected} onClick={saveHydrantInfo}><Save size={16} /> Save Hydrant Info</button>
          <button className="primary" disabled={!selected || saving} onClick={save}><CheckCircle2 size={16} /> {saving ? "Saving" : "Complete Inspection"}</button>
        </div>
      </div>
    </section>
  );
}

function FlowTest({ selected, crew, onSaved }) {
  const [info, setInfo] = useState({ hydrant_id: "", district: "", gps: "", provider: "", status: "In Service", notes: "" });
  const [form, setForm] = useState({ discharge_size: "2.5", pitot_psi: "", static_psi: "", residual_psi: "", status: "In Service", notes: "", nfpa_class: "Not Tested" });
  const calculatedFlow = calculateFlowGpm(form.discharge_size, form.pitot_psi);
  useEffect(() => {
    setInfo({
      hydrant_id: selected?.hydrant_id || "",
      district: selected?.district || "",
      gps: selected ? `${selected.latitude || selected.lat || ""}, ${selected.longitude || selected.lon || ""}` : "",
      provider: selected?.provider || selected?.water_assoc || "",
      status: selected?.status || "In Service",
      notes: selected?.notes || ""
    });
    const initialFlow = selected?.flow_result ? flowText(selected) : "Not Tested";
    setForm({ discharge_size: selected?.discharge_size || "2.5", pitot_psi: selected?.pitot_psi || "", static_psi: selected?.static_psi || "", residual_psi: selected?.residual_psi || "", status: selected?.status || "In Service", notes: "", nfpa_class: initialFlow.startsWith("Class") ? initialFlow.split(" - ")[0] : "Not Tested" });
  }, [selected?.location_id]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setInfoField = (k, v) => setInfo((f) => ({ ...f, [k]: v }));
  useEffect(() => {
    if (!calculatedFlow) return;
    setForm((current) => ({ ...current, nfpa_class: nfpaClassForGpm(calculatedFlow) }));
  }, [calculatedFlow]);

  async function saveHydrantInfo() {
    if (!selected) return;
    const [latitude, longitude] = info.gps.split(",").map((item) => item.trim());
    const payload = {
      original_location_id: selected.location_id,
      original_hydrant_id: selected.hydrant_id,
      location_id: selected.location_id,
      hydrant_id: info.hydrant_id,
      district: info.district,
      latitude: latitude || selected.latitude,
      lat: latitude || selected.lat,
      longitude: longitude || selected.longitude,
      lon: longitude || selected.lon,
      provider: info.provider,
      water_assoc: info.provider,
      status: info.status,
      notes: info.notes,
      edited_by: crew.tested_by,
      edited_shift: crew.shift,
      edited_date: crew.date,
      edit_source: "Flow test hydrant info"
    };
    const res = await fetch("/api/hydrants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.hydrant) onSaved(data.hydrant, "Hydrant information saved");
  }

  async function save() {
    if (!selected) return;
    const flowCode = form.status === "Out of Service" ? "OOS" : flowCodeForGpm(calculatedFlow);
    const test = { ...form, flow_gpm: calculatedFlow, flow_result: flowCode, location_id: selected.location_id, hydrant_id: info.hydrant_id || selected.hydrant_id, district: info.district, tested_at: `${crew.date || today()}T12:00:00.000Z`, tested_by: crew.tested_by, shift: crew.shift };
    const res = await fetch("/api/tests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(test) });
    const data = await res.json();
    if (data.hydrant) {
      const saveInfo = await fetch("/api/hydrants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.hydrant,
          original_location_id: data.hydrant.location_id,
          original_hydrant_id: data.hydrant.hydrant_id,
          hydrant_id: info.hydrant_id || data.hydrant.hydrant_id,
          district: info.district,
          provider: info.provider,
          water_assoc: info.provider,
          status: form.status,
          discharge_size: form.discharge_size,
          pitot_psi: form.pitot_psi,
          static_psi: form.static_psi,
          residual_psi: form.residual_psi,
          flow_gpm: calculatedFlow,
          flow_result: flowCode,
          notes: info.notes || data.hydrant.notes,
          edited_by: crew.tested_by,
          edited_shift: crew.shift,
          edited_date: crew.date,
          edit_source: "Flow test"
        })
      });
      const infoData = await saveInfo.json();
      onSaved(infoData.hydrant || data.hydrant, "Flow test saved");
    }
  }
  return (
    <div className="flow-page">
      <section className="form-panel hydrant-info-panel">
        <h2>Hydrant Info</h2>
        <p className="panel-subtitle">Save hydrant details without creating a flow test.</p>
        <div className="stacked-fields">
          <Field label="Hydrant ID"><input value={info.hydrant_id} onChange={(e) => setInfoField("hydrant_id", e.target.value)} /></Field>
          <Field label="District"><select value={info.district} onChange={(e) => setInfoField("district", e.target.value)}>{["", "1", "2", "3"].map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="GPS Lat & Long"><input value={info.gps} onChange={(e) => setInfoField("gps", e.target.value)} placeholder="34.000000, -90.000000" /></Field>
          <Field label="Provider"><input value={info.provider} onChange={(e) => setInfoField("provider", e.target.value)} /></Field>
          <Field label="Status"><select value={info.status} onChange={(e) => setInfoField("status", e.target.value)}>{["In Service", "Out of Service", "Needs Repair", "Private Hydrant (Do Not Test)"].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Hydrant Notes"><textarea value={info.notes} onChange={(e) => setInfoField("notes", e.target.value)} rows={5} placeholder="Enter hydrant notes..." /></Field>
        </div>
        <button className="primary wide-button" disabled={!selected} onClick={saveHydrantInfo}><Droplets size={16} /> Save Hydrant Info</button>
      </section>
      <section className="form-panel flow-test-panel">
        <h2>Flow Test</h2>
        <p className="panel-subtitle">Record pitot, static, residual, and NFPA color classification.</p>
        <div className="flow-grid">
          <Field label="Hydrant ID"><input value={info.hydrant_id} onChange={(e) => setInfoField("hydrant_id", e.target.value)} /></Field>
          <Field label="District"><select value={info.district} onChange={(e) => setInfoField("district", e.target.value)}>{["", "1", "2", "3"].map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="GPS Long & Lat"><input value={info.gps} onChange={(e) => setInfoField("gps", e.target.value)} /></Field>
          <Field label="Discharge Size"><select value={form.discharge_size} onChange={(e) => set("discharge_size", e.target.value)}>{["2", "2.25", "2.5"].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Pitot PSI"><input type="number" min="0" step="0.1" value={form.pitot_psi} onChange={(e) => set("pitot_psi", e.target.value)} /></Field>
          <Field label="Static PSI"><input type="number" min="0" step="0.1" value={form.static_psi} onChange={(e) => set("static_psi", e.target.value)} /></Field>
          <Field label="Residual PSI"><input type="number" min="0" step="0.1" value={form.residual_psi} onChange={(e) => set("residual_psi", e.target.value)} /></Field>
          <section className="calc-card">
            <strong>Flow GPM (Calculated)</strong>
            <b>{calculatedFlow || "--"}</b>
            <span>29.83 x 0.9 x discharge size^2 x sqrt(pitot PSI)</span>
          </section>
          <NfpaSelector value={form.nfpa_class} onChange={(value) => set("nfpa_class", value)} />
          <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)}>{["In Service", "Out of Service", "Needs Repair", "Private Hydrant (Do Not Test)"].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} placeholder="Enter notes..." /></Field>
        </div>
        <div className="flow-actions"><button className="primary" disabled={!selected} onClick={save}><Save size={16} /> Save Test</button><button className="secondary" disabled={!selected} onClick={saveHydrantInfo}><Droplets size={16} /> Save Hydrant Info</button><button className="secondary" disabled={!selected} onClick={() => selected && window.scrollTo({ top: 0, behavior: "smooth" })}><MapPin size={16} /> View on Map</button></div>
      </section>
    </div>
  );
}

function Reports({ crew }) {
  const [emails, setEmails] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(reportEmailRecipients[0]);
  const [message, setMessage] = useState("");
  const date = crew.date || today();
  function addRecipient() {
    const parts = emails.split(/[;,\n]/).map((x) => x.trim()).filter(Boolean);
    if (!selectedRecipient || parts.some((email) => email.toLowerCase() === selectedRecipient.toLowerCase())) return;
    setEmails([...parts, selectedRecipient].join(", "));
  }
  function clearRecipients() {
    setEmails("");
  }
  async function emailCsv() {
    setMessage("Sending...");
    const res = await fetch("/api/daily-activity/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, emails }) });
    const data = await res.json();
    setMessage(data.message || (data.ok ? "Daily activity request handled" : data.error || "Email failed"));
  }
  return (
    <section className="form-panel reports">
      <h2>Reports</h2>
      <div className="report-actions">
        <a className="button" href="/api/hydrants/export"><Download size={16} /> Hydrants CSV</a>
        <a className="button" href={`/api/daily-activity/export?date=${date}`}><Download size={16} /> Daily Activity CSV</a>
        <a className="button" href="/sample-daily-activity-report.csv"><Download size={16} /> Sample Daily Activity</a>
      </div>
      <div className="recipient-row">
        <Field label="Saved Recipients">
          <select value={selectedRecipient} onChange={(e) => setSelectedRecipient(e.target.value)}>
            {reportEmailRecipients.map((email) => <option key={email}>{email}</option>)}
          </select>
        </Field>
        <button className="secondary" onClick={addRecipient}>Add Recipient</button>
        <button className="secondary" onClick={clearRecipients}>Clear</button>
      </div>
      <Field label="Daily Activity Email Recipients">
        <textarea value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" rows={4} />
      </Field>
      <button className="primary" onClick={emailCsv}><Mail size={16} /> Email Daily Activity</button>
      {message && <p className="status-line">{message}</p>}
    </section>
  );
}

function SettingsPage({ theme, setTheme }) {
  const darkMode = theme === "dark";
  function toggleTheme() {
    const next = darkMode ? "light" : "dark";
    window.localStorage.setItem(themeStorageKey, next);
    setTheme(next);
  }
  return (
    <section className="settings-page module-page">
      <div className="module-card">
        <div className="module-card-header">
          <strong>Display Settings</strong>
          <span>Applies only to this device/browser.</span>
        </div>
        <div className="setting-row">
          <div>
            <strong>Dark Mode</strong>
            <span>Use the dark inspection-style theme across the hydrant module.</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
            <span />
          </label>
        </div>
      </div>
    </section>
  );
}

function SyncImportPage() {
  return (
    <section className="sync-page module-page">
      <div className="module-card">
        <div className="module-card-header">
          <strong>ImageTrend Elite Sync</strong>
          <span>Planned integration workflow for daily activity and hydrant testing records.</span>
        </div>
        <div className="integration-grid">
          <div>
            <strong>Recommended Path</strong>
            <p>Use ImageTrend Elite's approved integration/export method for your agency. Most agencies handle this through ImageTrend support, state EMS/fire reporting admins, or an authorized API/export interface.</p>
          </div>
          <div>
            <strong>Data To Send</strong>
            <p>Daily activity CSV, flow test records, inspection completion, hydrant ID, district, user, shift, date/time, NFPA class, calculated GPM, repair needed, and notes.</p>
          </div>
          <div>
            <strong>Needed From ImageTrend</strong>
            <p>Endpoint or import template, authentication method, required field names, accepted file format, and whether photo attachments are supported.</p>
          </div>
          <div>
            <strong>Current App Support</strong>
            <p>The app already creates daily activity and hydrant CSV exports. Once Elite's import/API format is known, this page can send or format records directly.</p>
          </div>
        </div>
      </div>
      <div className="module-card">
        <div className="module-card-header">
          <strong>Sync Configuration</strong>
          <span>These fields are placeholders until your agency confirms the Elite connection method.</span>
        </div>
        <div className="form-grid">
          <Field label="Elite Endpoint / Import URL"><input placeholder="Provided by ImageTrend or agency admin" /></Field>
          <Field label="Agency / Department ID"><input placeholder="Horn Lake Fire/EMS identifier" /></Field>
          <Field label="Export Format"><select defaultValue="Daily Activity CSV"><option>Daily Activity CSV</option><option>Elite API JSON</option><option>Custom Import Template</option></select></Field>
          <Field label="Sync Mode"><select defaultValue="Manual Review"><option>Manual Review</option><option>Auto Send Daily</option><option>Export Only</option></select></Field>
        </div>
        <div className="report-actions">
          <a className="button" href="/sample-daily-activity-report.csv"><Download size={16} /> Sample Activity CSV</a>
          <a className="button" href="/api/daily-activity/export"><Download size={16} /> Today's Activity CSV</a>
        </div>
      </div>
    </section>
  );
}

export default function HydrantTestingPage() {
  const [hydrants, setHydrants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailHydrant, setDetailHydrant] = useState(null);
  const [editorHydrant, setEditorHydrant] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState("");
  const [crew, setCrew] = useState(newBlankCrew);
  const [draftCrew, setDraftCrew] = useState(newBlankCrew);
  async function load() {
    const res = await fetch("/api/hydrants");
    const data = await res.json();
    setHydrants(data.hydrants || []);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);
  useEffect(() => {
    const loaded = loadCrewSession();
    setCrew(loaded);
    setDraftCrew({ tested_by: loaded.tested_by, shift: loaded.shift, date: loaded.date || today(), district: loaded.district || "All Districts", expires_at: loaded.expires_at });
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setCrew((current) => {
        if (!current.expires_at || Date.now() < Number(current.expires_at)) return current;
        window.localStorage.removeItem(crewStorageKey);
        const blank = newBlankCrew();
        setDraftCrew(blank);
        setToast("Shift session expired");
        return blank;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);
  function setCrewSession() {
    const next = { ...draftCrew, date: draftCrew.date || today(), expires_at: String(Date.now() + crewSessionHours * 60 * 60 * 1000) };
    window.localStorage.setItem(crewStorageKey, JSON.stringify(next));
    setCrew(next);
    setDraftCrew(next);
    setToast("Shift session set for 8 hours");
  }
  function clearCrewSession() {
    window.localStorage.removeItem(crewStorageKey);
    const blank = newBlankCrew();
    setCrew(blank);
    setDraftCrew(blank);
    setToast("Shift session reset");
  }
  function saved(hydrant, msg) {
    setHydrants((list) => updateList(list, hydrant));
    setSelected(hydrant);
    setDetailHydrant(hydrant);
    setEditorHydrant(null);
    setToast(msg);
  }
  function chooseHydrant(hydrant) {
    setSelected(hydrant);
    setDetailHydrant(hydrant);
  }
  const tabTitle = {
    dashboard: "Dashboard",
    hydrants: "Hydrants",
    flow: "Flow Tests",
    inspection: "Inspections",
    reports: "Reports",
    sync: "Sync / Import",
    settings: "Settings"
  }[tab] || "Dashboard";
  return (
    <main className={`app-shell ${theme === "light" ? "light-theme" : ""}`}>
      <datalist id="tested-by-options">{crewUserOptions.map((name) => <option key={name} value={name} />)}</datalist>
      <aside className="side-nav">
        <div className="brand-mark"><img src="/horn-lake-fire-logo.png" alt="Horn Lake Fire Department" /><strong>HYDRANT<br />TESTING</strong></div>
        <nav>
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}><Home size={16} /> Dashboard</button>
          <button className={tab === "hydrants" ? "active" : ""} onClick={() => setTab("hydrants")}><Droplets size={16} /> Hydrants</button>
          <button className={tab === "flow" ? "active" : ""} onClick={() => setTab("flow")}><Gauge size={16} /> Flow Tests</button>
          <button className={tab === "inspection" ? "active" : ""} onClick={() => setTab("inspection")}><ClipboardCheck size={16} /> Inspections</button>
          <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}><FileText size={16} /> Reports</button>
          <button className={tab === "sync" ? "active" : ""} onClick={() => setTab("sync")}><UploadCloud size={16} /> Sync / Import</button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}><Settings size={16} /> Settings</button>
        </nav>
        <div className="side-user"><span>HLFD</span><div><strong>{crew.tested_by || "Field User"}</strong><em>{crew.shift || "No Shift Set"}</em></div></div>
      </aside>
      <section className="main-stage">
        <header className="topbar"><div><div><strong>{tabTitle}</strong><span>Horn Lake Fire Department</span></div></div><div className="topbar-actions"><span className="module-chip">Hydrant Testing</span><button onClick={load}><RefreshCcw size={16} /> Refresh</button></div></header>
        <nav className="ipad-tabs">
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}><Home size={16} /> Dashboard</button>
          <button className={tab === "hydrants" ? "active" : ""} onClick={() => setTab("hydrants")}><Droplets size={16} /> Hydrants</button>
          <button className={tab === "flow" ? "active" : ""} onClick={() => setTab("flow")}><Gauge size={16} /> Flow</button>
          <button className={tab === "inspection" ? "active" : ""} onClick={() => setTab("inspection")}><ClipboardCheck size={16} /> Inspections</button>
          <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}><FileText size={16} /> Reports</button>
          <button className={tab === "sync" ? "active" : ""} onClick={() => setTab("sync")}><UploadCloud size={16} /> Sync</button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}><Settings size={16} /> Settings</button>
        </nav>
        {toast && <div className="toast"><CheckCircle2 size={16} /> {toast}</div>}
        <section className="page-body">{tab === "dashboard" && <Dashboard hydrants={hydrants} selected={selected} onSelect={chooseHydrant} crew={crew} draftCrew={draftCrew} setDraftCrew={setDraftCrew} setCrewSession={setCrewSession} clearCrewSession={clearCrewSession} />}{tab === "hydrants" && <HydrantsPage hydrants={hydrants} selected={selected} onSelect={chooseHydrant} />}{tab === "inspection" && <Inspection selected={selected} crew={crew} onSaved={saved} />}{tab === "flow" && <FlowTest selected={selected} crew={crew} onSaved={saved} />}{tab === "reports" && <Reports crew={crew} />}{tab === "sync" && <SyncImportPage />}{tab === "settings" && <SettingsPage theme={theme} setTheme={setTheme} />}</section>
      </section>
      {detailHydrant && <HydrantInfoModal hydrant={detailHydrant} onClose={() => setDetailHydrant(null)} onEdit={() => { setEditorHydrant(detailHydrant); setDetailHydrant(null); }} />}
      {editorHydrant && <HydrantEditorModal hydrant={editorHydrant} crew={crew} onClose={() => setEditorHydrant(null)} onSaved={saved} />}
    </main>
  );
}
