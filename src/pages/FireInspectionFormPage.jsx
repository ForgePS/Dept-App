import { useState } from "react";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";

export default function FireInspectionFormPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <PageHeader title="Fire Inspection Form" subtitle="Open the inspection form without leaving the app." backTo="/inspection-division" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="command-panel overflow-hidden rounded-2xl"
        >
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="group flex min-h-[84px] w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent">
                <ClipboardCheck className="h-5 w-5 text-accent transition-colors group-hover:text-white" />
              </div>
              <span className="flex-1 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
                Fire Inspection Form
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-accent">
                Open
              </span>
            </button>
          ) : (
            <>
              <div className="metal-header flex items-center gap-3 px-6 py-4">
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="font-heading text-base font-semibold uppercase tracking-wide text-white">
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
