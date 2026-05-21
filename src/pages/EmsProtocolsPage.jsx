import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, FileText, Search, X } from "lucide-react";

const BASE_DOC_URL = "https://docs.google.com/viewer?url=https%3A%2F%2Fmedia.base44.com%2Ffiles%2Fpublic%2F69f9c7cc9025b4328efe3ba3%2Fa70c62f9b_18EMSProtocols.docx&embedded=true";

const TOC = [
  {
    section: "Administrative",
    protocols: [
      { number: "100", title: "Scope and Purpose", keywords: "administration authority purpose scope" },
      { number: "101", title: "Medical Director Authority", keywords: "medical director authority oversight" },
      { number: "102", title: "EMS Provider Certification Levels", keywords: "certification emr emt advanced paramedic provider levels" },
      { number: "103", title: "Incident Command", keywords: "incident command ics scene management" },
    ],
  },
  {
    section: "General Patient Care",
    protocols: [
      { number: "200", title: "General Patient Assessment", keywords: "assessment vital signs patient care history exam" },
      { number: "201", title: "Airway Management", keywords: "airway ventilation bvm suction intubation" },
      { number: "202", title: "Oxygen Administration", keywords: "oxygen nasal cannula nonrebreather spo2 hypoxia" },
      { number: "203", title: "Vascular Access", keywords: "iv io access fluids vascular" },
      { number: "204", title: "Hemorrhage Control", keywords: "bleeding hemorrhage tourniquet wound control" },
      { number: "205", title: "Spinal Motion Restriction", keywords: "spinal c-spine backboard collar trauma" },
      { number: "206", title: "Pain Management", keywords: "pain medication comfort analgesia" },
      { number: "207", title: "Patient Refusal of Care", keywords: "refusal ama decision capacity" },
      { number: "208", title: "Do Not Resuscitate / Advance Directives", keywords: "dnr advance directive resuscitation" },
    ],
  },
  {
    section: "Cardiac",
    protocols: [
      { number: "300", title: "Cardiac Arrest - Adult", keywords: "arrest cpr aed defibrillation adult rosc" },
      { number: "301", title: "Cardiac Arrest - Pediatric", keywords: "arrest cpr aed defibrillation pediatric child infant" },
      { number: "302", title: "Chest Pain / Acute Coronary Syndrome", keywords: "chest pain acs stemi aspirin nitro cardiac" },
      { number: "303", title: "12-Lead ECG Acquisition", keywords: "12 lead ecg ekg stemi acquisition" },
      { number: "304", title: "Bradycardia", keywords: "bradycardia slow heart rate atropine pacing" },
      { number: "305", title: "Tachycardia", keywords: "tachycardia rapid heart rate svt vt" },
      { number: "306", title: "Congestive Heart Failure / Pulmonary Edema", keywords: "chf pulmonary edema cpap shortness breath" },
      { number: "307", title: "Hypertensive Emergency", keywords: "hypertension blood pressure emergency" },
    ],
  },
  {
    section: "Respiratory",
    protocols: [
      { number: "400", title: "Respiratory Distress - General", keywords: "respiratory distress shortness breath dyspnea" },
      { number: "401", title: "Asthma / COPD", keywords: "asthma copd wheezing albuterol breathing" },
      { number: "402", title: "Anaphylaxis / Allergic Reaction", keywords: "anaphylaxis allergy epinephrine hives airway" },
      { number: "403", title: "Pulmonary Embolism", keywords: "pulmonary embolism pe chest pain dyspnea" },
    ],
  },
  {
    section: "Neurological",
    protocols: [
      { number: "500", title: "Altered Level of Consciousness", keywords: "altered mental status unconscious confusion" },
      { number: "501", title: "Stroke / CVA", keywords: "stroke cva fast facial droop weakness" },
      { number: "502", title: "Seizure", keywords: "seizure convulsion postictal status epilepticus" },
      { number: "503", title: "Syncope", keywords: "syncope fainting dizziness" },
      { number: "504", title: "Headache", keywords: "headache migraine neuro" },
    ],
  },
  {
    section: "Trauma",
    protocols: [
      { number: "600", title: "Trauma - General", keywords: "trauma injury bleeding shock mechanism" },
      { number: "601", title: "Head Injury", keywords: "head injury concussion tbi trauma" },
      { number: "602", title: "Burns", keywords: "burn thermal chemical electrical" },
      { number: "603", title: "Crush Injury / Compartment Syndrome", keywords: "crush compartment syndrome trauma" },
      { number: "604", title: "Amputation", keywords: "amputation severed limb trauma" },
      { number: "605", title: "Eye Injuries", keywords: "eye injury chemical foreign body" },
      { number: "606", title: "Orthopedic Injuries", keywords: "fracture dislocation splint orthopedic" },
    ],
  },
  {
    section: "Medical",
    protocols: [
      { number: "700", title: "Diabetic Emergencies / Hypoglycemia", keywords: "diabetic hypoglycemia glucose sugar" },
      { number: "701", title: "Abdominal Pain", keywords: "abdominal pain abdomen nausea" },
      { number: "702", title: "Nausea / Vomiting", keywords: "nausea vomiting zofran emesis" },
      { number: "703", title: "Sepsis", keywords: "sepsis infection fever shock" },
      { number: "704", title: "Overdose / Poisoning", keywords: "overdose poisoning narcan naloxone toxic" },
      { number: "705", title: "Behavioral / Psychiatric Emergency", keywords: "behavioral psychiatric mental health agitation" },
      { number: "706", title: "Heat Emergencies", keywords: "heat exhaustion stroke hyperthermia" },
      { number: "707", title: "Cold Emergencies / Hypothermia", keywords: "cold hypothermia frostbite" },
    ],
  },
  {
    section: "Obstetrics & Gynecology",
    protocols: [
      { number: "800", title: "OB/GYN Emergencies - General", keywords: "ob gyn pregnancy obstetrics gynecology" },
      { number: "801", title: "Normal Childbirth", keywords: "childbirth delivery newborn labor" },
      { number: "802", title: "Obstetric Complications", keywords: "ob complications bleeding breech cord" },
      { number: "803", title: "Eclampsia / Preeclampsia", keywords: "eclampsia preeclampsia pregnancy seizure hypertension" },
    ],
  },
  {
    section: "Pediatric",
    protocols: [
      { number: "900", title: "Pediatric Assessment", keywords: "pediatric child infant assessment" },
      { number: "901", title: "Pediatric Respiratory Distress", keywords: "pediatric respiratory distress breathing" },
      { number: "902", title: "Pediatric Seizure", keywords: "pediatric seizure child infant" },
      { number: "903", title: "Pediatric Trauma", keywords: "pediatric trauma child injury" },
      { number: "904", title: "Apparent Life-Threatening Event (ALTE)", keywords: "alte brue apparent life threatening event infant" },
    ],
  },
  {
    section: "Special Operations",
    protocols: [
      { number: "1000", title: "Mass Casualty Incident", keywords: "mci mass casualty triage incident" },
      { number: "1001", title: "Hazmat / CBRN Exposure", keywords: "hazmat cbrn exposure decon chemical" },
      { number: "1002", title: "Water Rescue / Drowning", keywords: "water rescue drowning submersion" },
      { number: "1003", title: "Multipatient Refusal", keywords: "multipatient refusal multiple patients ama" },
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

export default function EmsProtocolsPage() {
  const [search, setSearch] = useState("");
  const [activeProtocol, setActiveProtocol] = useState(TOC[0].protocols[0]);

  const isSearching = search.trim().length > 0;

  const filteredSections = useMemo(() => {
    if (!isSearching) return TOC;
    const q = search.toLowerCase();
    return TOC.map((section) => ({
      ...section,
      protocols: section.protocols.filter(
        (protocol) =>
          protocol.title.toLowerCase().includes(q) ||
          protocol.number.toLowerCase().includes(q) ||
          protocol.keywords.toLowerCase().includes(q) ||
          section.section.toLowerCase().includes(q)
      ),
    })).filter((section) => section.protocols.length > 0);
  }, [search, isSearching]);

  const totalMatches = filteredSections.reduce((acc, section) => acc + section.protocols.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <PageHeader title="EMS Protocols" subtitle="Search by protocol number, title, or keyword. Tap a protocol to keep the document open in the app." backTo="/ems-forms" />

        <div className="grid gap-4 lg:grid-cols-[430px_1fr]">
          <aside className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm"
            >
              <div className="flex items-center gap-4 bg-slate-950 px-5 py-4 text-white">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-semibold uppercase tracking-wide">2018 EMS Protocols</p>
                  <p className="mt-0.5 text-xs text-white/70">Horn Lake Fire / EMS guidelines</p>
                </div>
              </div>
            </motion.div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search airway, stroke, 302, pediatric..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-14 w-full rounded-2xl border border-border/70 bg-card/95 pl-12 pr-12 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {isSearching && (
              <p className="text-xs text-muted-foreground font-body">
                {totalMatches} result{totalMatches !== 1 ? "s" : ""} found
              </p>
            )}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-h-[74vh] overflow-y-auto rounded-2xl border border-border/70 bg-card/95 shadow-sm"
            >
              {filteredSections.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground font-body">No protocols match your search.</div>
              )}

              {filteredSections.map((section, sectionIndex) => (
                <div key={section.section} className="border-b border-border/40 last:border-b-0">
                  <div className="border-b border-border/40 bg-muted/50 px-4 py-3">
                    <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {section.section}
                    </p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {section.protocols.map((protocol) => (
                      <button
                        key={protocol.number}
                        type="button"
                        onClick={() => setActiveProtocol(protocol)}
                        className={`group flex min-h-[72px] w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeProtocol.number === protocol.number ? "bg-accent/10" : "hover:bg-muted/40"
                        }`}
                      >
                        <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">
                          #{protocol.number}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold leading-snug text-foreground">
                            {highlight(protocol.title, search)}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {section.section}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </aside>

          <section className="min-h-[78vh] overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">#{activeProtocol.number}</p>
                <h2 className="truncate font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
                  {activeProtocol.title}
                </h2>
              </div>
            </div>
            <iframe
              src={BASE_DOC_URL}
              title="2018 EMS Protocols"
              className="h-[74vh] w-full bg-muted"
              style={{ border: "none" }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
