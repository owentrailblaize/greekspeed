"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlumniPipeline } from "@/components/AlumniPipeline";
import { ActivelyHiringPage } from "@/components/ActivelyHiringPage";
import { MyChapterPage } from "@/components/MyChapterPage";

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 1.02 },
};

export function AlumniDashboard() {
  const [active, setActive] = useState("pipeline");
  const tabs = [
    { id: "pipeline", label: "Alumni Pipeline", component: AlumniPipeline },
    { id: "hiring", label: "Actively Hiring", component: ActivelyHiringPage },
    { id: "chapter", label: "My Chapter", component: MyChapterPage },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex space-x-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                active === t.id ? "bg-navy-600 text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {tabs.map(
          (t) =>
            t.id === active && (
              <motion.div key={t.id} variants={pageTransition} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                <t.component />
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );
} 