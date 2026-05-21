import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { ClipboardList, ChevronRight, ArrowLeft } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title="Fire Forms" backTo="/" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden"
        >
          {!activeForm ? (
            forms.map((form, i) => (
              <button
                key={i}
                onClick={() => setActiveForm(form)}
                className="group w-full flex items-center gap-4 px-6 py-4 border-b border-border/40 last:border-0 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                <span className="flex-1 font-body text-sm font-medium text-foreground">
                  {form.label}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          ) : (
            <>
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
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
