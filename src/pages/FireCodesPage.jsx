import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, FileText, Search, X } from "lucide-react";
import { fireCodeIndex } from "../data/fireCodeIndex";
import { fireCodeSections } from "../data/fireCodeSections";

const BASE_URL = "https://up.codes/viewer/international/ifc-2024";

const CODE_DOCS = {
  1: "/codes/100 - Scope and Administration.pdf",
  2: "/codes/200 - Definitions.pdf",
  3: "/codes/300 - General Requirements.pdf",
  4: "/codes/400 - Emergency Planning and Preparedness.pdf",
  5: "/codes/500 - Fire Service Features.pdf",
  6: "/codes/600 - Building Services and Systems.pdf",
  7: "/codes/700 - Fire and Smoke Protection Fetures.pdf",
  8: "/codes/800 - Interior Finish, Decorative Materials and Furnishings.pdf",
  9: "/codes/900 - Fire Protection and Life Safety Systems.pdf",
  10: "/codes/1000 - Means of Egress.pdf",
  11: "/codes/1100 - Construction Requirements for Exhisting Buildings.pdf",
  12: "/codes/1200 - Energy Systems.pdf",
  index: "/codes/INDEX.pdf",
  toc: "/codes/Table of Contents.pdf",
};

const TOC = [
  {
    part: "Part I - Administrative",
    chapters: [
      { num: 1, title: "Scope and Administration", pages: "1-1 to 1-46", anchor: "chapter-1", pdfUrl: CODE_DOCS[1] },
      { num: 2, title: "Definitions", pages: "2-1 to 2-168", anchor: "chapter-2", pdfUrl: CODE_DOCS[2] },
    ],
  },
  {
    part: "Part II - General Safety Provisions",
    chapters: [
      { num: 3, title: "General Requirements", pages: "3-1 to 3-40", anchor: "chapter-3", pdfUrl: CODE_DOCS[3] },
      { num: 4, title: "Emergency Planning and Preparedness", pages: "4-1 to 4-30", anchor: "chapter-4", pdfUrl: CODE_DOCS[4] },
    ],
  },
  {
    part: "Part III - Building and Equipment Design Features",
    chapters: [
      { num: 5, title: "Fire Service Features", pages: "5-1 to 5-28", anchor: "chapter-5", pdfUrl: CODE_DOCS[5] },
      { num: 6, title: "Building Services and Systems", pages: "6-1 to 6-32", anchor: "chapter-6", pdfUrl: CODE_DOCS[6] },
      { num: 7, title: "Fire and Smoke Protection Features", pages: "7-1 to 7-8", anchor: "chapter-7", pdfUrl: CODE_DOCS[7] },
      { num: 8, title: "Interior Finish, Decorative Materials and Furnishings", pages: "8-1 to 8-34", anchor: "chapter-8", pdfUrl: CODE_DOCS[8] },
      { num: 9, title: "Fire Protection and Life Safety Systems", pages: "9-1 to 9-174", anchor: "chapter-9", pdfUrl: CODE_DOCS[9] },
      { num: 10, title: "Means of Egress", pages: "10-1 to 10-260", anchor: "chapter-10", pdfUrl: CODE_DOCS[10] },
      { num: 11, title: "Construction Requirements for Existing Buildings", pages: "11-1 to 11-38", anchor: "chapter-11", pdfUrl: CODE_DOCS[11] },
      { num: 12, title: "Energy Systems", pages: "12-1 to 12-48", anchor: "chapter-12", pdfUrl: CODE_DOCS[12] },
    ],
  },
  {
    part: "Part IV - Special Occupancies and Operations",
    chapters: [
      { num: 20, title: "Aviation Facilities", pages: "20-1 to 20-24", anchor: "chapter-20" },
      { num: 21, title: "Dry Cleaning", pages: "21-1 to 21-14", anchor: "chapter-21" },
      { num: 22, title: "Combustible Dust-Producing Operations", pages: "22-1 to 22-14", anchor: "chapter-22" },
      { num: 23, title: "Motor Fuel-Dispensing Facilities and Repair Garages", pages: "23-1 to 23-46", anchor: "chapter-23" },
      { num: 24, title: "Flammable Finishes", pages: "24-1 to 24-42", anchor: "chapter-24" },
      { num: 25, title: "Fruit and Crop Ripening", pages: "25-1 to 25-4", anchor: "chapter-25" },
      { num: 26, title: "Fumigation and Insecticidal Fogging", pages: "26-1 to 26-10", anchor: "chapter-26" },
      { num: 27, title: "Semiconductor Fabrication Facilities", pages: "27-1 to 27-26", anchor: "chapter-27" },
      { num: 28, title: "Lumber Yards and Agro-Industrial, Solid Biomass and Woodworking Facilities", pages: "28-1 to 28-16", anchor: "chapter-28" },
      { num: 29, title: "Manufacture of Organic Coatings", pages: "29-1 to 29-12", anchor: "chapter-29" },
      { num: 30, title: "Industrial Ovens", pages: "30-1 to 30-4", anchor: "chapter-30" },
      { num: 31, title: "Tents, Temporary Special Event Structures and Other Membrane Structures", pages: "31-1 to 31-30", anchor: "chapter-31" },
      { num: 32, title: "High-Piled Combustible Storage", pages: "32-1 to 32-62", anchor: "chapter-32" },
      { num: 33, title: "Fire Safety During Construction and Demolition", pages: "33-1 to 33-22", anchor: "chapter-33" },
      { num: 34, title: "Tire Rebuilding and Tire Storage", pages: "34-1 to 34-6", anchor: "chapter-34" },
      { num: 35, title: "Welding and Other Hot Work", pages: "35-1 to 35-12", anchor: "chapter-35" },
      { num: 36, title: "Marinas", pages: "36-1 to 36-6", anchor: "chapter-36" },
      { num: 37, title: "Combustible Fibers", pages: "37-1 to 37-4", anchor: "chapter-37" },
      { num: 38, title: "Higher Education Laboratories", pages: "38-1 to 38-10", anchor: "chapter-38" },
      { num: 39, title: "Processing and Extraction Facilities", pages: "39-1 to 39-8", anchor: "chapter-39" },
      { num: 40, title: "Storage of Distilled Spirits and Wines", pages: "40-1 to 40-20", anchor: "chapter-40" },
      { num: 41, title: "Temporary Heating and Cooking Operations", pages: "41-1 to 41-10", anchor: "chapter-41" },
    ],
  },
  {
    part: "Part V - Hazardous Materials",
    chapters: [
      { num: 50, title: "Hazardous Materials - General Provisions", pages: "50-1 to 50-58", anchor: "chapter-50" },
      { num: 51, title: "Aerosols", pages: "51-1 to 51-26", anchor: "chapter-51" },
      { num: 53, title: "Compressed Gases", pages: "53-1 to 53-20", anchor: "chapter-53" },
      { num: 54, title: "Corrosive Materials", pages: "54-1 to 54-4", anchor: "chapter-54" },
      { num: 55, title: "Cryogenic Fluids", pages: "55-1 to 55-12", anchor: "chapter-55" },
      { num: 56, title: "Explosives and Fireworks", pages: "56-1 to 56-38", anchor: "chapter-56" },
      { num: 57, title: "Flammable and Combustible Liquids", pages: "57-1 to 57-90", anchor: "chapter-57" },
      { num: 58, title: "Flammable Gases and Flammable Cryogenic Fluids", pages: "58-1 to 58-14", anchor: "chapter-58" },
      { num: 59, title: "Flammable Solids", pages: "59-1 to 59-8", anchor: "chapter-59" },
      { num: 60, title: "Highly Toxic and Toxic Materials", pages: "60-1 to 60-20", anchor: "chapter-60" },
      { num: 61, title: "Liquefied Petroleum Gases", pages: "61-1 to 61-24", anchor: "chapter-61" },
      { num: 62, title: "Organic Peroxides", pages: "62-1 to 62-8", anchor: "chapter-62" },
      { num: 63, title: "Oxidizers, Oxidizing Gases and Oxidizing Cryogenic Fluids", pages: "63-1 to 63-14", anchor: "chapter-63" },
      { num: 64, title: "Pyrophoric Materials", pages: "64-1 to 64-6", anchor: "chapter-64" },
      { num: 65, title: "Pyroxylin (Cellulose Nitrate) Plastics", pages: "65-1 to 65-4", anchor: "chapter-65" },
      { num: 66, title: "Unstable (Reactive) Materials", pages: "66-1 to 66-6", anchor: "chapter-66" },
      { num: 67, title: "Water-Reactive Solids and Liquids", pages: "67-1 to 67-6", anchor: "chapter-67" },
    ],
  },
  {
    part: "Part VI - Referenced Standards",
    chapters: [{ num: 80, title: "Referenced Standards", pages: "80-1 to 80-16", anchor: "chapter-80" }],
  },
  {
    part: "Part VII - Appendices",
    chapters: [
      { num: "A", title: "Board of Appeals", pages: "A-1 to A-4", anchor: "appendix-a" },
      { num: "B", title: "Fire-Flow Requirements for Buildings", pages: "B-1 to B-10", anchor: "appendix-b" },
      { num: "C", title: "Fire Hydrant Locations and Distribution", pages: "C-1 to C-6", anchor: "appendix-c" },
      { num: "D", title: "Fire Apparatus Access Roads", pages: "D-1 to D-12", anchor: "appendix-d" },
      { num: "E", title: "Hazard Categories", pages: "E-1 to E-28", anchor: "appendix-e" },
      { num: "F", title: "Hazard Ranking", pages: "F-1 to F-4", anchor: "appendix-f" },
      { num: "G", title: "Cryogenic Fluids - Weight and Volume Equivalents", pages: "G-1 to G-4", anchor: "appendix-g" },
      { num: "H", title: "Hazardous Materials Management Plan (HMMP) and HMIS Instructions", pages: "H-1 to H-10", anchor: "appendix-h" },
      { num: "I", title: "Fire Protection Systems - Noncompliant Conditions", pages: "I-1 to I-6", anchor: "appendix-i" },
      { num: "J", title: "Building Information Sign", pages: "J-1 to J-4", anchor: "appendix-j" },
      { num: "K", title: "Construction Requirements for Existing Ambulatory Care Facilities", pages: "K-1 to K-8", anchor: "appendix-k" },
      { num: "L", title: "Requirements for Fire Fighter Air Replenishment Systems", pages: "L-1 to L-10", anchor: "appendix-l" },
      { num: "M", title: "High-Rise Buildings - Retroactive Automatic Sprinkler Requirement", pages: "M-1 to M-2", anchor: "appendix-m" },
      { num: "N", title: "Indoor Trade Shows and Exhibitions", pages: "N-1 to N-8", anchor: "appendix-n" },
      { num: "O", title: "Valet Trash and Recycling Collection in Group R-2 Occupancies", pages: "O-1 to O-4", anchor: "appendix-o" },
    ],
  },
];

