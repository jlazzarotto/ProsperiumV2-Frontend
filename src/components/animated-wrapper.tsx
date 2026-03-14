"use client"

import { motion, type MotionProps } from "framer-motion"
import type { ReactNode } from "react"

interface AnimatedWrapperProps extends MotionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function AnimatedWrapper({ children, delay = 0, className = "", ...props }: AnimatedWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

