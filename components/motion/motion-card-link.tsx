"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type MotionCardLinkProps = Omit<
  React.ComponentProps<typeof Link>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

const MotionLink = motion.create(Link);

export default function MotionCardLink(props: MotionCardLinkProps) {
  return <MotionLink {...props} />;
}
