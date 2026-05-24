const fs = require('fs');
const file = 'src/pages/HydrantTestingPage.jsx';
let src = fs.readFileSync(file, 'utf8');

const replace = (from, to, label) => {
  if (!src.includes(from)) throw new Error(`Missing pattern: ${label}`);
  src = src.replace(from, to);
};

replace(`              form={form}
              crew={crew}
              inspectionRows={inspectionRows}`, `              form={form}
              crew={crew}
              handleHydrantIdInput={handleHydrantIdInput}
              inspectionRows={inspectionRows}`, 'pass hydrant id handler to inspection');

replace(`              <Field label="Date / Time" type="datetime-local" value={crew.tested_at} onChange={(value) => updateCrew("tested_at", value)} />`, `              <Field label="Date / Time" type="datetime-local" value={crew.tested_at} onChange={(value) => updateCrew("tested_at", value)} icon={CalendarDays} />`, 'date icon on dashboard');

replace(`function InspectionScreen({ form, crew, inspectionRows, updateForm, updateInspectionRow, saveInspection, saveHydrant }) {`, `function InspectionScreen({ form, crew, handleHydrantIdInput, inspectionRows, updateForm, updateInspectionRow, saveInspection, saveHydrant }) {`, 'inspection handler prop');

replace(`          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 lg:col-span-2">
            <p className="text-xs font-black uppercase text-white/60">Crew</p>
            <p className="mt-1 text-sm font-bold">{crew.tested_by || "Field User"} - {crew.shift || "A"} Shift</p>
            <p className="mt-1 text-xs font-semibold text-white/70">{crew.tested_at ? new Date(crew.tested_at).toLocaleString() : "No date selected"}</p>
          </div>
          <Select dark label="District" value={form.district} onChange={(value) => updateForm("district", value)} options={["1", "2", "3"]} />`, `          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 lg:col-span-2">
            <p className="text-xs font-black uppercase text-white/60">Crew</p>
            <p className="mt-1 text-sm font-bold">{crew.tested_by || "Field User"} - {crew.shift || "A"} Shift</p>
            <p className="mt-1 text-xs font-semibold text-white/70">{crew.tested_at ? new Date(crew.tested_at).toLocaleString() : "No date selected"}</p>
          </div>
          <Field dark label="Hydrant ID" value={form.hydrant_id || form.location_id || ""} onChange={handleHydrantIdInput} icon={Droplets} />
          <Select dark label="District" value={form.district} onChange={(value) => updateForm("district", value)} options={["1", "2", "3"]} />`, 'inspection hydrant id field');

replace(`function AerialHydrantMap({ hydrants, selectedHydrant, selectHydrant, setScreen }) {
  const [userLocation, setUserLocation] = useState(null);
  const mappedHydrants = hydrants.filter((hydrant) => getHydrantPosition(hydrant));
  const selectedPosition = userLocation || getHydrantPosition(selectedHydrant) || getHydrantPosition(mappedHydrants[0]) || [34.955, -90.034];`, `function AerialHydrantMap({ hydrants, selectedHydrant, selectHydrant, setScreen }) {
  const [userLocation, setUserLocation] = useState(null);
  const mappedHydrants = hydrants.filter((hydrant) => getHydrantPosition(hydrant));
  const cityCenter = [34.955, -90.055];`, 'city center map setup');

replace(`<MapContainer center={selectedPosition} zoom={15} className="h-full w-full" scrollWheelZoom>`, `<MapContainer center={cityCenter} zoom={12} className="h-full w-full" scrollWheelZoom>`, 'city zoom map container');

replace(`function MapAutoFrame({ hydrants, selectedHydrant, userLocation }) {
  const map = useMap();
  const centeredOnUser = useRef(false);

  useEffect(() => {
    if (userLocation && !centeredOnUser.current) {
      map.setView(userLocation, 17, { animate: true });
      centeredOnUser.current = true;
      return;
    }

    const selectedPosition = getHydrantPosition(selectedHydrant);
    if (selectedPosition) {
      map.setView(selectedPosition, 17, { animate: true });
      return;
    }

    const positions = hydrants.map(getHydrantPosition).filter(Boolean).slice(0, 500);
    if (!positions.length) return;

    const bounds = positions.reduce((acc, position) => acc.extend(position), L.latLngBounds(positions[0], positions[0]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [hydrants, map, selectedHydrant, userLocation]);

  return null;
}`, `function MapAutoFrame({ hydrants, selectedHydrant, userLocation }) {
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
}`, 'city-wide map autoframe');

fs.writeFileSync(file, src);
