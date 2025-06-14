"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  href: string
  color: "blue" | "emerald" | "violet" | "amber"
}

export default function FeatureCard({ icon, title, description, href, color }: FeatureCardProps) {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50 hover:bg-blue-100",
      border: "border-blue-200",
      shadow: "group-hover:shadow-blue-200/50",
      icon: "text-blue-500",
      arrow: "text-blue-500",
    },
    emerald: {
      bg: "bg-emerald-50 hover:bg-emerald-100",
      border: "border-emerald-200",
      shadow: "group-hover:shadow-emerald-200/50",
      icon: "text-emerald-500",
      arrow: "text-emerald-500",
    },
    violet: {
      bg: "bg-violet-50 hover:bg-violet-100",
      border: "border-violet-200",
      shadow: "group-hover:shadow-violet-200/50",
      icon: "text-violet-500",
      arrow: "text-violet-500",
    },
    amber: {
      bg: "bg-amber-50 hover:bg-amber-100",
      border: "border-amber-200",
      shadow: "group-hover:shadow-amber-200/50",
      icon: "text-amber-500",
      arrow: "text-amber-500",
    },
  }

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -5 }}
        className={cn(
          "group p-6 rounded-xl border transition-all duration-300",
          colorClasses[color].bg,
          colorClasses[color].border,
          "hover:shadow-lg",
          colorClasses[color].shadow,
        )}
      >
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-4">{description}</p>
        <div className="flex items-center text-sm font-medium">
          <span>Explorer</span>
          <ArrowRight
            className={cn("ml-2 h-4 w-4 transition-transform group-hover:translate-x-1", colorClasses[color].arrow)}
          />
        </div>
      </motion.div>
    </Link>
  )
}
