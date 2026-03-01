"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listChildren } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SupervisorDashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listChildren()
      .then((data) => setChildren(data.children))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="supervisor-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Students</h1>
        <p className="text-gray-500 mt-1">
          Manage goals and track progress for each child
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-2">No children linked yet.</p>
            <p className="text-sm text-gray-400">
              Link children through the Supabase dashboard or admin panel.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/supervisor/child/${child.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{child.display_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {child.age_band && (
                    <Badge variant="info">Age {child.age_band}</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
