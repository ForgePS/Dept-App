const fs = require("fs");

const file = "src/pages/HydrantTestingPage.jsx";
let text = fs.readFileSync(file, "utf8");

const before = `const crewUserOptions = ["", "Field User", "John Smith", "Jeremy Powell"];`;
const after = `const crewUserOptions = [
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
];`;

if (!text.includes(before)) {
  throw new Error("Expected crewUserOptions block not found");
}

text = text.replace(before, after);
fs.writeFileSync(file, text);
