import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";
import { ClipboardCheck, ArrowLeft } from "lucide-react";

export default function FireInspectionFormPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title="Fire Inspection Form" backTo="/inspection-division" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden"
        >
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="group w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-4 h-4 text-accent" />
              </div>
              <span className="flex-1 font-body text-sm font-medium text-foreground">
                Fire Inspection Form
              </span>
              <span className="text-xs text-accent font-medium">Open â</span>
            </button>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-border/60 flex items-center gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="font-heading text-base font-semibold text-foreground tracking-wide uppercase">
                  Fire Inspection Form
                </h2>
              </div>
              <iframe
                src="https://form.jotform.com/260886407564063"
                title="Fire Inspection Form"
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
