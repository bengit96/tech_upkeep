"use client";

import { motion } from "framer-motion";
import { AlertCircle, Cloud, Database, Network, Calendar } from "lucide-react";

interface OutageEvent {
  date: string;
  dateRange?: string;
  provider: string;
  duration: string;
  title: string;
  impact: string;
  rootCause: string;
  color: {
    border: string;
    bg: string;
    icon: string;
    text: string;
  };
  icon: React.ReactNode;
  postMortemUrl: string;
}

const outages: OutageEvent[] = [
  {
    date: "June 12",
    provider: "Google Cloud",
    duration: "3 hours",
    title: "Null Pointer Disaster",
    impact: "50+ services including Gmail, Spotify, Discord",
    rootCause: "Unprotected feature flag with null pointer bug",
    color: {
      border: "border-blue-500/40",
      bg: "bg-blue-900/20",
      icon: "text-blue-400",
      text: "text-blue-300"
    },
    icon: <Cloud className="h-5 w-5" />,
    postMortemUrl: "https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW"
  },
  {
    date: "Oct 19-20",
    dateRange: "October 19-20",
    provider: "AWS",
    duration: "14+ hours",
    title: "DynamoDB DNS Race Condition",
    impact: "DynamoDB, EC2, Lambda, ECS/EKS",
    rootCause: "DNS Enactor collision deleted all endpoint IPs",
    color: {
      border: "border-orange-500/40",
      bg: "bg-orange-900/20",
      icon: "text-orange-400",
      text: "text-orange-300"
    },
    icon: <Database className="h-5 w-5" />,
    postMortemUrl: "https://aws.amazon.com/message/101925/"
  },
  {
    date: "Oct 29-30",
    dateRange: "October 29-30",
    provider: "Azure",
    duration: "8.5 hours",
    title: "Async Processing Bug",
    impact: "Microsoft 365, Teams, Azure Portal",
    rootCause: "Incompatible metadata across build versions",
    color: {
      border: "border-purple-500/40",
      bg: "bg-purple-900/20",
      icon: "text-purple-400",
      text: "text-purple-300"
    },
    icon: <Network className="h-5 w-5" />,
    postMortemUrl: "https://azure.status.microsoft/en-us/status/history/"
  },
  {
    date: "Nov 18",
    dateRange: "November 18",
    provider: "Cloudflare",
    duration: "5h 46m",
    title: "Hardcoded Limit Disaster",
    impact: "12.5M websites, X, ChatGPT",
    rootCause: "200-feature hardcoded limit exceeded",
    color: {
      border: "border-yellow-500/40",
      bg: "bg-yellow-900/20",
      icon: "text-yellow-400",
      text: "text-yellow-300"
    },
    icon: <AlertCircle className="h-5 w-5" />,
    postMortemUrl: "https://blog.cloudflare.com/18-november-2025-outage/"
  }
];

export default function OutageTimeline() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  const lineVariants = {
    hidden: {
      height: 0,
      opacity: 0
    },
    visible: {
      height: "100%",
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <div className="my-12">
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Calendar className="h-6 w-6 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-100">
          2025 Cloud Outage Timeline
        </h2>
      </motion.div>

      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated Timeline Line */}
        <motion.div
          className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-yellow-500/50"
          variants={lineVariants}
          style={{ height: "calc(100% - 2rem)" }}
        />

        {/* Timeline Events */}
        <div className="space-y-8">
          {outages.map((outage, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative flex gap-6 group"
              whileHover={{ x: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Timeline Node */}
              <motion.div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${outage.color.bg} ${outage.color.border} border-2 backdrop-blur-sm`}
                whileHover={{
                  scale: 1.2,
                  rotate: 360,
                  transition: { duration: 0.5 }
                }}
              >
                <div className={outage.color.icon}>
                  {outage.icon}
                </div>
              </motion.div>

              {/* Event Card */}
              <motion.div
                className={`flex-1 rounded-lg ${outage.color.bg} ${outage.color.border} border p-6 backdrop-blur-sm hover:shadow-2xl transition-all duration-300`}
                whileHover={{
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-gray-400">
                        {outage.dateRange || outage.date}, 2025
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${outage.color.bg} ${outage.color.text} border ${outage.color.border}`}>
                        {outage.duration}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">
                      {outage.provider}: {outage.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium">Impact:</span>{" "}
                    <span className="text-gray-300">{outage.impact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Root Cause:</span>{" "}
                    <span className="text-gray-300">{outage.rootCause}</span>
                  </div>
                </div>

                <motion.a
                  href={outage.postMortemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 mt-3 text-xs ${outage.color.text} hover:underline`}
                  whileHover={{ x: 5 }}
                >
                  Read Official Post-Mortem →
                </motion.a>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Total Impact Summary */}
        <motion.div
          className="mt-12 p-6 bg-red-900/10 border border-red-500/30 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <h3 className="text-lg font-bold text-red-400 mb-2">
            Total 2025 Impact
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Combined Downtime:</span>
              <p className="text-gray-200 font-semibold">31+ hours</p>
            </div>
            <div>
              <span className="text-gray-500">Est. Financial Loss:</span>
              <p className="text-gray-200 font-semibold">$60–100B</p>
            </div>
            <div>
              <span className="text-gray-500">Services Affected:</span>
              <p className="text-gray-200 font-semibold">100+</p>
            </div>
            <div>
              <span className="text-gray-500">Root Cause:</span>
              <p className="text-gray-200 font-semibold">Config Errors</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}