"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase-browser";

/* ── Chicken palette tokens ──────────────────────────────── */
const C = {
  bg: "#FFF7ED",
  panel: "#FFFFFF",
  panelTint: "#FFFBF5",
  border: "#F1E3D2",
  text: "#1F2937",
  muted: "#6B7280",
  orange: "#F97316",
  orangeDeep: "#EA580C",
  orangeSoft: "#FFEDD5",
  yolk: "#FBBF24",
  yolkSoft: "#FEF3C7",
};

/* ── Sidebar nav items ───────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard", href: "/supervisor/dashboard" },
  { label: "Clients", href: "/supervisor/dashboard" },
  { label: "Goals", href: "/supervisor/dashboard" },
  { label: "Reports", href: "/supervisor/dashboard" },
  { label: "Settings", href: "/supervisor/dashboard" },
];

function SidebarItem({
  active,
  children,
  href,
}: {
  active?: boolean;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-orange-300",
        active
          ? "bg-orange-50 text-gray-900 font-medium border border-orange-200"
          : "text-gray-700 hover:bg-orange-50 border border-transparent",
      ].join(" ")}
      style={active ? { boxShadow: `0 1px 0 ${C.orangeSoft}` } : undefined}
    >
      {children}
    </Link>
  );
}

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", session.user.id)
        .single();

      if (error || !data?.role) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }

      if (data.role !== "supervisor") {
        router.replace("/child/home");
        return;
      }

      setUserName(data.display_name || "Supervisor");
      setCheckingAccess(false);
    });
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (checkingAccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.bg, color: C.muted }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, color: C.text }}>
      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside
        className="hidden md:flex w-64 flex-col border-r bg-white p-6 shrink-0"
        style={{ borderColor: C.border }}
      >
        {/* Brand */}
        <div className="mb-10">
          <Link href="/supervisor/dashboard" className="flex items-center gap-2.5">
            <Image
              src="/images/bawklogo.png"
              alt="Bawk logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div>
              <div
                className="text-lg font-semibold tracking-tight leading-tight"
                style={{ color: C.orangeDeep }}
              >
                bawk
              </div>
              <div className="text-xs" style={{ color: C.muted }}>
                Supervisor Dashboard
              </div>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <SidebarItem
              key={item.label}
              href={item.href}
              active={
                item.label === "Dashboard"
                  ? pathname === "/supervisor/dashboard"
                  : false
              }
            >
              {item.label}
            </SidebarItem>
          ))}
        </nav>

        {/* User card at bottom */}
        <div
          className="mt-6 rounded-xl border p-3"
          style={{ borderColor: C.border, background: C.panelTint }}
        >
          <div className="text-xs font-semibold truncate" style={{ color: C.orangeDeep }}>
            {userName}
          </div>
          <button
            onClick={handleSignOut}
            className="mt-2 text-xs hover:underline focus:outline-none focus:ring-2 focus:ring-orange-300 rounded"
            style={{ color: C.muted }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (small screens) ───────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b flex items-center justify-between px-4 py-3"
        style={{ borderColor: C.border }}
      >
        <Link href="/supervisor/dashboard" className="flex items-center gap-2">
          <Image
            src="/images/bawklogo.png"
            alt="Bawk logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg object-contain"
          />
          <span className="text-lg font-semibold" style={{ color: C.orangeDeep }}>
            bawk
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: C.muted }}>{userName}</span>
          <button
            onClick={handleSignOut}
            className="text-xs px-2 py-1 rounded border hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300"
            style={{ borderColor: C.border, color: C.muted }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
