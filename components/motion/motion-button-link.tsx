"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type MotionButtonLinkProps = Omit<
  React.ComponentProps<typeof Link>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

const MotionLink = motion.create(Link);

export default function MotionButtonLink(props: MotionButtonLinkProps) {
  return <MotionLink {...props} />;
}
