import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, backTo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 sm:mb-8"
    >
      {backTo && (
        <Link
          to={backTo}
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-4 text-sm font-bold text-muted-foreground shadow-sm transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      )}
      <div className="command-panel relative overflow-hidden rounded-2xl px-5 py-5 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-red-500 to-slate-950" />
        <div className="flex gap-4">
          <div className="mt-1 hidden h-14 w-2 rounded-full bg-accent sm:block" />
          <div className="min-w-0">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-accent">
              Horn Lake Fire/EMS
            </p>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground tracking-wide uppercase leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground font-body mt-2 text-base sm:text-lg leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
