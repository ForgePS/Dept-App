import { FileText, BookOpen, ClipboardCheck, ScrollText } from "lucide-react";
import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function SectionCard({ title, icon: Icon, items, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-card/95 border border-border/70 shadow-sm overflow-hidden"
    >
      <div className="px-5 sm:px-6 py-5 border-b border-border/60 flex items-center gap-3 bg-slate-950 text-white">
        <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shadow">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-heading text-xl font-semibold tracking-wide uppercase">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-border/40">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="group flex min-h-[76px] items-center gap-4 px-5 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <item.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <span className="flex-1 font-body text-sm font-medium text-foreground">
              {item.label}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

export default function InspectionDivision() {
  const formsItems = [
    { label: "Fire Inspection Form", icon: ClipboardCheck, to: "/inspection-division/fire-inspection-form" },
    { label: "Burn Permit", icon: ScrollText, to: "/inspection-division/burn-permit" },
  ];

  const codesItems = [
    { label: "Fire Codes & Regulations", icon: BookOpen, to: "/inspection-division/codes" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <PageHeader
          title="Inspection Division"
          subtitle="Forms, permits & code enforcement"
          backTo="/"
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard title="Forms" icon={FileText} items={formsItems} delay={0.1} />
          <SectionCard title="Codes" icon={BookOpen} items={codesItems} delay={0.2} />
        </div>
      </div>
    </div>
  );
}
