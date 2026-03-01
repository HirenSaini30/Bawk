"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";

export default function ChildLayout({
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

      if (data.role !== "child") {
        router.replace("/supervisor/dashboard");
        return;
      }

      setUserName(data.display_name || "Friend");
      setCheckingAccess(false);
    });
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="px-4 py-3 flex items-center justify-between">
        <Link
          href="/child/home"
          className="font-bold text-primary-700 text-kid-base"
        >
          My Activities
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/child/pokemon">
            <Button variant="secondary" size="sm">
              My Pokemon
            </Button>
          </Link>
          <span className="text-sm text-gray-500">{userName}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="calm"
          size="lg"
          className="shadow-lg"
          onClick={() => {
            router.push("/child/task/calming");
          }}
        >
          I feel upset
        </Button>
      </div>

      <main>{children}</main>
    </div>
  );
}
