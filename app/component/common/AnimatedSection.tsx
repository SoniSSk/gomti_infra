"use client";

import { motion } from "framer-motion";

export default function AnimatedSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 50,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
      }}
      viewport={{
        once: true,
      }}
    >
      {children}
    </motion.div>
  );
}
