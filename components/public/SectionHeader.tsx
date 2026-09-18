import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionText?: string;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionHref,
  actionText,
  align = "left",
  theme = "light",
  className = "",
}: SectionHeaderProps) {
  const isCenter = align === "center";
  const isDark = theme === "dark";

  return (
    <div
      className={`flex flex-col ${
        isCenter ? "items-center text-center max-w-3xl mx-auto" : "sm:flex-row sm:items-end sm:justify-between"
      } gap-4 ${className}`}
    >
      <div className={`space-y-2 ${isCenter ? "" : "max-w-2xl"}`}>
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal">
              {eyebrow}
            </span>
          </div>
        )}
        <h2
          className={`text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight leading-tight ${
            isDark ? "text-cream-ivory" : "text-maroon-deep"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isDark ? "text-sandstone-300 font-light" : "text-stone-600"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actionHref && actionText && (
        <div className="shrink-0 pt-2 sm:pt-0">
          <Link
            href={actionHref}
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors group ${
              isDark
                ? "text-gold-soft hover:text-gold-royal"
                : "text-maroon-primary hover:text-gold-royal"
            }`}
          >
            <span>{actionText}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
}
