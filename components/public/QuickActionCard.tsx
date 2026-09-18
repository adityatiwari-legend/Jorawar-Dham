import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface QuickActionCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export default function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  badge,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-cream-ivory rounded-2xl border border-sandstone-200/80 p-6 shadow-sacred-sm hover:shadow-sacred-md hover:border-gold-royal/40 transition-all duration-300 flex flex-col justify-between overflow-hidden subtle-lift"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold-soft/10 via-transparent to-transparent pointer-events-none rounded-bl-full" />

      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cream-warm to-sandstone-200/70 border border-gold-royal/30 flex items-center justify-center text-maroon-primary group-hover:bg-maroon-deep group-hover:text-gold-royal group-hover:border-gold-royal transition-all duration-300 shadow-sm">
            <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 group-hover:text-maroon-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h3 className="text-lg font-serif font-bold text-maroon-deep group-hover:text-maroon-primary transition-colors line-clamp-1 mb-1.5">
          {title}
        </h3>
        <p className="text-xs text-mutedText leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-sandstone-100 flex items-center justify-between text-[11px] font-medium text-stone-500 group-hover:text-maroon-deep transition-colors">
        <span>विवरण देखें</span>
        <span className="text-gold-royal font-mono">→</span>
      </div>
    </Link>
  );
}
