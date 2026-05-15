"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function Nav({ user }: { user: User }) {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/account", label: "Account" },
  ];

  return (
    <header className="border-b border-[#E8E8E2] bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-display text-xl text-[#1A1A18]">
          ColdCSV
        </Link>
        <nav className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition ${
                pathname === href
                  ? "text-[#1A1A18] font-medium"
                  : "text-[#5A5A54] hover:text-[#1A1A18]"
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="text-xs text-[#9A9A94] hidden sm:block">
            {user.email}
          </span>
        </nav>
      </div>
    </header>
  );
}
