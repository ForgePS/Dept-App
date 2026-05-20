import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PageHeader({ title, subtitle, backTo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      )}
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-wide uppercase">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground font-body mt-1.5 text-base">{subtitle}</p>
      )}
    </motion.div>
  );
}
