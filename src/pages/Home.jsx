import { Stethoscope, Flame, ClipboardCheck, Search, Phone, ShieldCheck, Clock3, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import DashboardCard from "../components/DashboardCard";

export default function Home() {
  const cards = [
  {
    title: "EMS",
    description: "Forms, protocols, and EMS quick-reference material.",
    icon: Stethoscope,
    to: "/ems-forms",
    color: "bg-red-600",
    action: "EMS tools"
  },
  {
    title: "Fire",
    description: "Forms, SOGs, fire resources, and department documents.",
    icon: Flame,
    to: "/fire-forms",
    color: "bg-slate-950",
    action: "Fire tools"
  },
  {
    title: "Inspection Division",
    description: "Inspection forms, permits, and searchable 2024 IFC codes.",
    icon: ClipboardCheck,
    to: "/inspection-division",
    color: "bg-red-600",
    action: "Inspect"
  },
  {
    title: "Investigation Division",
    description: "Investigation resources and case documentation.",
    icon: Search,
    to: "/investigation-division",
    color: "bg-slate-950",
    action: "Review"
  },
  {
    title: "Important Numbers",
    description: "Tap-to-call contacts for dispatch, city support, and vendors.",
    icon: Phone,
    to: "/important-numbers",
    color: "bg-red-600",
    action: "Call list"
  }];


  return (
    <div className="app-shell">
      <div className="relative overflow-hidden border-b border-slate-900/20 bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(220,38,38,0.36),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:auto,44px_44px,44px_44px]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-red-600/20 to-transparent" />
        <div className="relative mx-auto grid max-w-6xl gap-7 px-5 py-8 sm:grid-cols-[auto_1fr] sm:items-center sm:py-11">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto sm:mx-0">
          
          <div className="relative">
            <img src="/images/horn-lake-logo.png"

            alt="Horn Lake Fire Department Logo"
            className="relative h-36 w-36 object-contain drop-shadow-lg sm:h-48 sm:w-48" />
          </div>
          
        </motion.div>
        <div className="text-center sm:text-left">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
          Field-ready command hub
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-2 font-heading text-5xl font-bold uppercase leading-none tracking-wide sm:text-7xl">
          Horn Lake Fire/EMS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mx-auto mt-3 max-w-2xl text-base font-medium leading-relaxed text-white/78 sm:mx-0 sm:text-lg">
          Department forms, protocols, contacts, fire codes, and field resources.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-5 grid grid-cols-3 gap-2 text-left">
          {[
            { label: "Ready", icon: ShieldCheck },
            { label: "Fast", icon: Clock3 },
            { label: "Local", icon: MapPin },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 shadow-lg backdrop-blur">
              <item.icon className="mb-2 h-5 w-5 text-red-300" />
              <p className="text-xs font-bold uppercase tracking-wide text-white/90">{item.label}</p>
            </div>
          ))}
        </motion.div>
        </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-6 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">Choose a section</p>
            <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-foreground">Department Tools</h2>
          </div>
          <div className="hidden rounded-full border border-border/70 bg-card/80 px-4 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground shadow-sm sm:block">
            iPad optimized
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card, i) =>
          <DashboardCard key={card.title} {...card} delay={0.15 + i * 0.08} />
          )}
        </div>
      </div>
    </div>);

}
