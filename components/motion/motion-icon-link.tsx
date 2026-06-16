"use client";

import { motion } from "framer-motion";

type MotionIconLinkProps = Omit<
  React.ComponentProps<"a">,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

const spring = { stiffness: 400, damping: 20 };

export default function MotionIconLink(props: MotionIconLinkProps) {
  return (
    <motion.a
      whileHover={{ scale: 1.5, y: -1 }}
      whileFocus={{ scale: 1.5, y: -1 }}
      transition={{ type: "spring", ...spring }}
      {...props}
    />
  );
}
