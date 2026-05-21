import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ChevronRight, ClipboardList, ExternalLink, FileText, Search } from "lucide-react";
import { sogDocumentUrl, sogs } from "../data/sogs";

const forms = [
  {
    label: "Liability Release Form",
    url: "https://form.jotform.com/260756661469065",
  },
  {
    label: "Pre Fire Plan Form",
    url: "https://form.jotform.com/260863576120053",
  },
];

export default function FireFormsPage() {
  const [activeForm, setActiveForm] = useState(null);
  const [activeTab, setActiveTab] = useState("forms");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSog, setActiveSog] = useState(sogs[0]);

  const filteredSogs = sogs.filter((sog) => {
    const value = searchTerm.trim().toLowerCase();
    return (
      !value ||
      sog.code.toLowerCase().includes(value) ||
      sog.title.toLowerCase().includes(value) ||
      `sog ${sog.code}`.includes(value)
    );
  });

  const pdfUrl = `${sogDocumentUrl}#page=${activeSog.page}`;

  return (
    <div className="app-shell">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <PageHeader title="Fire Forms" subtitle="Fire forms, SOG access, and department resources." backTo="/" />

        <div className="command-panel mb-4 grid grid-cols-2 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("forms");
              setActiveForm(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "forms"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Forms
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("sogs");
              setActiveForm(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "sogs"
                ? "bg-slate-950 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            SOGs
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="command-panel overflow-hidden rounded-2xl"
        >
          {activeTab === "forms" && (
            !activeForm ? (
              forms.map((form, i) => (
                <button
                  key={i}
                  onClick={() => setActiveForm(form)}
                  className="group flex min-h-[84px] w-full items-center gap-4 border-b border-border/50 bg-card px-6 py-4 text-left transition-colors last:border-0 hover:bg-muted/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-sm transition-colors">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
                    {form.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-all" />
                </button>
              ))
            ) : (
            <>
              <div className="metal-header flex items-center gap-3 px-6 py-4">
                <button
                  onClick={() => setActiveForm(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-heading text-base font-semibold text-foreground tracking-wide uppercase">
                  {activeForm.label}
                </h2>
              </div>
              <iframe
                src={activeForm.url}
                title={activeForm.label}
                className="w-full"
                style={{ height: "80vh", border: "none" }}
                allowFullScreen
              />
            </>
            )
          )}

          {activeTab === "sogs" && (
            <div className="grid min-h-[78vh] lg:grid-cols-[360px_1fr]">
              <aside className="border-b border-border/60 bg-muted/20 lg:border-b-0 lg:border-r">
                <div className="border-b border-border/60 p-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search SOG number or title"
                      className="h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{filteredSogs.length} SOGs</span>
                    <a
                      href={sogDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Open PDF
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="max-h-[62vh] overflow-y-auto">
                  {filteredSogs.map((sog) => (
                    <button
                      key={sog.code}
                      type="button"
                      onClick={() => setActiveSog(sog)}
                      className={`group flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors ${
                        activeSog.code === sog.code
                        ? "bg-accent/15"
                          : "bg-card hover:bg-muted/50"
                      }`}
                    >
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-xs font-black text-white shadow-sm">
                        {sog.code}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-black text-foreground">
                          {sog.title}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-slate-700">
                          Page {sog.page}
                        </span>
                      </span>
                      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </aside>

              <section className="flex min-h-[78vh] flex-col">
                <div className="metal-header flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/65">
                      SOG {activeSog.code}
                    </p>
                    <h2 className="truncate font-heading text-base font-semibold text-white">
                      {activeSog.title}
                    </h2>
                  </div>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </div>
                <iframe
                  key={pdfUrl}
                  src={pdfUrl}
                  title={`SOG ${activeSog.code} - ${activeSog.title}`}
                  className="min-h-[68vh] w-full flex-1 bg-muted"
                  style={{ border: "none" }}
                />
              </section>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
