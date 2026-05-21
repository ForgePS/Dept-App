import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardCard({ title, description, icon: Icon, to, color = "bg-primary", delay = 0 }) {
  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      
      <Wrapper
        {...wrapperProps}
        className="group block rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-xl hover:border-border transition-all duration-300 overflow-hidden">
        
        <div className="flex items-center rounded-[32px] gap-7 p-6">
          <div className={`${color} shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-semibold text-foreground tracking-wide uppercase">
              {title}
            </h3>
            {description &&
            <p className="text-sm text-muted-foreground mt-0.5 font-body">{description}</p>
            }
          </div>
          {to &&
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all duration-300 shrink-0" />
          }
        </div>
      </Wrapper>
    </motion.div>);

}
