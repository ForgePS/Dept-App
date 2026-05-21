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
      className="command-panel overflow-hidden rounded-2xl"
    >
      <div className="metal-header flex items-center gap-3 px-5 py-5 sm:px-6">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow">
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
            className="group flex min-h-[86px] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 sm:px-6"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent transition-colors">
              <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </div>
            <span className="flex-1 font-heading text-lg font-semibold uppercase tracking-wide text-foreground">
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
    <div className="app-shell">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <PageHeader
          title="Inspection Division"
          subtitle="Forms, permits, inspections, and searchable fire code resources."
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
