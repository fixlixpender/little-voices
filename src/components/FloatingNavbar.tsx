"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { id: "/", label: "Home", icon: "🏠" },
  { id: "/memories", label: "All", icon: "📚" },
  { id: "/kids", label: "Kids", icon: "👶" },
  { id: "/settings", label: "Settings", icon: "⚙️" },
];

export default function FloatingNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 bg-white/70 backdrop-blur-xl border border-white/20 p-2 rounded-full shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.id;
          
          return (
            <Link
              key={tab.id}
              href={tab.id}
              className="relative px-5 py-3 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-[#F5AC44] rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`relative z-10 text-xl ${isActive ? 'filter brightness-0 invert' : 'opacity-50'}`}>
                {tab.icon}
              </span>
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 sm:opacity-100"
                >
                  {tab.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}