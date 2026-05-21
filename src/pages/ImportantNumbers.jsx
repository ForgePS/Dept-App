import { useMemo, useState } from "react";
import { Phone, Search, X } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const filteredContacts = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return contacts;
    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(value) ||
      contact.numbers.some((number) => `${number.label} ${number.value}`.toLowerCase().includes(value))
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 py-8">
        <PageHeader title="Important Numbers" subtitle="Tap a number to call from the iPad." backTo="/" />
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contacts or numbers"
            className="h-14 w-full rounded-2xl border border-border/70 bg-card/90 pl-12 pr-12 text-base text-foreground shadow-sm outline-none focus:ring-2 focus:ring-accent/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {filteredContacts.map((contact, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm transition-colors hover:border-accent/30"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <p className="font-heading text-base font-semibold text-foreground tracking-wide uppercase">
                  {contact.name}
                </p>
              </div>
              <div className="space-y-2">
                  {contact.numbers.map((n, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">{n.label}</span>
                      <a
                        href={`tel:${n.value.replace(/[^\d+]/g, "")}`}
                        className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-3 text-base font-black text-accent-foreground shadow-sm hover:bg-red-700"
                      >
                        {n.value}
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
