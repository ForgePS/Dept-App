import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardCard({ title, description, icon: Icon, to, color = "bg-primary", delay = 0, action = "Open" }) {
  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      
      <Wrapper
        {...wrapperProps}
        className="group relative block min-h-[152px] overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_24px_65px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-red-500 to-slate-950" />
        <div className="absolute -right-12 -top-12 h-28 w-28 rotate-45 border border-slate-900/10 bg-slate-900/[0.03]" />
        
        <div className="relative flex h-full items-center gap-5 p-5 sm:p-6">
          <div className={`${color} shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-slate-950/5 group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xl font-semibold text-foreground tracking-wide uppercase">
              {title}
            </h3>
            {description &&
            <p className="text-sm sm:text-[15px] text-muted-foreground mt-1 font-body leading-relaxed">{description}</p>
            }
            {to && (
              <span className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-accent/10 px-3 text-xs font-black uppercase tracking-wide text-accent">
                {action}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          {to &&
          <ChevronRight className="hidden sm:block w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all duration-300 shrink-0" />
          }
        </div>
      </Wrapper>
    </motion.div>);

}
