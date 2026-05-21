import { Stethoscope, Flame, ClipboardCheck, Search, Phone } from "lucide-react";
// Flame still used in cards array below
import { motion } from "framer-motion";
import DashboardCard from "../components/DashboardCard";

export default function Home() {
  const cards = [
  {
    title: "EMS",
    description: "Emergency Medical Services documentation",
    icon: Stethoscope,
    to: "/ems-forms",
    color: "bg-accent"
  },
  {
    title: "Fire",
    description: "Fire department reports & documentation",
    icon: Flame,
    to: "/fire-forms",
    color: "bg-primary"
  },
  {
    title: "Inspection Division",
    description: "Inspections, permits & code enforcement",
    icon: ClipboardCheck,
    to: "/inspection-division",
    color: "bg-accent"
  },
  {
    title: "Investigation Division",
    description: "Fire investigation reports & cases",
    icon: Search,
    to: "/investigation-division",
    color: "bg-primary"
  },
  {
    title: "Important Numbers",
    description: "Key contacts & emergency numbers",
    icon: Phone,
    to: "/important-numbers",
    color: "bg-accent"
  }];


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative flex flex-col items-center pt-10 pb-6 px-5 shadow-sm border-b border-slate-400/40 opacity-100 bg-slate-400">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4">
          
          <img src="https://media.base44.com/images/public/69f9c7cc9025b4328efe3ba3/55c2ce711_Untitled.png"

          alt="Horn Lake Fire Department Logo"
          className="w-44 h-44 object-contain opacity-100"
          style={{ mixBlendMode: 'multiply' }} />
          
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-wider uppercase text-center">
          
          Horn Lake Fire/EMS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-body mt-1.5 text-center text-lg text-[hsl(var(--card-foreground))]">
          
          Department Resource Hub
        </motion.p>
      </div>

      {/* Cards */}
      <div className="max-w-2xl mx-auto px-5 pb-12">
        <div className="space-y-4">
          {cards.map((card, i) =>
          <DashboardCard key={card.title} {...card} delay={0.15 + i * 0.08} />
          )}
        </div>
      </div>
    </div>);

}
