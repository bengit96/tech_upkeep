import { db } from "@/lib/db";
import { outreachCampaigns, outreachProspects, outreachEmails } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface CampaignWithStats {
  id: number;
  name: string;
  target: string;
  targetLanguage: string | null;
  targetLevel: string | null;
  status: string;
  totalProspects: number | null;
  totalContacted: number | null;
  totalResponded: number | null;
  totalConverted: number | null;
  createdAt: Date;
}

export default async function OutreachPage() {
  // Get all campaigns
  const campaigns = (await db
    .select()
    .from(outreachCampaigns)
    .orderBy(desc(outreachCampaigns.createdAt))) as CampaignWithStats[];

  // Get overall stats
  const totalProspectsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachProspects);
  const totalProspects = Number(totalProspectsResult[0]?.count || 0);

  const contactedProspectsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachProspects)
    .where(eq(outreachProspects.status, "contacted"));
  const contactedProspects = Number(contactedProspectsResult[0]?.count || 0);

  const convertedProspectsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachProspects)
    .where(eq(outreachProspects.status, "converted"));
  const convertedProspects = Number(convertedProspectsResult[0]?.count || 0);

  const conversionRate =
    contactedProspects > 0
      ? ((convertedProspects / contactedProspects) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Outreach Campaigns
            </h1>
            <p className="text-gray-400 mt-2">
              Manage developer outreach and grow your newsletter audience
            </p>
          </div>
          <Link
            href="/admin/outreach/new"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all font-medium"
          >
            + New Campaign
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Total Prospects
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {totalProspects}
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Contacted
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {contactedProspects}
            </div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm font-medium mb-2">
              Converted
            </div>
            <div className="text-3xl font-bold text-green-400">
              {convertedProspects}
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

        {/* Campaigns List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            {campaigns.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-lg mb-2">No campaigns yet</p>
                <p className="text-sm">
                  Create your first campaign to start reaching out to
                  developers
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Prospects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Contacted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Converted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {campaigns.map((campaign) => {
                    const campaignConversionRate =
                      (campaign.totalContacted || 0) > 0
                        ? (
                            ((campaign.totalConverted || 0) /
                              (campaign.totalContacted || 0)) *
                            100
                          ).toFixed(1)
                        : "0.0";

                    return (
                      <tr
                        key={campaign.id}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {campaign.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(campaign.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="capitalize text-gray-300">
                              {campaign.target}
                            </span>
                            {campaign.targetLanguage && (
                              <span className="text-xs text-gray-400 capitalize">
                                {campaign.targetLanguage} •{" "}
                                {campaign.targetLevel || "all"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              campaign.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : campaign.status === "paused"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : campaign.status === "completed"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {campaign.totalProspects || 0}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {campaign.totalContacted || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-300">
                              {campaign.totalConverted || 0}
                            </span>
                            <span className="text-xs text-green-400">
                              {campaignConversionRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/outreach/${campaign.id}`}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/outreach/${campaign.id}/prospects`}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-sm transition-colors"
                            >
                              Prospects
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
