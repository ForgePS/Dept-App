const fs = require("fs");
const oldPath = "C:/Users/jerem/OneDrive/Desktop/Dashboard Files/render-recovery/hydrants.json";
const arcPath = "C:/Users/jerem/Documents/Codex/2026-05-24/prior-conversation-with-codex-conversation-role-2/hydrant-merge/horn-lake-hydrants-arcgis.json";
const outPath = `${__dirname}/src/data/hydrants/hydrants.json`;
const oldWrapper = JSON.parse(fs.readFileSync(oldPath, "utf8"));
const old = oldWrapper.hydrants || [];
const arc = JSON.parse(fs.readFileSync(arcPath, "utf8")).features || [];
const clean = (v) => v == null ? "" : String(v).trim();
const rad = (d) => Number(d) * Math.PI / 180;
const distMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = rad(Number(lat2) - Number(lat1));
  const dLon = rad(Number(lon2) - Number(lon1));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const dateFromMs = (ms) => ms ? new Date(Number(ms)).toISOString().slice(0, 10) : "";
const used = new Set();
let matched = 0;
let unmatched = 0;
const updated = [];
for (const feature of arc) {
  const a = feature.attributes || {};
  const lat = Number(a.LAT ?? feature.geometry?.y);
  const lon = Number(a.LONG ?? feature.geometry?.x);
  let best = null;
  let bestD = Infinity;
  for (const h of old) {
    if (used.has(clean(h.location_id))) continue;
    if (!h.latitude || !h.longitude) continue;
    const d = distMeters(lat, lon, Number(h.latitude), Number(h.longitude));
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  const isMatch = best && bestD <= 35;
  if (isMatch) {
    matched += 1;
    used.add(clean(best.location_id));
  } else {
    unmatched += 1;
  }
  const base = isMatch ? best : {};
  const street = [a.STREET_NUMBER, a.STREET_NAME, a.STREET_TYPE, a.SUF_DIR].map(clean).filter(Boolean).join(" ");
  const address = clean(a.LOCATION) || street || "Hydrant";
  const flow = clean(a.FLOW);
  const status = /^(O|OUT|OUT OF SERVICE)$/i.test(flow) ? "Out of Service" : "In Service";
  updated.push({
    location_id: isMatch ? clean(best.location_id) : clean(a.OBJECTID),
    hydrant_id: clean(a.HYD_ID) || clean(a.OBJECTID),
    official_hydrant_id: clean(a.HYD_ID),
    arcgis_objectid: clean(a.OBJECTID),
    district: isMatch ? clean(best.district) : "",
    location: address,
    address,
    description: [a.HYD_TYPE, a.SUBDIVISION, a.ADDITIONAL].map(clean).filter(Boolean).join(" | "),
    latitude: String(lat),
    longitude: String(lon),
    lat: String(lat),
    lon: String(lon),
    provider: clean(a.Water_Assoc) || clean(base.provider),
    status,
    discharge_size: clean(base.discharge_size),
    flow_gpm: flow,
    flow_result: flow,
    hydrant_type: clean(a.HYD_TYPE),
    pitot_psi: clean(base.pitot_psi),
    static_psi: clean(base.static_psi),
    residual_psi: clean(base.residual_psi),
    last_checked: clean(base.last_checked) || dateFromMs(a.TEST_DATE),
    checked_year: clean(base.checked_year),
    checked_status: clean(base.checked_status),
    checked_source: clean(base.checked_source),
    checked_by: clean(base.checked_by),
    checked_shift: clean(base.checked_shift),
    tested_by: clean(base.tested_by),
    shift: clean(base.shift),
    issue: clean(base.issue),
    alternate_supply: clean(base.alternate_supply),
    notes: clean(base.notes),
    subdivision: clean(a.SUBDIVISION),
    additional: clean(a.ADDITIONAL),
    city: clean(a.CITY),
    fire_response_area: clean(a.Fire_Response_Area),
    water_assoc: clean(a.Water_Assoc),
    source: "DeSoto County GIS ArcGIS Fire Hydrants layer, CITY = Horn Lake",
    updated_at: new Date().toISOString(),
    district_source: isMatch ? clean(best.district_source) || "Preserved from recovered app by coordinate match" : "Unassigned - new ArcGIS record",
    arcgis_match_distance_m: Number.isFinite(bestD) ? Math.round(bestD * 100) / 100 : ""
  });
}
const wrapper = {
  ok: true,
  count: updated.length,
  hydrants: updated,
  merge_summary: {
    arcgis_count: arc.length,
    recovered_app_count: old.length,
    coordinate_matches: matched,
    new_or_unmatched_arcgis_records: unmatched,
    match_threshold_meters: 35,
    generated_at: new Date().toISOString()
  }
};
fs.writeFileSync(outPath, JSON.stringify(wrapper, null, 2));
console.log(JSON.stringify(wrapper.merge_summary, null, 2));
