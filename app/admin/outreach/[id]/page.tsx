"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Campaign, ScrapeResult, PlatformType } from "@/lib/types/outreach";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [scrapingPlatform, setScrapingPlatform] = useState<PlatformType | "">("");
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [startPage, setStartPage] = useState<number | "">("");

  useEffect(() => {
    fetchCampaign();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/admin/outreach/campaigns/${params.id}`);
      const data = await response.json();
      setCampaign(data.campaign);
      setEmailSubject(data.campaign.emailSubject || "");
      setEmailTemplate(data.campaign.emailTemplate || "");
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async (platform: PlatformType) => {
    setScraping(true);
    setScrapeResult(null);
    setScrapingPlatform(platform);

    try {
      const endpoint = platform === "github"
        ? "/api/admin/outreach/scrape-github"
        : "/api/admin/outreach/scrape-twitter";

      const requestBody: { campaignId: string | string[]; limit: number; startPage?: number } = {
        campaignId: params.id,
        limit: 50,
      };

      // Only include startPage if it's set
      if (startPage && startPage > 0) {
        requestBody.startPage = Number(startPage);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      setScrapeResult(result);

      // Refresh campaign data
      await fetchCampaign();
    } catch (error) {
      console.error(`Error scraping ${platform}:`, error);
      setScrapeResult({ error: `Failed to scrape ${platform}` });
    } finally {
      setScraping(false);
      setScrapingPlatform("");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/outreach/campaigns/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchCampaign();
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!emailSubject.trim() || !emailTemplate.trim()) {
      alert("Subject and template cannot be empty");
      return;
    }

    setSavingTemplate(true);
    try {
      const response = await fetch(`/api/admin/outreach/campaigns/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: emailSubject.trim(),
          emailTemplate: emailTemplate.trim(),
        }),
      });

      if (response.ok) {
        await fetchCampaign();
        setEditingTemplate(false);
        alert("✓ Email template updated successfully!");
      } else {
        alert("Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      alert("Error updating template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleCancelEdit = () => {
    setEmailSubject(campaign?.emailSubject || "");
    setEmailTemplate(campaign?.emailTemplate || "");
    setEditingTemplate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Campaign not found</div>
      </div>
    );
  }

  const conversionRate = campaign.totalContacted > 0
    ? ((campaign.totalConverted / campaign.totalContacted) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/outreach"
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Campaigns
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {campaign.name}
              </h1>
              <p className="text-gray-400 mt-2">
                {campaign.target} • {campaign.targetLanguage} • {campaign.targetLevel}
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={campaign.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Total Prospects
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {campaign.totalProspects || 0}
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Contacted
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {campaign.totalContacted || 0}
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Converted
            </div>
            <div className="text-3xl font-bold text-green-400">
              {campaign.totalConverted || 0}
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Conversion Rate
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {conversionRate}%
            </div>
          </div>
        </div>

        {/* Step-by-Step Workflow */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span>📋</span> Campaign Workflow
          </h2>

          {/* Workflow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Scrape Prospects */}
            <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border-2 ${
              campaign.totalProspects === 0 ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-700'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  campaign.totalProspects === 0 ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {campaign.totalProspects === 0 ? '1' : '✓'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Scrape Prospects</h3>
                  <p className="text-sm text-gray-400">Find developers</p>
                </div>
              </div>

              {campaign.totalProspects === 0 ? (
                <>
                  <p className="text-gray-400 mb-4 text-sm">
                    Start by scraping {campaign.targetLanguage} developers from {campaign.target}
                  </p>

                  {/* Page number input (optional) */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      Start from page (optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={startPage}
                      onChange={(e) => setStartPage(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Leave empty to auto-continue"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Leave empty to continue from last page, or specify a page number to skip ahead
                    </p>
                  </div>

                  {/* Platform-specific scraping buttons */}
                  <div className="space-y-3">
                    {campaign.target === "github" && (
                      <button
                        onClick={() => handleScrape("github")}
                        disabled={scraping}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {scraping && scrapingPlatform === "github" ? (
                          <>
                            <span className="animate-spin">⏳</span> Scraping...
                          </>
                        ) : (
                          <>
                            <span>🐙</span> Start Scraping GitHub
                          </>
                        )}
                      </button>
                    )}

                    {campaign.target === "twitter" && (
                      <button
                        onClick={() => handleScrape("twitter")}
                        disabled={scraping}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-400 hover:to-blue-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {scraping && scrapingPlatform === "twitter" ? (
                          <>
                            <span className="animate-spin">⏳</span> Scraping...
                          </>
                        ) : (
                          <>
                            <span>𝕏</span> Start Scraping Twitter
                          </>
                        )}
                      </button>
                    )}

                    {campaign.target === "linkedin" && (
                      <div className="w-full px-6 py-3 bg-gray-700/30 rounded-lg text-center text-gray-500 border border-gray-700 border-dashed text-sm">
                        <span>💼</span> LinkedIn (Coming Soon)
                      </div>
                    )}
                  </div>

                  {scrapeResult && (
                    <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                      {scrapeResult.error ? (
                        <p className="text-red-400 text-sm">{scrapeResult.error}</p>
                      ) : (
                        <div className="space-y-1 text-xs">
                          <p className="text-green-400">✓ Found: {scrapeResult.scraped}</p>
                          <p className="text-blue-400">✓ Added: {scrapeResult.inserted}</p>
                          {scrapeResult.withEmails !== undefined && (
                            <p className="text-emerald-400">📧 With emails: {scrapeResult.withEmails}</p>
                          )}
                          <p className="text-purple-400 font-semibold">Σ Total: {scrapeResult.totalProspects}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg mb-3">
                    <p className="text-green-400 font-semibold text-sm">
                      ✓ {campaign.totalProspects} prospects scraped
                    </p>
                  </div>

                  {/* Page number input (optional) */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-400 mb-2">
                      Start from page (optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={startPage}
                      onChange={(e) => setStartPage(e.target.value ? Number(e.target.value) : "")}
                      placeholder="Leave empty to auto-continue"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Leave empty to continue from last page
                    </p>
                  </div>

                  <button
                    onClick={() => handleScrape(campaign.target as PlatformType)}
                    disabled={scraping}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {scraping ? "Scraping..." : "Scrape More"}
                  </button>
                </>
              )}
            </div>

            {/* Step 2: Review & Select */}
            <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border-2 ${
              campaign.totalProspects > 0 && campaign.totalContacted === 0
                ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                : 'border-gray-700'
            } ${campaign.totalProspects === 0 ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  campaign.totalProspects === 0 ? 'bg-gray-600' :
                  campaign.totalContacted > 0 ? 'bg-green-600' : 'bg-purple-600'
                }`}>
                  {campaign.totalProspects === 0 ? '2' : campaign.totalContacted > 0 ? '✓' : '2'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Review & Select</h3>
                  <p className="text-sm text-gray-400">Choose who to contact</p>
                </div>
              </div>

              {campaign.totalProspects === 0 ? (
                <p className="text-gray-500 text-sm">
                  Complete Step 1 to review prospects
                </p>
              ) : (
                <>
                  <p className="text-gray-400 mb-4 text-sm">
                    Review the list and select developers you want to contact
                  </p>
                  <Link
                    href={`/admin/outreach/${campaign.id}/prospects`}
                    className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg transition-all font-medium text-center"
                  >
                    Review {campaign.totalProspects} Prospects →
                  </Link>
                  <div className="mt-3 text-xs text-gray-400 text-center">
                    {campaign.totalProspects - (campaign.totalContacted || 0)} pending review
                  </div>
                </>
              )}
            </div>

            {/* Step 3: Send Emails */}
            <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border-2 ${
              campaign.totalContacted > 0 ? 'border-green-500' : 'border-gray-700'
            } ${campaign.totalProspects === 0 ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  campaign.totalProspects === 0 ? 'bg-gray-600' :
                  campaign.totalContacted > 0 ? 'bg-green-600' : 'bg-gray-700'
                }`}>
                  {campaign.totalContacted > 0 ? '✓' : '3'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Send Emails</h3>
                  <p className="text-sm text-gray-400">Bulk outreach</p>
                </div>
              </div>

              {campaign.totalProspects === 0 ? (
                <p className="text-gray-500 text-sm">
                  Complete Steps 1-2 to send emails
                </p>
              ) : campaign.totalContacted === 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm">
                    Select prospects in Step 2, then send emails in bulk
                  </p>
                  <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <p className="text-blue-400 text-xs">
                      💡 Tip: You can send to selected prospects from the Review page
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <p className="text-green-400 font-semibold text-sm mb-1">
                      ✓ {campaign.totalContacted} emails sent
                    </p>
                    <p className="text-xs text-gray-400">
                      {campaign.totalConverted || 0} converted ({conversionRate}%)
                    </p>
                  </div>
                  <Link
                    href={`/admin/outreach/${campaign.id}/prospects`}
                    className="block w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm text-center"
                  >
                    Send to More Prospects
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Template */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Email Template</h2>
            {!editingTemplate ? (
              <button
                onClick={() => setEditingTemplate(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-sm font-medium"
              >
                ✏️ Edit Template
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={savingTemplate}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {savingTemplate ? "Saving..." : "💾 Save Changes"}
                </button>
              </div>
            )}
          </div>

          {editingTemplate ? (
            <>
              {/* Editing Mode */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter email subject..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Body</label>
                  <textarea
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter email template..."
                  />
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <p className="text-blue-400 text-sm font-semibold mb-2">📝 Available Variables:</p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li><code className="bg-gray-800 px-2 py-1 rounded">{'{{name}}'}</code> - Prospect's name</li>
                    <li><code className="bg-gray-800 px-2 py-1 rounded">{'{{language}}'}</code> - Programming language</li>
                    <li><code className="bg-gray-800 px-2 py-1 rounded">{'{{topRepo}}'}</code> - Most starred repository</li>
                    <li><code className="bg-gray-800 px-2 py-1 rounded">{'{{stack}}'}</code> - Tech stack (comma-separated)</li>
                    <li><code className="bg-gray-800 px-2 py-1 rounded">{'{{level}}'}</code> - Experience level (junior/mid/senior)</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* View Mode */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subject</label>
                  <div className="px-4 py-2 bg-gray-900 rounded-lg">
                    {campaign.emailSubject}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Body</label>
                  <div className="px-4 py-3 bg-gray-900 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {campaign.emailTemplate}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
