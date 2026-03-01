"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/supervisor/dashboard"
            className="font-bold text-primary-700 text-lg"
          >
            Social Skills
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/supervisor/dashboard"
              className="text-sm text-gray-600 hover:text-primary-600"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
