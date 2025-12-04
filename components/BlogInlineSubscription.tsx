"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface BlogInlineSubscriptionProps {
  source?: string;
  sourcePage?: string;
  heading?: string;
  description?: string;
}

export default function BlogInlineSubscription({
  source = "blog-inline",
  sourcePage,
  heading = "Start Your Learning System Today",
  description = "Join 2,500+ engineers who get curated tech content from Netflix, Uber, and Airbnb engineering teams. Plus GitHub Trending projects every Tuesday & Friday.",
}: BlogInlineSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          sourcePage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-12 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-8">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            className="text-center py-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 200,
              }}
            >
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">
              You're all set!
            </h2>
            <p className="text-gray-400 mb-3">
              Check your inbox for your welcome newsletter.
            </p>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 max-w-sm mx-auto">
              <p className="text-blue-300 text-sm">
                Don't see it? Check your spam folder.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-3">
                {heading}
              </h2>
              <p className="text-gray-400 mb-4">
                {description}
              </p>

              {/* Value Props */}
              <div className="flex items-center justify-center gap-4 mb-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span>Early-adopter insights</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span>Ship, don't just code</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="flex-1 h-12 text-base bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <Button
                  type="submit"
                  className="h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Subscribing..."
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <motion.div
                  className="bg-red-900/20 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2 max-w-md mx-auto"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Free forever
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Unsubscribe anytime
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
