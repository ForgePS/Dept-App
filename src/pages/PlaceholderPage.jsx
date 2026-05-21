import { Construction } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";

export default function PlaceholderPage({ title, backTo = "/" }) {
  const urlParams = new URLSearchParams(window.location.search);
  const pageTitle = title || urlParams.get("title") || "Page";

  return (
    <div className="app-shell">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title={pageTitle} backTo={backTo} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="command-panel overflow-hidden rounded-2xl p-10 text-center"
        >
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-950 shadow-lg">
            <Construction className="w-9 h-9 text-white" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground tracking-wide uppercase mb-2">
            Coming Soon
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            This section is under development.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
