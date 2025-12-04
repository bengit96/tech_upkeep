"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Prospect, SendEmailResult } from "@/lib/types/outreach";

export default function ProspectsPage() {
  const params = useParams();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendEmailResult | null>(null);

  useEffect(() => {
    fetchProspects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProspects = async () => {
    try {
      const response = await fetch(`/api/admin/outreach/campaigns/${params.id}/prospects`);
      const data = await response.json();
      setProspects(data.prospects || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProspect = (id: number) => {
    setSelectedProspects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredProspectIds = filteredProspects.map(p => p.id);
    if (selectedProspects.length === filteredProspectIds.length) {
      setSelectedProspects([]);
    } else {
      setSelectedProspects(filteredProspectIds);
    }
  };

  const handleSendEmails = async () => {
    if (selectedProspects.length === 0) {
      alert("Please select at least one prospect");
      return;
    }

    // Confirm before sending
    const confirmed = window.confirm(
      `Send personalized emails to ${selectedProspects.length} selected prospect(s)?`
    );

    if (!confirmed) return;

    setSending(true);
    setSendResult(null);

    try {
      console.log("Sending emails to prospects:", selectedProspects);

      const response = await fetch("/api/admin/outreach/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: Number(params.id),
          prospectIds: selectedProspects,
        }),
      });

      console.log("Response status:", response.status);

      const result = await response.json();
      console.log("Response data:", result);

      if (result.success) {
        setSendResult(result);
        setSelectedProspects([]);
        await fetchProspects();

        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorMsg = result.error || "Unknown error occurred";
        console.error("Send failed:", errorMsg);
        alert(`Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      alert(`Failed to send emails: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  const filteredProspects = prospects.filter(p => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const statusCounts = {
    all: prospects.length,
    pending: prospects.filter(p => p.status === "pending").length,
    contacted: prospects.filter(p => p.status === "contacted").length,
    responded: prospects.filter(p => p.status === "responded").length,
    converted: prospects.filter(p => p.status === "converted").length,
  };

  const prospectsWithEmails = prospects.filter(p => p.email).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/outreach/${params.id}`}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Campaign
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Step 2: Review & Select Prospects
              </h1>
              <p className="text-gray-400 mt-2">
                {prospects.length} total prospects • {prospectsWithEmails} with emails • Select who you want to contact
              </p>
            </div>
            {selectedProspects.length > 0 && (
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleSendEmails}
                  disabled={sending}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all font-bold text-lg disabled:opacity-50 shadow-lg"
                >
                  {sending ? "Sending..." : `📧 Send to ${selectedProspects.length} Selected`}
                </button>
                <p className="text-xs text-gray-400">
                  Step 3: Bulk send personalized emails
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {sendResult && sendResult.sent && sendResult.sent > 0 && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="text-green-400 font-semibold mb-2">
                  Successfully sent {sendResult.sent} email{sendResult.sent > 1 ? 's' : ''}!
                </p>
                {sendResult.failed && sendResult.failed > 0 && (
                  <p className="text-yellow-400 text-sm mb-2">
                    {sendResult.failed} failed to send
                  </p>
                )}
                <div className="flex gap-3 mt-3">
                  <Link
                    href={`/admin/outreach/${params.id}`}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    ← Back to Campaign Dashboard
                  </Link>
                  <button
                    onClick={() => setSendResult(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Banner */}
        {prospects.length > 0 && selectedProspects.length === 0 && !sendResult && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👉</span>
              <div>
                <p className="text-blue-400 font-semibold mb-1">How to proceed:</p>
                <ol className="text-sm text-gray-300 space-y-1">
                  <li>1. Review the prospects below (check their profiles, stack, location)</li>
                  <li>2. Select prospects you want to contact using the checkboxes</li>
                  <li>3. Click the "Send to X Selected" button to send personalized emails</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Warning for prospects without emails */}
        {prospects.length > 0 && prospects.filter(p => !p.email).length > 0 && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-yellow-400 font-semibold mb-1">
                  {prospects.filter(p => !p.email).length} prospects don't have email addresses
                </p>
                <p className="text-sm text-gray-300">
                  These prospects cannot be emailed. Only prospects with valid emails can be selected.
                  {prospects[0]?.githubUrl && " (GitHub doesn't always provide public emails)"}
                  {prospects[0]?.twitterUrl && " (Twitter doesn't provide emails via API)"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? "bg-gradient-to-r from-blue-600 to-purple-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          ))}
        </div>

        {/* Prospects Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
          {filteredProspects.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg mb-2">No prospects found</p>
              <p className="text-sm">
                Try scraping GitHub to add prospects to this campaign
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProspects.length === filteredProspects.length && filteredProspects.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Stack
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredProspects.map((prospect) => (
                    <tr
                      key={prospect.id}
                      className={`hover:bg-gray-700/30 transition-colors ${
                        selectedProspects.includes(prospect.id) ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProspects.includes(prospect.id)}
                          onChange={() => handleSelectProspect(prospect.id)}
                          className="w-4 h-4 cursor-pointer"
                          disabled={!prospect.email}
                          title={!prospect.email ? "No email address available" : "Select prospect"}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">
                            {prospect.name || "Unknown"}
                          </span>
                          {prospect.githubUrl && (
                            <a
                              href={prospect.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                            >
                              🐙 GitHub Profile
                            </a>
                          )}
                          {prospect.twitterUrl && (
                            <a
                              href={prospect.twitterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                            >
                              𝕏 Twitter Profile
                            </a>
                          )}
                          {prospect.linkedinUrl && (
                            <a
                              href={prospect.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                            >
                              💼 LinkedIn Profile
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {prospect.email ? (
                          <span className="text-gray-300 text-sm">{prospect.email}</span>
                        ) : (
                          <span className="text-red-400 text-sm flex items-center gap-1">
                            <span>⚠️</span> No email
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-300 text-sm">
                            {prospect.stack || "N/A"}
                          </span>
                          {prospect.topRepo && (
                            <span className="text-xs text-gray-400">
                              {prospect.topRepo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm capitalize">
                          {prospect.level || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">
                          {prospect.location || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            prospect.status === "converted"
                              ? "bg-green-500/20 text-green-400"
                              : prospect.status === "contacted"
                              ? "bg-blue-500/20 text-blue-400"
                              : prospect.status === "responded"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {prospect.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
