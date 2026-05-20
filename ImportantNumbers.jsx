import { Phone } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { motion } from "framer-motion";

const contacts = [
  {
    name: "American Tire Shop",
    numbers: [{ label: "Shop", value: "(662)449-0110" }, { label: "Mobile", value: "(901)561-0034" }],
  },
  {
    name: "EEP D'Angelo",
    numbers: [{ label: "Mobile", value: "(901)831-0253" }, { label: "Shop", value: "(662)280-4729" }],
  },
  {
    name: "HL City Shop",
    numbers: [{ label: "Shop", value: "(662)342-4505" }, { label: "On Call", value: "(901)826-0761" }],
  },
  {
    name: "HL Dispatch",
    numbers: [{ label: "Main", value: "(662)393-6174" }],
  },
  {
    name: "HL IT",
    numbers: [{ label: "Daniel", value: "(662)548-6655" }, { label: "Jonathan", value: "(662)470-1704" }],
  },
  {
    name: "HL Public Works",
    numbers: [{ label: "Main", value: "(662)342-7099" }, { label: "Alt", value: "(662)342-4505" }],
  },
  {
    name: "HL Public Works Director",
    numbers: [{ label: "Steve Box", value: "(901)652-1307" }],
  },
  {
    name: "HL Water",
    numbers: [{ label: "Rodney", value: "(901)517-6182" }],
  },
  {
    name: "HL Animal Shelter",
    numbers: [{ label: "Main", value: "(662)393-5857" }],
  },
  {
    name: "Magnolia Tire",
    numbers: [{ label: "Main", value: "(662)342-0194" }],
  },
  {
    name: "Mississippi DEQ",
    numbers: [{ label: "Main", value: "(601)961-5171" }],
  },
  {
    name: "North MS Two Way",
    numbers: [{ label: "Main", value: "(662)429-5732" }],
  },
  {
    name: "Red Cross",
    numbers: [{ label: "Main", value: "(833)583-3111" }],
  },
  {
    name: "Board Up",
    numbers: [{ label: "Main", value: "1-800-262-7387" }],
  },
];

export default function ImportantNumbers() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <PageHeader title="Important Numbers" backTo="/" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden"
        >
          {contacts.map((contact, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-4 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-foreground tracking-wide uppercase">
                  {contact.name}
                </p>
                <div className="mt-1 space-y-0.5">
                  {contact.numbers.map((n, j) => (
                    <div key={j} className="flex items-center gap-2">
                      {contact.numbers.length > 1 && (
                        <span className="text-xs text-muted-foreground w-14 shrink-0">{n.label}:</span>
                      )}
                      <a
                        href={`tel:${n.value.replace(/[^\d+]/g, "")}`}
                        className="text-sm font-body text-accent hover:underline"
                      >
                        {n.value}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
