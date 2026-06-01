export const defaultEmsProtocols = [
  {
    number: "100",
    title: "Firebase Setup Needed",
    category: "EMS",
    keywords: "firebase setup",
    body: [
      "EMS protocols will load from Firebase once appData/emsProtocolsFull is configured.",
      "Keep the full protocol export out of public GitHub."
    ]
  }
];

export const defaultFireSogs = [
  { code: "1", title: "Firebase Setup Needed", page: 1 }
];

export const defaultFireSogDetails = [
  {
    code: "1",
    sourceFile: "",
    fullBlocks: [
      {
        heading: "SOG Storage",
        lines: ["Fire SOG text and source PDFs should be stored in Firebase, not public GitHub."]
      }
    ]
  }
];

export const defaultFireCodes = [
  {
    section: "304",
    title: "Firebase Setup Needed",
    chapter: "3",
    chapterTitle: "General Requirements",
    body: ["Fire code text will load from Firebase once appData/fireCodesFull is configured."],
    searchText: "304 firebase setup fire code"
  }
];

export const defaultFireCodeIndex = [];
export const defaultFireCodePdfSections = [];
export const defaultFireCodeDocxSections = [];

export const defaultHoseInventory = [
  {
    hoseId: "SETUP",
    apparatus: "Firebase",
    apparatusName: "Firebase Setup Needed",
    group: "Firebase",
    diameter: "1.75",
    length: "50 ft",
    sourceFile: "Firebase"
  }
];
