const fs = require("fs");

const file = "src/pages/HydrantTestingPage.jsx";
let text = fs.readFileSync(file, "utf8");

const replacements = [
  [
`              <Select label="User" value={crew.tested_by} onChange={(value) => updateCrew("tested_by", value)} options={crewUserOptions} />`,
`              <TestedBySearch value={crew.tested_by} onChange={(value) => updateCrew("tested_by", value)} />`
  ],
  [
`function Field({ className = "", dark = false, icon: Icon, label, type = "text", value, onChange }) {`,
`function TestedBySearch({ value, onChange }) {
  const listId = "tested-by-options";

  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-950">User</span>
      <span className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          list={listId}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          className="hydrant-input pl-9"
          placeholder="Start typing a name"
          autoComplete="off"
        />
        <datalist id={listId}>
          {crewUserOptions.filter(Boolean).map((name) => <option key={name} value={name} />)}
        </datalist>
      </span>
    </label>
  );
}

function Field({ className = "", dark = false, icon: Icon, label, type = "text", value, onChange }) {`
  ]
];

for (const [before, after] of replacements) {
  if (!text.includes(before)) {
    throw new Error(`Expected source block not found:\n${before}`);
  }
  text = text.replace(before, after);
}

fs.writeFileSync(file, text);
