/**
 * Discord Webhook Utility
 * Sends notifications to Discord for monitoring and logging
 */

function getWebhookUrl(): string {
  return process.env.DISCORD_WEBHOOK_EMAIL || "";
}

function getSubscribersWebhookUrl(): string {
  return process.env.DISCORD_WEBHOOK_SUBSCRIBERS || "";
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Send a message to Discord webhook
 */
export async function sendDiscordNotification(message: DiscordMessage, webhookUrl?: string): Promise<boolean> {
  const url = webhookUrl || getWebhookUrl();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return false;
  }
}

/**
 * Log email send success to Discord
 */
export async function logEmailSent(params: {
  email: string;
  subject: string;
  articleCount: number;
  newsletterSendId: number;
  resendEmailId?: string;
  type?: "newsletter" | "welcome";
}): Promise<boolean> {
  const { email, subject, articleCount, newsletterSendId, resendEmailId, type = "newsletter" } = params;

  const embed: DiscordEmbed = {
    title: "📧 Email Sent Successfully",
    color: 0x10B981, // Green
    fields: [
      {
        name: "📮 Recipient",
        value: email,
        inline: true,
      },
      {
        name: "📋 Type",
        value: type === "welcome" ? "Welcome Email" : "Newsletter",
        inline: true,
      },
      {
        name: "📰 Articles",
        value: articleCount.toString(),
        inline: true,
      },
      {
        name: "📝 Subject",
        value: subject.length > 100 ? subject.substring(0, 97) + "..." : subject,
        inline: false,
      },
      {
        name: "🔢 Send ID",
        value: `#${newsletterSendId}`,
        inline: true,
      },
    ],
    footer: {
      text: "Tech Upkeep Email Service",
    },
    timestamp: new Date().toISOString(),
  };

  if (resendEmailId) {
    embed.fields!.push({
      name: "🎯 Resend ID",
      value: resendEmailId,
      inline: true,
    });
  }

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  });
}

/**
 * Log email send failure to Discord
 */
export async function logEmailFailed(params: {
  email: string;
  error: string;
  type?: "newsletter" | "welcome";
}): Promise<boolean> {
  const { email, error, type = "newsletter" } = params;

  const embed: DiscordEmbed = {
    title: "❌ Email Send Failed",
    color: 0xEF4444, // Red
    fields: [
      {
        name: "📮 Recipient",
        value: email,
        inline: true,
      },
      {
        name: "📋 Type",
        value: type === "welcome" ? "Welcome Email" : "Newsletter",
        inline: true,
      },
      {
        name: "⚠️ Error",
        value: error.length > 200 ? error.substring(0, 197) + "..." : error,
        inline: false,
      },
    ],
    footer: {
      text: "Tech Upkeep Email Service",
    },
    timestamp: new Date().toISOString(),
  };

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  });
}

/**
 * Log newsletter batch summary to Discord
 */
export async function logNewsletterBatch(params: {
  totalSent: number;
  totalFailed: number;
  totalRecipients: number;
  duration: number; // in milliseconds
}): Promise<boolean> {
  const { totalSent, totalFailed, totalRecipients, duration } = params;

  const successRate = totalRecipients > 0 ? ((totalSent / totalRecipients) * 100).toFixed(1) : "0.0";
  const durationSeconds = (duration / 1000).toFixed(1);

  const embed: DiscordEmbed = {
    title: "📊 Newsletter Batch Complete",
    color: totalFailed === 0 ? 0x10B981 : totalFailed < totalSent ? 0xF59E0B : 0xEF4444, // Green/Yellow/Red
    fields: [
      {
        name: "✅ Sent",
        value: totalSent.toString(),
        inline: true,
      },
      {
        name: "❌ Failed",
        value: totalFailed.toString(),
        inline: true,
      },
      {
        name: "👥 Total",
        value: totalRecipients.toString(),
        inline: true,
      },
      {
        name: "📈 Success Rate",
        value: `${successRate}%`,
        inline: true,
      },
      {
        name: "⏱️ Duration",
        value: `${durationSeconds}s`,
        inline: true,
      },
    ],
    footer: {
      text: "Tech Upkeep Email Service",
    },
    timestamp: new Date().toISOString(),
  };

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  });
}

/**
 * Log general info message to Discord
 */
export async function logInfo(message: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: "ℹ️ Info",
    description: message,
    color: 0x3B82F6, // Blue
    footer: {
      text: "Tech Upkeep",
    },
    timestamp: new Date().toISOString(),
  };

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  });
}

/**
 * Log error message to Discord
 */
export async function logError(title: string, error: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: `🚨 ${title}`,
    description: error.length > 400 ? error.substring(0, 397) + "..." : error,
    color: 0xEF4444, // Red
    footer: {
      text: "Tech Upkeep",
    },
    timestamp: new Date().toISOString(),
  };

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  });
}

/**
 * Log new subscriber to Discord
 */
export async function logNewSubscriber(params: {
  email: string;
  source?: string; // Where they signed up from (e.g., "landing page", "newsletter preview", etc.)
  totalSubscribers?: number; // Current total subscriber count
}): Promise<boolean> {
  const { email, source = "website", totalSubscribers } = params;

  const embed: DiscordEmbed = {
    title: "🎉 New Subscriber!",
    color: 0x10B981, // Green
    fields: [
      {
        name: "📧 Email",
        value: email,
        inline: false,
      },
      {
        name: "📍 Source",
        value: source,
        inline: true,
      },
    ],
    footer: {
      text: "Tech Upkeep Subscribers",
    },
    timestamp: new Date().toISOString(),
  };

  if (totalSubscribers !== undefined) {
    embed.fields!.push({
      name: "👥 Total Subscribers",
      value: totalSubscribers.toString(),
      inline: true,
    });
  }

  // Milestone celebrations
  if (totalSubscribers) {
    const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    if (milestones.includes(totalSubscribers)) {
      embed.title = `🎊 Milestone: ${totalSubscribers} Subscribers! 🎊`;
      embed.color = 0xF59E0B; // Orange for milestones
      embed.description = `Just hit ${totalSubscribers} subscribers! 🚀`;
    }
  }

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  }, getSubscribersWebhookUrl());
}

/**
 * Log unsubscribe event to Discord
 */
export async function logUnsubscribe(params: {
  email: string;
  reason?: string;
  totalSubscribers?: number;
}): Promise<boolean> {
  const { email, reason, totalSubscribers } = params;

  const embed: DiscordEmbed = {
    title: "👋 Unsubscribe",
    color: 0xF59E0B, // Orange
    fields: [
      {
        name: "📧 Email",
        value: email,
        inline: false,
      },
    ],
    footer: {
      text: "Tech Upkeep Subscribers",
    },
    timestamp: new Date().toISOString(),
  };

  if (reason) {
    embed.fields!.push({
      name: "💭 Reason",
      value: reason,
      inline: false,
    });
  }

  if (totalSubscribers !== undefined) {
    embed.fields!.push({
      name: "👥 Total Subscribers",
      value: totalSubscribers.toString(),
      inline: true,
    });
  }

  return await sendDiscordNotification({
    embeds: [embed],
    username: "Tech Upkeep Bot",
  }, getSubscribersWebhookUrl());
}
