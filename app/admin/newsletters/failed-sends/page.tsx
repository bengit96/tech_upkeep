"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronLeft, RefreshCw, Send } from "lucide-react";

interface FailedItem {
  sendId: number;
  userId: number;
  email: string;
  sentAt: string;
  draftId: number | null;
  draftSubject: string;
}

export default function FailedSendsPage() {
  const [items, setItems] = useState<FailedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [draftFilter, setDraftFilter] = useState<string>("");
  const [isResending, setIsResending] = useState(false);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  useEffect(() => {
    fetchItems();
  }, [draftFilter]);

  async function fetchItems() {
    setLoading(true);
    try {
      const qs = draftFilter
        ? `?draftId=${encodeURIComponent(draftFilter)}`
        : "";
      const res = await fetch(`/api/admin/newsletters/failed-sends${qs}`);
      const data = await res.json();
      setItems(data.items || []);
      setSelected({});
    } catch (e) {
      console.error("Failed to load failed sends", e);
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: number) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAll() {
    const next: Record<number, boolean> = {};
    for (const it of items) next[it.sendId] = true;
    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  async function resendSelected() {
    const sendIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    if (sendIds.length === 0) return;
    setIsResending(true);
    try {
      const res = await fetch(`/api/admin/newsletters/failed-sends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to resend");
      } else {
        alert(`Resent: ${data.sent}, Failed: ${data.failed}`);
        fetchItems();
      }
    } catch (e) {
      console.error("Resend failed", e);
      alert("Resend failed");
    } finally {
      setIsResending(false);
    }
  }

  const uniqueDrafts = useMemo(() => {
    const map = new Map<number, string>();
    for (const it of items) {
      if (it.draftId)
        map.set(it.draftId, it.draftSubject || `Draft #${it.draftId}`);
    }
    return Array.from(map.entries()).map(([id, subject]) => ({ id, subject }));
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                Failed Newsletter Sends
              </h1>
              <p className="text-sm text-gray-400">
                Select entries with missing Resend IDs and resend them.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchItems}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button
                onClick={resendSelected}
                disabled={selectedCount === 0 || isResending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                    Resending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Resend Selected (
                    {selectedCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300">Filter by Draft ID:</label>
            <input
              value={draftFilter}
              onChange={(e) => setDraftFilter(e.target.value)}
              placeholder="e.g. 12"
              className="w-40 bg-gray-800 text-gray-100 border border-gray-700 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
            />
            <div className="text-xs text-gray-500 ml-auto">
              Showing {items.length} entries
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center text-gray-400">
              No failed sends found.
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-800 text-gray-300">
                    <tr>
                      <th className="p-3 text-left w-10">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) selectAll();
                            else clearSelection();
                          }}
                          checked={
                            selectedCount === items.length && items.length > 0
                          }
                          aria-label="Select all"
                        />
                      </th>
                      <th className="p-3 text-left">User Email</th>
                      <th className="p-3 text-left">Draft</th>
                      <th className="p-3 text-left">Sent At</th>
                      <th className="p-3 text-left">Send ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr
                        key={it.sendId}
                        className="border-b border-gray-800/60 hover:bg-gray-800/40"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={!!selected[it.sendId]}
                            onChange={() => toggle(it.sendId)}
                            aria-label={`Select send ${it.sendId}`}
                          />
                        </td>
                        <td className="p-3 text-gray-100">{it.email}</td>
                        <td className="p-3 text-gray-300">
                          {it.draftId ? (
                            <>
                              <span className="text-gray-100">
                                #{it.draftId}
                              </span>{" "}
                              <span className="text-gray-400">
                                {it.draftSubject}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-300">
                          {new Date(it.sentAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-gray-500">{it.sendId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
