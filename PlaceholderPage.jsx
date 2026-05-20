import { Construction } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";

export default function PlaceholderPage({ title, backTo = "/" }) {
  const urlParams = new URLSearchParams(window.location.search);
  const pageTitle = title || urlParams.get("title") || "Page";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title={pageTitle} backTo={backTo} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl bg-card border border-border/60 shadow-sm p-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-muted-foreground" />
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
