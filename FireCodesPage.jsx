import { useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, FileText, Search, X } from "lucide-react";

const BASE_URL = "https://up.codes/viewer/international/ifc-2024";

const TOC = [
  {
    part: "Part I â Administrative",
    chapters: [
      { num: 1, title: "Scope and Administration", pages: "1-1 â 1-46", anchor: "chapter-1", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/1f0d62629_100-ScopeandAdministration.pdf" },
      { num: 2, title: "Definitions", pages: "2-1 â 2-168", anchor: "chapter-2" },
    ],
  },
  {
    part: "Part II â General Safety Provisions",
    chapters: [
      { num: 3, title: "General Requirements", pages: "3-1 â 3-40", anchor: "chapter-3", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/7717959fa_300-GeneralRequirements.pdf" },
      { num: 4, title: "Emergency Planning and Preparedness", pages: "4-1 â 4-30", anchor: "chapter-4", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/5218c4465_400-EmergencyPlanningandPreparedness.pdf" },
    ],
  },
  {
    part: "Part III â Building and Equipment Design Features",
    chapters: [
      { num: 5, title: "Fire Service Features", pages: "5-1 â 5-28", anchor: "chapter-5", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/5063b3fec_500-FireServiceFeatures.pdf" },
      { num: 6, title: "Building Services and Systems", pages: "6-1 â 6-32", anchor: "chapter-6", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/9da71b8e8_600-BuildingServicesandSystems.pdf" },
      { num: 7, title: "Fire and Smoke Protection Features", pages: "7-1 â 7-8", anchor: "chapter-7", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/2023e1848_700-FireandSmokeProtectionFetures.pdf" },
      { num: 8, title: "Interior Finish, Decorative Materials and Furnishings", pages: "8-1 â 8-34", anchor: "chapter-8", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/76e9f0dcb_800-InteriorFinishDecorativeMaterialsandFurnishings.pdf" },
      { num: 9, title: "Fire Protection and Life Safety Systems", pages: "9-1 â 9-174", anchor: "chapter-9" },
      { num: 10, title: "Means of Egress", pages: "10-1 â 10-260", anchor: "chapter-10" },
      { num: 11, title: "Construction Requirements for Existing Buildings", pages: "11-1 â 11-38", anchor: "chapter-11", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/d2ae2ca5c_1100-ConstructionRequirementsforExhistingBuildings.pdf" },
      { num: 12, title: "Energy Systems", pages: "12-1 â 12-48", anchor: "chapter-12", pdfUrl: "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/25e15ac1a_1200-EnergySystems.pdf" },
    ],
  },
  {
    part: "Part IV â Special Occupancies and Operations",
    chapters: [
      { num: 20, title: "Aviation Facilities", pages: "20-1 â 20-24", anchor: "chapter-20" },
      { num: 21, title: "Dry Cleaning", pages: "21-1 â 21-14", anchor: "chapter-21" },
      { num: 22, title: "Combustible Dust-Producing Operations", pages: "22-1 â 22-14", anchor: "chapter-22" },
      { num: 23, title: "Motor Fuel-Dispensing Facilities and Repair Garages", pages: "23-1 â 23-46", anchor: "chapter-23" },
      { num: 24, title: "Flammable Finishes", pages: "24-1 â 24-42", anchor: "chapter-24" },
      { num: 25, title: "Fruit and Crop Ripening", pages: "25-1 â 25-4", anchor: "chapter-25" },
      { num: 26, title: "Fumigation and Insecticidal Fogging", pages: "26-1 â 26-10", anchor: "chapter-26" },
      { num: 27, title: "Semiconductor Fabrication Facilities", pages: "27-1 â 27-26", anchor: "chapter-27" },
      { num: 28, title: "Lumber Yards and Agro-Industrial, Solid Biomass and Woodworking Facilities", pages: "28-1 â 28-16", anchor: "chapter-28" },
      { num: 29, title: "Manufacture of Organic Coatings", pages: "29-1 â 29-12", anchor: "chapter-29" },
      { num: 30, title: "Industrial Ovens", pages: "30-1 â 30-4", anchor: "chapter-30" },
      { num: 31, title: "Tents, Temporary Special Event Structures and Other Membrane Structures", pages: "31-1 â 31-30", anchor: "chapter-31" },
      { num: 32, title: "High-Piled Combustible Storage", pages: "32-1 â 32-62", anchor: "chapter-32" },
      { num: 33, title: "Fire Safety During Construction and Demolition", pages: "33-1 â 33-22", anchor: "chapter-33" },
      { num: 34, title: "Tire Rebuilding and Tire Storage", pages: "34-1 â 34-6", anchor: "chapter-34" },
      { num: 35, title: "Welding and Other Hot Work", pages: "35-1 â 35-12", anchor: "chapter-35" },
      { num: 36, title: "Marinas", pages: "36-1 â 36-6", anchor: "chapter-36" },
      { num: 37, title: "Combustible Fibers", pages: "37-1 â 37-4", anchor: "chapter-37" },
      { num: 38, title: "Higher Education Laboratories", pages: "38-1 â 38-10", anchor: "chapter-38" },
      { num: 39, title: "Processing and Extraction Facilities", pages: "39-1 â 39-8", anchor: "chapter-39" },
      { num: 40, title: "Storage of Distilled Spirits and Wines", pages: "40-1 â 40-20", anchor: "chapter-40" },
      { num: 41, title: "Temporary Heating and Cooking Operations", pages: "41-1 â 41-10", anchor: "chapter-41" },
    ],
  },
  {
    part: "Part V â Hazardous Materials",
    chapters: [
      { num: 50, title: "Hazardous Materials â General Provisions", pages: "50-1 â 50-58", anchor: "chapter-50" },
      { num: 51, title: "Aerosols", pages: "51-1 â 51-26", anchor: "chapter-51" },
      { num: 53, title: "Compressed Gases", pages: "53-1 â 53-20", anchor: "chapter-53" },
      { num: 54, title: "Corrosive Materials", pages: "54-1 â 54-4", anchor: "chapter-54" },
      { num: 55, title: "Cryogenic Fluids", pages: "55-1 â 55-12", anchor: "chapter-55" },
      { num: 56, title: "Explosives and Fireworks", pages: "56-1 â 56-38", anchor: "chapter-56" },
      { num: 57, title: "Flammable and Combustible Liquids", pages: "57-1 â 57-90", anchor: "chapter-57" },
      { num: 58, title: "Flammable Gases and Flammable Cryogenic Fluids", pages: "58-1 â 58-14", anchor: "chapter-58" },
      { num: 59, title: "Flammable Solids", pages: "59-1 â 59-8", anchor: "chapter-59" },
      { num: 60, title: "Highly Toxic and Toxic Materials", pages: "60-1 â 60-20", anchor: "chapter-60" },
      { num: 61, title: "Liquefied Petroleum Gases", pages: "61-1 â 61-24", anchor: "chapter-61" },
      { num: 62, title: "Organic Peroxides", pages: "62-1 â 62-8", anchor: "chapter-62" },
      { num: 63, title: "Oxidizers, Oxidizing Gases and Oxidizing Cryogenic Fluids", pages: "63-1 â 63-14", anchor: "chapter-63" },
      { num: 64, title: "Pyrophoric Materials", pages: "64-1 â 64-6", anchor: "chapter-64" },
      { num: 65, title: "Pyroxylin (Cellulose Nitrate) Plastics", pages: "65-1 â 65-4", anchor: "chapter-65" },
      { num: 66, title: "Unstable (Reactive) Materials", pages: "66-1 â 66-6", anchor: "chapter-66" },
      { num: 67, title: "Water-Reactive Solids and Liquids", pages: "67-1 â 67-6", anchor: "chapter-67" },
    ],
  },
  {
    part: "Part VI â Referenced Standards",
    chapters: [
      { num: 80, title: "Referenced Standards", pages: "80-1 â 80-16", anchor: "chapter-80" },
    ],
  },
  {
    part: "Part VII â Appendices",
    chapters: [
      { num: "A", title: "Board of Appeals", pages: "A-1 â A-4", anchor: "appendix-a" },
      { num: "B", title: "Fire-Flow Requirements for Buildings", pages: "B-1 â B-10", anchor: "appendix-b" },
      { num: "C", title: "Fire Hydrant Locations and Distribution", pages: "C-1 â C-6", anchor: "appendix-c" },
      { num: "D", title: "Fire Apparatus Access Roads", pages: "D-1 â D-12", anchor: "appendix-d" },
      { num: "E", title: "Hazard Categories", pages: "E-1 â E-28", anchor: "appendix-e" },
      { num: "F", title: "Hazard Ranking", pages: "F-1 â F-4", anchor: "appendix-f" },
      { num: "G", title: "Cryogenic Fluids â Weight and Volume Equivalents", pages: "G-1 â G-4", anchor: "appendix-g" },
      { num: "H", title: "Hazardous Materials Management Plan (HMMP) and HMIS Instructions", pages: "H-1 â H-10", anchor: "appendix-h" },
      { num: "I", title: "Fire Protection Systems â Noncompliant Conditions", pages: "I-1 â I-6", anchor: "appendix-i" },
      { num: "J", title: "Building Information Sign", pages: "J-1 â J-4", anchor: "appendix-j" },
      { num: "K", title: "Construction Requirements for Existing Ambulatory Care Facilities", pages: "K-1 â K-8", anchor: "appendix-k" },
      { num: "L", title: "Requirements for Fire Fighter Air Replenishment Systems", pages: "L-1 â L-10", anchor: "appendix-l" },
      { num: "M", title: "High-Rise Buildings â Retroactive Automatic Sprinkler Requirement", pages: "M-1 â M-2", anchor: "appendix-m" },
      { num: "N", title: "Indoor Trade Shows and Exhibitions", pages: "N-1 â N-8", anchor: "appendix-n" },
      { num: "O", title: "Valet Trash and Recycling Collection in Group R-2 Occupancies", pages: "O-1 â O-4", anchor: "appendix-o" },
    ],
  },
];

const highlight = (text, query) => {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-foreground rounded px-0.5">{part}</mark>
      : part
  );
};

export default function FireCodesPage() {
  const [search, setSearch] = useState("");

  const allChapters = useMemo(() =>
    TOC.flatMap((s) => s.chapters.map((ch) => ({ ...ch, part: s.part }))),
    []
  );

  const isSearching = search.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return TOC;
    const q = search.toLowerCase();
    return TOC.map((s) => ({
      ...s,
      chapters: s.chapters.filter(
        (ch) =>
          ch.title.toLowerCase().includes(q) ||
          String(ch.num).toLowerCase().includes(q) ||
          s.part.toLowerCase().includes(q)
      ),
    })).filter((s) => s.chapters.length > 0);
  }, [search, isSearching]);

  const totalMatches = filteredSections.reduce((acc, s) => acc + s.chapters.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title="Fire Codes & Regulations" backTo="/inspection-division" />

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden mb-4"
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-base font-semibold text-foreground tracking-wide uppercase">
                2024 IFCÂ® Code and Commentary
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                International Fire Code Â· License #102062229
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chapters, appendices, or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearching && (
          <p className="text-xs text-muted-foreground font-body mb-3">
            {totalMatches} result{totalMatches !== 1 ? "s" : ""} found
          </p>
        )}

        {/* TOC */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          {filteredSections.length === 0 && (
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-10 text-center">
              <p className="text-sm text-muted-foreground font-body">No chapters match your search.</p>
            </div>
          )}

          {filteredSections.map((section, si) => (
            <div key={si} className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b border-border/40">
                <p className="font-heading text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                  {section.part}
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {section.chapters.map((ch, ci) => (
                  <a
                    key={ci}
                    href={ch.pdfUrl || `${BASE_URL}#${ch.anchor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className="shrink-0 w-12 text-xs font-heading font-bold text-accent text-center">
                      {typeof ch.num === "number" ? `Ch. ${ch.num}` : `App. ${ch.num}`}
                    </span>
                    {typeof ch.num === "number" && (
                      <span className={`shrink-0 text-xs font-heading font-semibold px-2 py-0.5 rounded ${ch.pdfUrl ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>
                        {ch.num * 100}
                      </span>
                    )}
                    <span className="flex-1 font-body text-sm text-foreground leading-snug">
                      {highlight(ch.title, search)}
                    </span>
                    <span className="text-xs text-muted-foreground font-body shrink-0 hidden sm:block">
                      {ch.pages}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Future uploads placeholder */}
          <div className="rounded-2xl border-2 border-dashed border-border/60 p-6 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-heading text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Additional Code Documents
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Future uploads will appear here
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
