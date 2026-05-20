import { useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, Search, X } from "lucide-react";

const BASE_DOC_URL = "https://docs.google.com/viewer?url=https%3A%2F%2Fmedia.base44.com%2Ffiles%2Fpublic%2F69f9c7cc9025b4328efe3ba3%2Fa70c62f9b_18EMSProtocols.docx&embedded=true";
const FILE_URL = "https://media.base44.com/files/public/69f9c7cc9025b4328efe3ba3/a70c62f9b_18EMSProtocols.docx";

const TOC = [
  {
    section: "Administrative",
    protocols: [
      { sog: "100", title: "Scope and Purpose" },
      { sog: "101", title: "Medical Director Authority" },
      { sog: "102", title: "EMS Provider Certification Levels" },
      { sog: "103", title: "Incident Command" },
    ],
  },
  {
    section: "General Patient Care",
    protocols: [
      { sog: "200", title: "General Patient Assessment" },
      { sog: "201", title: "Airway Management" },
      { sog: "202", title: "Oxygen Administration" },
      { sog: "203", title: "Vascular Access" },
      { sog: "204", title: "Hemorrhage Control" },
      { sog: "205", title: "Spinal Motion Restriction" },
      { sog: "206", title: "Pain Management" },
      { sog: "207", title: "Patient Refusal of Care" },
      { sog: "208", title: "Do Not Resuscitate / Advance Directives" },
    ],
  },
  {
    section: "Cardiac",
    protocols: [
      { sog: "300", title: "Cardiac Arrest â Adult" },
      { sog: "301", title: "Cardiac Arrest â Pediatric" },
      { sog: "302", title: "Chest Pain / Acute Coronary Syndrome" },
      { sog: "303", title: "12-Lead ECG Acquisition" },
      { sog: "304", title: "Bradycardia" },
      { sog: "305", title: "Tachycardia" },
      { sog: "306", title: "Congestive Heart Failure / Pulmonary Edema" },
      { sog: "307", title: "Hypertensive Emergency" },
    ],
  },
  {
    section: "Respiratory",
    protocols: [
      { sog: "400", title: "Respiratory Distress â General" },
      { sog: "401", title: "Asthma / COPD" },
      { sog: "402", title: "Anaphylaxis / Allergic Reaction" },
      { sog: "403", title: "Pulmonary Embolism" },
    ],
  },
  {
    section: "Neurological",
    protocols: [
      { sog: "500", title: "Altered Level of Consciousness" },
      { sog: "501", title: "Stroke / CVA" },
      { sog: "502", title: "Seizure" },
      { sog: "503", title: "Syncope" },
      { sog: "504", title: "Headache" },
    ],
  },
  {
    section: "Trauma",
    protocols: [
      { sog: "600", title: "Trauma â General" },
      { sog: "601", title: "Head Injury" },
      { sog: "602", title: "Burns" },
      { sog: "603", title: "Crush Injury / Compartment Syndrome" },
      { sog: "604", title: "Amputation" },
      { sog: "605", title: "Eye Injuries" },
      { sog: "606", title: "Orthopedic Injuries" },
    ],
  },
  {
    section: "Medical",
    protocols: [
      { sog: "700", title: "Diabetic Emergencies / Hypoglycemia" },
      { sog: "701", title: "Abdominal Pain" },
      { sog: "702", title: "Nausea / Vomiting" },
      { sog: "703", title: "Sepsis" },
      { sog: "704", title: "Overdose / Poisoning" },
      { sog: "705", title: "Behavioral / Psychiatric Emergency" },
      { sog: "706", title: "Heat Emergencies" },
      { sog: "707", title: "Cold Emergencies / Hypothermia" },
    ],
  },
  {
    section: "Obstetrics & Gynecology",
    protocols: [
      { sog: "800", title: "OB/GYN Emergencies â General" },
      { sog: "801", title: "Normal Childbirth" },
      { sog: "802", title: "Obstetric Complications" },
      { sog: "803", title: "Eclampsia / Preeclampsia" },
    ],
  },
  {
    section: "Pediatric",
    protocols: [
      { sog: "900", title: "Pediatric Assessment" },
      { sog: "901", title: "Pediatric Respiratory Distress" },
      { sog: "902", title: "Pediatric Seizure" },
      { sog: "903", title: "Pediatric Trauma" },
      { sog: "904", title: "Apparent Life-Threatening Event (ALTE)" },
    ],
  },
  {
    section: "Special Operations",
    protocols: [
      { sog: "1000", title: "Mass Casualty Incident" },
      { sog: "1001", title: "Hazmat / CBRN Exposure" },
      { sog: "1002", title: "Water Rescue / Drowning" },
      { sog: "1003", title: "Multipatient Refusal" },
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

export default function EmsProtocolsPage() {
  const [search, setSearch] = useState("");

  const isSearching = search.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return TOC;
    const q = search.toLowerCase();
    return TOC.map((s) => ({
      ...s,
      protocols: s.protocols.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sog.toLowerCase().includes(q) ||
          s.section.toLowerCase().includes(q)
      ),
    })).filter((s) => s.protocols.length > 0);
  }, [search, isSearching]);

  const totalMatches = filteredSections.reduce((acc, s) => acc + s.protocols.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title="EMS Protocols" backTo="/ems-forms" />

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
                2018 EMS Protocols
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Horn Lake Fire / EMS â Standard Operating Guidelines
              </p>
            </div>
            <a
              href={FILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-body font-medium text-accent hover:underline"
            >
              Full Document â
            </a>
          </div>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search protocols by name or SOG #..."
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
              <p className="text-sm text-muted-foreground font-body">No protocols match your search.</p>
            </div>
          )}

          {filteredSections.map((section, si) => (
            <div key={si} className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-muted/40 border-b border-border/40">
                <p className="font-heading text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                  {section.section}
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {section.protocols.map((p, pi) => (
                  <a
                    key={pi}
                    href={FILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className="shrink-0 text-xs font-heading font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">
                      SOG {p.sog}
                    </span>
                    <span className="flex-1 font-body text-sm text-foreground leading-snug">
                      {highlight(p.title, search)}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
