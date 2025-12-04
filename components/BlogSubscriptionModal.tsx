"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  X,
  Mail,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface RecentContent {
  id: number;
  title: string;
  sourceName: string;
  isFeatured?: boolean;
  featuredOrder?: number | null;
}

interface BlogSubscriptionModalProps {
  source?: string; // e.g., "blog"
  sourcePage?: string; // e.g., "/blog/aws-outage-october-2025-analysis"
}

export default function BlogSubscriptionModal({
  source = "landing-page",
  sourcePage,
}: BlogSubscriptionModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [recentContent, setRecentContent] = useState<RecentContent[]>([]);

  // Fetch recent newsletter content for preview
  useEffect(() => {
    const fetchRecentContent = async () => {
      try {
        const response = await fetch("/api/public/recent-content");
        const data = await response.json();
        if (data.hasContent && data.content.length > 0) {
          setRecentContent(data.content.slice(0, 3)); // Just top 3
        }
      } catch (error) {
        console.error("Failed to fetch recent content:", error);
      }
    };
    fetchRecentContent();
  }, []);

  useEffect(() => {
    // Guard against server-side rendering
    if (typeof window === 'undefined') return;

    // Check if user has already seen the modal in this session
    const hasSeenModal = sessionStorage.getItem("blog_subscription_modal_seen");
    if (hasSeenModal) {
      return;
    }

    let exitIntentTriggered = false;

    // Scroll-based trigger (50% instead of 75%)
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const scrollPercentage =
        (scrollTop / (scrollHeight - clientHeight)) * 100;

      if (scrollPercentage > 35 && !hasSeenModal && !exitIntentTriggered) {
        setIsOpen(true);
        sessionStorage.setItem("blog_subscription_modal_seen", "true");
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("mouseleave", handleExitIntent);
      }
    };

    // Exit-intent trigger (when cursor leaves top of viewport)
    const handleExitIntent = (e: MouseEvent) => {
      // Only trigger if cursor is leaving from top and moving upward
      if (e.clientY <= 0 && !hasSeenModal && !exitIntentTriggered) {
        exitIntentTriggered = true;
        setIsOpen(true);
        sessionStorage.setItem("blog_subscription_modal_seen", "true");
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("mouseleave", handleExitIntent);
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleExitIntent);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mouseleave", handleExitIntent);
    };
  }, []);

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

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);

      // Auto-close after 3 seconds on success
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    // Guard against server-side rendering
    if (typeof document === 'undefined') return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
            />

            {/* Modal Content */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 pointer-events-auto max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-800/50"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      className="text-center py-6"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
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
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      </motion.div>
                      <h2 className="text-2xl font-semibold text-gray-100 mb-2">
                        You're all set!
                      </h2>
                      <p className="text-gray-400 mb-4">
                        Check your inbox for your welcome newsletter.
                      </p>
                      <motion.div
                        className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 max-w-sm mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-blue-300 text-sm">
                          Don't see it? Check your spam folder.
                        </p>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-4 sm:mb-6">
                        <div className="flex items-start gap-2 sm:gap-3 mb-3">
                          <div>
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-100 mb-1.5 sm:mb-2 leading-tight">
                              Discover what's trending before your team asks
                            </h2>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                              <strong className="text-gray-300">
                                GitHub Trending
                              </strong>{" "}
                              + Big Tech engineering blogs + breaking tools—
                              delivered Tuesday & Friday to 2,500+ product
                              engineers.
                            </p>
                          </div>
                        </div>

                        {/* Value Props */}
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-400">
                            <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-400" />
                            <span>Early-adopter insights</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-400">
                            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-400" />
                            <span>Ship, don't just code</span>
                          </div>
                        </div>

                        {/* Recent Content Preview */}
                        {recentContent.length > 0 && (
                          <motion.div
                            className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2 font-medium">
                              📬 From our latest newsletter:
                            </p>
                            <div className="space-y-1 sm:space-y-1.5">
                              {recentContent.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-start gap-1.5 sm:gap-2"
                                >
                                  <span className="text-blue-400 text-[10px] sm:text-xs mt-0.5 flex-shrink-0">
                                    •
                                  </span>
                                  <p className="text-[10px] sm:text-xs text-gray-300 leading-relaxed line-clamp-2">
                                    {item.title}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <form
                        onSubmit={handleSubmit}
                        className="space-y-2.5 sm:space-y-3"
                      >
                        <div className="space-y-2">
                          <Input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-10 sm:h-11 text-sm sm:text-base bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <Button
                            type="submit"
                            className="w-full h-10 sm:h-11 text-sm sm:text-base bg-blue-600 hover:bg-blue-500 font-semibold"
                            disabled={isLoading}
                          >
                            {isLoading
                              ? "Subscribing..."
                              : "Get Free Updates →"}
                          </Button>
                        </div>

                        {error && (
                          <motion.div
                            className="bg-red-900/20 border border-red-700/50 text-red-300 px-3 py-2 rounded-lg text-sm flex items-start gap-2"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-center gap-2 sm:gap-3 text-gray-500 text-[10px] sm:text-xs">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
                            No spam
                          </span>
                          <span className="hidden xs:inline">•</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
                            Unsubscribe anytime
                          </span>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-md w-[92%] sm:w-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-900/95 px-4 py-3 shadow-xl backdrop-blur">
              <div className="mt-0.5">
                <Mail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-sm text-gray-200">
                <p className="font-medium">Subscription successful</p>
                <p className="text-gray-400">
                  The latest newsletter will be emailed to you shortly. If you
                  don't see it, check your spam.
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-auto text-gray-400 hover:text-gray-200 p-1 rounded-md hover:bg-gray-800/60"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
