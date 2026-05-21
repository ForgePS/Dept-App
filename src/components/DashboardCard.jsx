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
        className="group block min-h-[132px] rounded-2xl bg-card/95 border border-border/70 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
        
        <div className="flex h-full items-center gap-5 p-5 sm:p-6">
          <div className={`${color} shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-semibold text-foreground tracking-wide uppercase">
              {title}
            </h3>
            {description &&
            <p className="text-sm sm:text-[15px] text-muted-foreground mt-1 font-body leading-relaxed">{description}</p>
            }
            {to && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
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
