import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, FileText, Search, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { emsProtocols } from "../data/emsProtocols";

const categories = [...new Set(emsProtocols.map((protocol) => protocol.category))];

const highlight = (text, query) => {
  if (!query.trim()) return text;
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${safeQuery})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const isSectionLabel = (line) => {
  const normalized = line.replace(/[:]/g, "").trim();
  return (
    normalized.length <= 42 &&
    (/^(Assessment|Note|Basic|Paramedic|Advanced|Intermediate|Contraindications|Treatment|Procedure|Indications)$/i.test(normalized) ||
      /^[A-Z][A-Za-z /()-]+:$/.test(line))
  );
};

export default function EmsProtocolsPage() {
  const [search, setSearch] = useState("");
  const [activeProtocol, setActiveProtocol] = useState(emsProtocols[0]);
  const isSearching = search.trim().length > 0;

  const filteredProtocols = useMemo(() => {
    if (!isSearching) return emsProtocols;
    const q = search.toLowerCase();
    return emsProtocols.filter((protocol) => protocol.keywords.includes(q));
  }, [search, isSearching]);

  const filteredSections = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          protocols: filteredProtocols.filter((protocol) => protocol.category === category),
        }))
        .filter((section) => section.protocols.length > 0),
    [filteredProtocols]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <PageHeader
          title="EMS Protocols"
          subtitle="Search the actual protocol text by SOG number, title, medication, condition, or keyword."
          backTo="/ems-forms"
        />

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
                  <p className="font-heading text-lg font-semibold uppercase tracking-wide">2018 EMS Treatment Guidelines</p>
                  <p className="mt-0.5 text-xs text-white/70">79 searchable Horn Lake Fire & EMS protocols</p>
                </div>
              </div>
            </motion.div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chest pain, Narcan, SOG 302..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-14 w-full rounded-2xl border border-border/70 bg-card/95 pl-12 pr-12 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {isSearching && (
              <p className="text-xs text-muted-foreground font-body">
                {filteredProtocols.length} result{filteredProtocols.length !== 1 ? "s" : ""} found
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

              {filteredSections.map((section) => (
                <div key={section.category} className="border-b border-border/40 last:border-b-0">
                  <div className="border-b border-border/40 bg-muted/50 px-4 py-3">
                    <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {section.category}
                    </p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {section.protocols.map((protocol) => (
                      <button
                        key={protocol.number}
                        type="button"
                        onClick={() => setActiveProtocol(protocol)}
                        className={`group flex min-h-[76px] w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeProtocol.number === protocol.number ? "bg-accent/10" : "hover:bg-muted/40"
                        }`}
                      >
                        <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                          SOG #{protocol.number}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold leading-snug text-foreground">
                            {highlight(protocol.title, search)}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">{protocol.category}</span>
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
            <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-card px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">SOG #{activeProtocol.number}</p>
                <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
                  {activeProtocol.title}
                </h2>
              </div>
            </div>

            <div className="max-h-[74vh] overflow-y-auto px-5 py-5 sm:px-7">
              <div className="mb-5 rounded-2xl border border-border/60 bg-muted/35 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{activeProtocol.category}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tap another protocol number on the left to jump directly to its matching guideline.
                </p>
              </div>

              <div className="space-y-3">
                {activeProtocol.body.map((line, index) =>
                  isSectionLabel(line) ? (
                    <h3 key={`${activeProtocol.number}-${index}`} className="pt-3 font-heading text-sm font-black uppercase tracking-wide text-accent">
                      {highlight(line, search)}
                    </h3>
                  ) : (
                    <p key={`${activeProtocol.number}-${index}`} className="rounded-xl border border-border/40 bg-background/70 px-4 py-3 text-sm leading-6 text-foreground">
                      {highlight(line, search)}
                    </p>
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
