const fs = require("fs");

const file = "src/pages/HydrantTestingPage.jsx";
let text = fs.readFileSync(file, "utf8");

const replacements = [
  [
`        <div className="grid gap-4">
          <AerialPanel
            hydrants={visibleHydrants}
            selectedHydrant={form}
            selectHydrant={selectHydrant}
            setScreen={setScreen}
          />
          <NfpaStandardsPanel />
        </div>`,
`        <div className="grid min-h-[720px] gap-4 xl:grid-rows-[minmax(0,1fr)_auto]">
          <AerialPanel
            hydrants={visibleHydrants}
            selectedHydrant={form}
            selectHydrant={selectHydrant}
            setScreen={setScreen}
          />
          <NfpaStandardsPanel />
        </div>`
  ],
  [
`function AerialPanel({ hydrants, selectedHydrant, selectHydrant, setScreen }) {
  return (
    <Panel title="Aerial View" subtitle="Satellite map with hydrant overlays and quick action popups.">
      <div className="h-[420px]">
        <AerialHydrantMap hydrants={hydrants} selectedHydrant={selectedHydrant} selectHydrant={selectHydrant} setScreen={setScreen} />
      </div>
    </Panel>
  );
}`,
`function AerialPanel({ hydrants, selectedHydrant, selectHydrant, setScreen }) {
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
}`
  ]
];

for (const [before, after] of replacements) {
  if (!text.includes(before)) {
    throw new Error(`Expected source block not found:\n${before}`);
  }
  text = text.replace(before, after);
}

fs.writeFileSync(file, text);