const highlight = (text, query) => {
  if (!query.trim()) return text;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-foreground">{part}</mark>
    ) : part
  );
};

const chapterLabel = (num) => (typeof num === "number" ? `Chapter ${num}` : `Appendix ${num}`);
const chapterBadge = (num) => (typeof num === "number" ? `${num * 100}` : `Appendix ${num}`);

export default function FireCodesPage() {
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState({ type: "toc", title: "Table of Contents", label: "2024 IFC", url: CODE_DOCS.toc });

  const isSearching = search.trim().length > 0;
  const allChapters = useMemo(
    () => TOC.flatMap((section) => section.chapters.map((chapter) => ({ ...chapter, part: section.part }))),
    []
  );
  const sectionsByChapter = useMemo(() => {
    return fireCodeSections.reduce((acc, section) => {
      const key = String(section.chapter);
      acc[key] = acc[key] || [];
      acc[key].push(section);
      return acc;
    }, {});
  }, []);

  const getChapterTarget = (chapter) => chapter.pdfUrl || CODE_DOCS[String(chapter.num)] || `${BASE_URL}#${chapter.anchor}`;

  const selectChapter = (chapter) => {
    const chapterSections = sectionsByChapter[String(chapter.num)] || [];

    if (chapterSections.length > 0) {
      setSelectedDoc({
        type: "chapter",
        title: chapter.title,
        label: chapterLabel(chapter.num),
        url: getChapterTarget(chapter),
        chapter,
        sections: chapterSections,
      });
      return;
    }

    setSelectedDoc({
      title: chapter.title,
      label: chapterBadge(chapter.num),
      url: getChapterTarget(chapter),
    });
  };

  const selectIndexRef = (ref) => {
    const matchingSection = fireCodeSections.find((section) => section.section === ref.label);
    if (matchingSection) {
      selectCodeSection(matchingSection);
      return;
    }

    const chapter = ref.chapter ? allChapters.find((item) => String(item.num) === String(ref.chapter)) : null;
    if (chapter) {
      selectChapter(chapter);
      return;
    }
    setSelectedDoc({ title: "Index", label: ref.label, url: CODE_DOCS.index });
  };

  const selectCodeSection = (section) => {
    const chapter = allChapters.find((item) => String(item.num) === String(section.chapter));
    setSelectedDoc({
      type: "code",
      title: `${section.section} ${section.title}`,
      label: `Chapter ${section.chapter}`,
      url: chapter ? getChapterTarget(chapter) : BASE_URL,
      section,
    });
  };

  const filteredSections = useMemo(() => {
    if (!isSearching) return TOC;
    const q = search.toLowerCase();
    return TOC.map((section) => ({
      ...section,
      chapters: section.chapters.filter(
        (chapter) =>
          chapter.title.toLowerCase().includes(q) ||
          String(chapter.num).toLowerCase().includes(q) ||
          (typeof chapter.num === "number" && String(chapter.num * 100).includes(q)) ||
          section.part.toLowerCase().includes(q)
      ),
    })).filter((section) => section.chapters.length > 0);
  }, [search, isSearching]);

  const filteredIndex = useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    return fireCodeIndex
      .filter((entry) =>
        entry.title.toLowerCase().includes(q) ||
        entry.refs.some((ref) => ref.label.toLowerCase().includes(q) || String(ref.chapter || "").includes(q))
      )
      .slice(0, 60);
  }, [search, isSearching]);

  const filteredCodeSections = useMemo(() => {
    if (!isSearching) return [];
    const q = search.toLowerCase();
    return fireCodeSections
      .filter((section) => section.searchText.includes(q))
      .slice(0, 80);
  }, [search, isSearching]);

  const totalChapterMatches = filteredSections.reduce((acc, section) => acc + section.chapters.length, 0);

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <PageHeader title="Fire Codes & Regulations" backTo="/inspection-division" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="command-panel mb-4 overflow-hidden rounded-2xl"
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base font-semibold uppercase tracking-wide text-foreground">2024 IFC Code and Commentary</p>
              <p className="mt-0.5 text-xs text-muted-foreground font-body">Search chapters or index terms, then view the selected document on the right.</p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-[430px_1fr]">
          <aside className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chapters, index, or section numbers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setSelectedDoc({ type: "toc", title: "Table of Contents", label: "2024 IFC", url: CODE_DOCS.toc })} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40">
                <FileText className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-heading font-semibold uppercase tracking-wide text-foreground">TOC</span>
              </button>
              <button type="button" onClick={() => setSelectedDoc({ type: "index", title: "Index", label: "2024 IFC", url: CODE_DOCS.index })} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40">
                <Search className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-sm font-heading font-semibold uppercase tracking-wide text-foreground">Index</span>
              </button>
            </div>

            {isSearching && (
              <p className="text-xs text-muted-foreground font-body">
                {totalChapterMatches} chapter result{totalChapterMatches !== 1 ? "s" : ""} - {filteredCodeSections.length} code section result{filteredCodeSections.length !== 1 ? "s" : ""} - {filteredIndex.length} index result{filteredIndex.length !== 1 ? "s" : ""}
              </p>
            )}

            <div className="command-panel max-h-[74vh] overflow-y-auto rounded-2xl">
              {filteredSections.length === 0 && filteredCodeSections.length === 0 && filteredIndex.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground font-body">No matches found.</div>
              )}

              {filteredSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border-b border-border/40 last:border-b-0">
                  <div className="border-b border-border/40 bg-muted/40 px-4 py-3">
                    <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">{section.part}</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {section.chapters.map((chapter, chapterIndex) => {
                      const hasLocalPdf = Boolean(chapter.pdfUrl || CODE_DOCS[String(chapter.num)]);
                      return (
                        <button key={`${chapter.num}-${chapterIndex}`} type="button" onClick={() => selectChapter(chapter)} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
                          <span className="w-12 shrink-0 text-center text-xs font-heading font-bold text-accent">{typeof chapter.num === "number" ? `Ch. ${chapter.num}` : `App. ${chapter.num}`}</span>
                          {typeof chapter.num === "number" && <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-heading font-semibold ${hasLocalPdf ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{chapter.num * 100}</span>}
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug text-foreground font-body">{highlight(chapter.title, search)}</span>
                            <span className="mt-1 block text-xs text-muted-foreground font-body">{chapter.pages}</span>
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredCodeSections.length > 0 && (
                <div>
                  <div className="border-b border-border/40 bg-muted/40 px-4 py-3">
                    <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">Code Section Matches</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {filteredCodeSections.map((section) => (
                      <button
                        key={section.section}
                        type="button"
                        onClick={() => selectCodeSection(section)}
                        className="group flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                      >
                        <span className="mt-0.5 w-20 shrink-0 rounded-lg bg-slate-950 px-2 py-1 text-center text-xs font-black text-white">
                          {section.section}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold leading-snug text-foreground">{highlight(section.title, search)}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Chapter {section.chapter} - {section.chapterTitle}
                          </span>
                        </span>
                        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredIndex.length > 0 && (
                <div>
                  <div className="border-b border-border/40 bg-muted/40 px-4 py-3">
                    <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">Index Matches</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {filteredIndex.map((entry, entryIndex) => (
                      <div key={`${entry.title}-${entryIndex}`} className="px-4 py-3">
                        <p className="text-sm font-medium leading-snug text-foreground font-body">{highlight(entry.title, search)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.refs.map((ref, refIndex) => (
                            <button key={`${ref.label}-${refIndex}`} type="button" onClick={() => selectIndexRef(ref)} className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-accent hover:bg-muted">
                              {ref.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="command-panel min-h-[78vh] overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{selectedDoc.label}</p>
                <h2 className="truncate font-heading text-base font-semibold text-foreground">{selectedDoc.title}</h2>
              </div>
              <a href={selectedDoc.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted">
                <ExternalLink className="h-4 w-4" />
                {selectedDoc.type === "code" || selectedDoc.type === "chapter" ? "Open Source" : "Open PDF"}
              </a>
            </div>
            {selectedDoc.type === "toc" ? (
              <div className="h-[74vh] overflow-y-auto bg-card px-5 py-5 sm:px-7">
                <div className="mb-5 rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">2024 IFC</p>
                  <h3 className="mt-1 font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">Table of Contents</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Tap any chapter or appendix to open its connected sections.</p>
                </div>
                <div className="space-y-4">
                  {TOC.map((section) => (
                    <div key={section.part} className="rounded-2xl border border-border/50 bg-background/70">
                      <div className="border-b border-border/40 px-4 py-3">
                        <p className="font-heading text-xs font-black uppercase tracking-widest text-muted-foreground">{section.part}</p>
                      </div>
                      <div className="divide-y divide-border/30">
                        {section.chapters.map((chapter) => (
                          <button key={`${section.part}-${chapter.num}`} type="button" onClick={() => selectChapter(chapter)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60">
                            <span className="w-20 shrink-0 rounded-lg bg-slate-950 px-2 py-1 text-center text-xs font-black text-white">
                              {typeof chapter.num === "number" ? `Ch. ${chapter.num}` : `App. ${chapter.num}`}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-foreground">{chapter.title}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{chapter.pages}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDoc.type === "index" ? (
              <div className="h-[74vh] overflow-y-auto bg-card px-5 py-5 sm:px-7">
                <div className="mb-5 rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">2024 IFC</p>
                  <h3 className="mt-1 font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">Index</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Tap an index reference to open the matching section or chapter.</p>
                </div>
                <div className="space-y-3">
                  {fireCodeIndex.map((entry, entryIndex) => (
                    <div key={`${entry.title}-${entryIndex}`} className="rounded-xl border border-border/40 bg-background/80 px-4 py-3">
                      <p className="text-sm font-semibold leading-snug text-foreground">{entry.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.refs.map((ref, refIndex) => (
                          <button key={`${entry.title}-${ref.label}-${refIndex}`} type="button" onClick={() => selectIndexRef(ref)} className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-accent hover:bg-muted">
                            {ref.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDoc.type === "code" ? (
              <div className="h-[74vh] overflow-y-auto bg-card px-5 py-5 sm:px-7">
                <div className="mb-5 rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Chapter {selectedDoc.section.chapter}
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
                    {selectedDoc.section.section} {selectedDoc.section.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedDoc.section.chapterTitle}</p>
                </div>
                <div className="space-y-3">
                  {selectedDoc.section.body.map((line, index) => (
                    <p key={`${selectedDoc.section.section}-${index}`} className="rounded-xl border border-border/40 bg-background/80 px-4 py-3 text-sm leading-6 text-foreground">
                      {highlight(line, search)}
                    </p>
                  ))}
                </div>
              </div>
            ) : selectedDoc.type === "chapter" ? (
              <div className="h-[74vh] overflow-y-auto bg-card px-5 py-5 sm:px-7">
                <div className="mb-5 rounded-2xl border border-border/60 bg-muted/35 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {selectedDoc.label}
                  </p>
                  <h3 className="mt-1 font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
                    {selectedDoc.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedDoc.sections.length} searchable section{selectedDoc.sections.length !== 1 ? "s" : ""} connected to this chapter.
                  </p>
                </div>
                <div className="space-y-3">
                  {selectedDoc.sections.map((section) => (
                    <button
                      key={section.section}
                      type="button"
                      onClick={() => selectCodeSection(section)}
                      className="group w-full rounded-xl border border-border/40 bg-background/80 px-4 py-3 text-left transition-colors hover:bg-muted/70"
                    >
                      <span className="block text-xs font-black uppercase tracking-wide text-accent">{section.section}</span>
                      <span className="mt-1 block font-heading text-base font-semibold uppercase tracking-wide text-foreground">
                        {section.title}
                      </span>
                      <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                        {section.body[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <iframe key={selectedDoc.url} src={selectedDoc.url} title={selectedDoc.title} className="h-[74vh] w-full bg-muted" style={{ border: "none" }} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
