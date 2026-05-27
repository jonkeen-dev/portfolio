"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type MotionButtonLinkProps = Omit<
  React.ComponentProps<typeof Link>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

const MotionLink = motion.create(Link);

const spring = { stiffness: 400, damping: 25 };

export default function MotionButtonLink(props: MotionButtonLinkProps) {
  return (
    <MotionLink
      whileHover={{ scale: 1.05, y: -1 }}
      whileFocus={{ scale: 1.05, y: -1 }}
      transition={{ type: "spring", ...spring }}
      {...props}
    />
  );
}
