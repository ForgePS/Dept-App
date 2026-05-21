import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { ClipboardList, ChevronRight, ArrowLeft, BookOpen } from "lucide-react";

const forms = [
  {
    label: "Multipatient Refusal Form",
    url: "https://form.jotform.com/260756950969071",
    icon: ClipboardList,
  },
];

const links = [
  {
    label: "EMS Protocols",
    to: "/ems-forms/protocols",
    icon: BookOpen,
  },
];

export default function EmsFormsPage() {
  const [activeForm, setActiveForm] = useState(null);

  return (
    <div className="app-shell">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <PageHeader title="EMS Forms" subtitle="EMS paperwork, protocols, and quick-reference tools." backTo="/" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="command-panel overflow-hidden rounded-2xl"
        >
          {!activeForm ? (
            /* Form list */
            <>
              {forms.map((form, i) => (
                <button
                  key={i}
                  onClick={() => setActiveForm(form)}
                  className="group flex min-h-[84px] w-full items-center gap-4 border-b border-border/50 bg-card px-6 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-sm transition-colors">
                    <form.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">{form.label}</span>
                  <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
              {links.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="group flex min-h-[84px] w-full items-center gap-4 border-b border-border/50 bg-card px-6 py-4 transition-colors last:border-0 hover:bg-muted/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-sm transition-colors">
                    <link.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="flex-1 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </>
          ) : (
            /* Embedded form inside the same card */
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
          )}
        </motion.div>
      </div>
    </div>
  );
}
