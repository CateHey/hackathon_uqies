"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PlanBundle } from "@free-me/core";
import { useUiStore } from "@/lib/store";
import { ExploreMap } from "./explore/explore-map";
import { ProfessionalPlan } from "./professional/professional-plan";

/**
 * Both modes receive the identical bundle. The switch is a one-line state change —
 * the world transforms into a dashboard and back; the plan never changes.
 */
export function PlanView({ bundle }: { bundle: PlanBundle }) {
  const mode = useUiStore((s) => s.mode);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={mode}
        initial={{ opacity: 0, scale: 0.985, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 1.01, filter: "blur(4px)" }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {mode === "explore" ? <ExploreMap bundle={bundle} /> : <ProfessionalPlan bundle={bundle} />}
      </motion.div>
    </AnimatePresence>
  );
}
