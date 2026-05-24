const fs = require("fs");

const file = "src/pages/HydrantTestingPage.jsx";
let text = fs.readFileSync(file, "utf8");

const before = `          <Field dark label="Weather Conditions" value="72F  Partly Cloudy" onChange={() => {}} />\n`;

if (!text.includes(before)) {
  throw new Error("Expected Weather Conditions field not found");
}

text = text.replace(before, "");
fs.writeFileSync(file, text);
