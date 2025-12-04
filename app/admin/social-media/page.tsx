"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckSquare,
  Twitter,
  Copy,
  Download,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import HookPatternSelector from "@/components/HookPatternSelector";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Newsletter {
  id: number;
  name: string;
  subject: string;
  status: string;
  createdAt: string;
  contentCount: number;
}

interface Article {
  id: number;
  title: string;
  summary: string;
  link: string;
  categoryName?: string;
  thumbnailUrl?: string;
}

type SelectionMode = "auto" | "manual" | "view" | null;
type PlatformType = "tiktok" | "twitter-thread" | null;

export default function SocialMediaPage() {
  const [selectedNewsletter, setSelectedNewsletter] = useState<number | null>(
    null
  );
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedThread, setGeneratedThread] = useState<string>("");
  const [tiktokScript, setTiktokScript] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [copiedComment, setCopiedComment] = useState(false);
  const [selectedHookPattern, setSelectedHookPattern] =
    useState<string>("numbered_list");
  const [isGeneratingComic, setIsGeneratingComic] = useState(false);
  const [comicEpisode, setComicEpisode] = useState<any>(null);
  const [comicError, setComicError] = useState<string | null>(null);
  const [comicSuccess, setComicSuccess] = useState<string | null>(null);
  const [comicContentList, setComicContentList] = useState<any[]>([]);
  const [selectedComicContent, setSelectedComicContent] = useState<number[]>(
    []
  );
  const [isLoadingComicContent, setIsLoadingComicContent] = useState(false);

  // Fetch all newsletters
  const {
    data: newsletters,
    error: newslettersError,
    isLoading: newslettersLoading,
  } = useSWR<{ newsletters: Newsletter[] }>("/api/admin/newsletters", fetcher);

  // Handle opening the generation modal
  const handleOpenGenerateModal = async (
    newsletterId: number,
    platform: PlatformType
  ) => {
    setSelectedNewsletter(newsletterId);
    setSelectedPlatform(platform);
    setSelectionMode(null);
    setSelectedArticles([]);
    setGeneratedThread("");
    setTiktokScript("");
    setCopied(false);
    setCopiedComment(false);
    setError(null);
    setSuccess(null);
  };

  // Handle mode selection
  const handleModeSelection = async (mode: "auto" | "manual") => {
    setSelectionMode(mode);

    if (mode === "manual") {
      // Load articles for manual selection
      setIsLoadingArticles(true);
      try {
        const response = await fetch(
          `/api/admin/content/list?newsletterDraftId=${selectedNewsletter}`
        );
        const data = await response.json();
        setAvailableArticles(data.items || []);
      } catch (err) {
        console.error("Failed to load articles", err);
        setError("Failed to load articles. Please try again.");
      } finally {
        setIsLoadingArticles(false);
      }
    } else {
      // Auto mode - proceed directly to generation
      await handleGenerate(mode);
    }
  };

  // Handle article selection toggle
  const toggleArticle = (id: number) => {
    setSelectedArticles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Handle article reordering
  const moveArticle = (id: number, direction: -1 | 1) => {
    setSelectedArticles((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const newOrder = [...prev];
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= newOrder.length) return prev;
      [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
      return newOrder;
    });
  };

  // Handle generation
  const handleGenerate = async (mode: SelectionMode) => {
    if (!selectedNewsletter || !selectedPlatform) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedPlatform === "tiktok") {
        // TikTok generation flow
        setGenerationStatus("Creating TikTok post...");

        const existingPosts = await fetch(
          `/api/admin/social-media/${selectedNewsletter}`
        );
        const { posts } = await existingPosts.json();
        let tiktokPost = posts?.find((p: any) => p.platform === "tiktok");

        if (!tiktokPost) {
          const generateResponse = await fetch(
            "/api/admin/social-media/generate",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                newsletterDraftId: selectedNewsletter,
                platforms: ["tiktok"],
              }),
            }
          );

          if (!generateResponse.ok) {
            const errorData = await generateResponse.json();
            throw new Error(errorData.error || "Failed to generate post");
          }

          const updatedPosts = await fetch(
            `/api/admin/social-media/${selectedNewsletter}`
          );
          const { posts: newPosts } = await updatedPosts.json();
          tiktokPost = newPosts?.find((p: any) => p.platform === "tiktok");
        }

        if (!tiktokPost) {
          throw new Error("TikTok post could not be created");
        }

        if (mode === "auto") {
          setGenerationStatus("🤖 AI is selecting best articles...");
        } else {
          setGenerationStatus("🎨 Generating slides with your selection...");
        }

        const imagesResponse = await fetch(
          `/api/admin/social-media/post/${tiktokPost.id}/images`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode,
              hookPatternId: selectedHookPattern,
              ...(mode === "manual" && { articleIds: selectedArticles }),
            }),
          }
        );

        if (!imagesResponse.ok) {
          const errorData = await imagesResponse.json();
          throw new Error(errorData.error || "Failed to generate slides");
        }

        const blob = await imagesResponse.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const contentDisposition = imagesResponse.headers.get(
          "Content-Disposition"
        );
        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1].replace(/"/g, "")
          : `tiktok_slides_${mode}_${tiktokPost.id}.zip`;

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Store the script content for viewing
        setTiktokScript(tiktokPost.content);
        setSuccess(`✅ TikTok slides downloaded successfully! (${mode} mode)`);
        setSelectionMode("view"); // Set to view mode to show script and pinned comment
      } else if (selectedPlatform === "twitter-thread") {
        // Twitter thread generation flow
        setGenerationStatus("🐦 Generating Twitter thread...");

        const existingPosts = await fetch(
          `/api/admin/social-media/${selectedNewsletter}`
        );
        const { posts } = await existingPosts.json();
        let twitterPost = posts?.find(
          (p: any) => p.platform === "twitter-thread"
        );

        if (!twitterPost) {
          const generateResponse = await fetch(
            "/api/admin/social-media/generate",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                newsletterDraftId: selectedNewsletter,
                platforms: ["twitter-thread"],
              }),
            }
          );

          if (!generateResponse.ok) {
            const errorData = await generateResponse.json();
            throw new Error(errorData.error || "Failed to generate thread");
          }

          const updatedPosts = await fetch(
            `/api/admin/social-media/${selectedNewsletter}`
          );
          const { posts: newPosts } = await updatedPosts.json();
          twitterPost = newPosts?.find(
            (p: any) => p.platform === "twitter-thread"
          );
        }

        if (!twitterPost) {
          throw new Error("Twitter thread could not be created");
        }

        setGeneratedThread(twitterPost.content);
        setSuccess("✅ Twitter thread generated successfully!");
        setSelectionMode("view"); // Set to view mode to show the thread
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate content"
      );
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  // Generate only the first (hook) slide for TikTok
  const handleGenerateHookOnly = async () => {
    if (!selectedNewsletter) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setGenerationStatus("🎣 Generating hook slide...");

    try {
      // Ensure TikTok post exists
      const existingPosts = await fetch(
        `/api/admin/social-media/${selectedNewsletter}`
      );
      const { posts } = await existingPosts.json();
      let tiktokPost = posts?.find((p: any) => p.platform === "tiktok");

      if (!tiktokPost) {
        const generateResponse = await fetch(
          "/api/admin/social-media/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newsletterDraftId: selectedNewsletter,
              platforms: ["tiktok"],
            }),
          }
        );

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(errorData.error || "Failed to create TikTok post");
        }

        const updatedPosts = await fetch(
          `/api/admin/social-media/${selectedNewsletter}`
        );
        const { posts: newPosts } = await updatedPosts.json();
        tiktokPost = newPosts?.find((p: any) => p.platform === "tiktok");
      }

      if (!tiktokPost) {
        throw new Error("TikTok post could not be created");
      }

      // Request only the first slide (hook)
      const response = await fetch(
        `/api/admin/social-media/post/${tiktokPost.id}/images`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "auto",
            hookPatternId: selectedHookPattern,
            onlyFirstSlide: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate hook slide");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `tiktok_hook_${tiktokPost.id}.png`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess("✅ Hook slide downloaded successfully!");
    } catch (err) {
      console.error("Hook generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate hook slide"
      );
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  // Extract pinned comment from TikTok script
  const extractPinnedComment = (script: string): string => {
    const match = script.match(/📌 PINNED COMMENT:\s*\n(.+?)(?:\n\n|$)/s);
    return match ? match[1].trim() : "No pinned comment found";
  };

  // Handle copying thread to clipboard
  const handleCopyThread = async () => {
    try {
      await navigator.clipboard.writeText(generatedThread);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle copying pinned comment to clipboard
  const handleCopyComment = async () => {
    try {
      const comment = extractPinnedComment(tiktokScript);
      await navigator.clipboard.writeText(comment);
      setCopiedComment(true);
      setTimeout(() => setCopiedComment(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle downloading thread as text file
  const handleDownloadThread = () => {
    const blob = new Blob([generatedThread], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `twitter_thread_${selectedNewsletter}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Close modal
  const handleCloseModal = () => {
    if (!isGenerating) {
      setSelectedNewsletter(null);
      setSelectedPlatform(null);
      setSelectionMode(null);
      setSelectedArticles([]);
      setGeneratedThread("");
      setTiktokScript("");
      setCopied(false);
      setCopiedComment(false);
      setError(null);
    }
  };

  // Load comic content list
  const handleLoadComicContent = async () => {
    setIsLoadingComicContent(true);
    try {
      const response = await fetch("/api/admin/comic-tiktok/list");
      const data = await response.json();
      setComicContentList(data.content || []);
      if (data.content?.length > 0) {
        setSelectedComicContent([data.content[0].id]); // Pre-select first
      }
    } catch (err) {
      console.error("Error loading content:", err);
    } finally {
      setIsLoadingComicContent(false);
    }
  };

  // Toggle content selection
  const toggleContentSelection = (id: number) => {
    setSelectedComicContent((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Generate comic TikTok episode
  const handleGenerateComicEpisode = async () => {
    if (selectedComicContent.length === 0) {
      setComicError("Please select at least one article");
      return;
    }

    setIsGeneratingComic(true);
    setComicError(null);
    setComicSuccess(null);

    try {
      const response = await fetch("/api/admin/comic-tiktok/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentIds: selectedComicContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details ||
            errorData.error ||
            "Failed to generate comic episode"
        );
      }

      const data = await response.json();
      setComicEpisode(data.episode);
      setComicSuccess(`✅ ${data.message}`);
    } catch (err) {
      console.error("Comic generation error:", err);
      setComicError(
        err instanceof Error ? err.message : "Failed to generate comic episode"
      );
    } finally {
      setIsGeneratingComic(false);
    }
  };

  if (newslettersLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Social Media Content Generator
              </h1>
              <p className="text-gray-400">
                Generate TikTok slides and Twitter threads from your newsletters
              </p>
            </div>
            <Link href="/admin">
              <Button
                variant="outline"
                className="bg-gray-800/50 border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Success/Error messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-700 text-red-300"
          >
            ❌ {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-950/30 border border-green-700 text-green-300"
          >
            {success}
          </motion.div>
        )}
        {comicSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-950/30 border border-green-700 text-green-300"
          >
            {comicSuccess}
          </motion.div>
        )}
        {comicError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-700 text-red-300"
          >
            ❌ {comicError}
          </motion.div>
        )}
        {newslettersError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-700 text-red-300"
          >
            ❌ Error loading newsletters: {newslettersError.message}
          </motion.div>
        )}

        {/* Comic TikTok Generator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700 hover:border-purple-600 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-6 w-6 text-yellow-400" />
                    <CardTitle className="text-white">
                      Comic TikTok Series Generator
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    Generate 4-slide satirical comics in "The Woke Salaryman"
                    style with character-driven humor
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleLoadComicContent}
                    disabled={
                      isLoadingComicContent || comicContentList.length > 0
                    }
                    variant="outline"
                    className="bg-gray-800/50 border-purple-700 text-gray-200 hover:bg-gray-800"
                  >
                    {isLoadingComicContent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Select Article
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateComicEpisode}
                    disabled={
                      isGeneratingComic || selectedComicContent.length === 0
                    }
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isGeneratingComic ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Episode
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Article Selection */}
            {comicContentList.length > 0 && !comicEpisode && (
              <CardContent className="mb-4 p-4 border-t border-purple-700">
                <p className="text-xs text-gray-400 mb-3">
                  📰 Select an article to base the comic on:
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {comicContentList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleContentSelection(item.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedComicContent.includes(item.id)
                          ? "bg-purple-700/40 border border-purple-500"
                          : "bg-gray-800/30 border border-gray-700 hover:border-purple-600"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedComicContent.includes(item.id)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {item.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}

            {/* Comic Episode Display */}
            {comicEpisode && (
              <CardContent className="space-y-4">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-purple-700">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-purple-300">
                          Episode #{comicEpisode.episodeNumber}
                        </h3>
                        <p className="text-white font-semibold text-lg mt-1">
                          {comicEpisode.newsTitle}
                        </p>
                      </div>
                      <span className="text-xs bg-purple-700/40 text-purple-200 px-2 py-1 rounded">
                        {comicEpisode.theme}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">
                        🎣 HOOK (TikTok Caption)
                      </p>
                      <p className="text-sm text-gray-100 bg-gray-800/50 p-2 rounded font-medium">
                        {comicEpisode.hook}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">💥 MAIN TAKE</p>
                      <p className="text-sm text-gray-100 bg-gray-800/50 p-2 rounded">
                        {comicEpisode.mainTake}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">🏷️ HASHTAGS</p>
                      <p className="text-xs text-gray-100 bg-gray-800/50 p-2 rounded">
                        {comicEpisode.hashtags}
                      </p>
                    </div>
                  </div>

                  {/* Multi-Slide Display */}
                  <div className="border-t border-purple-700 pt-4 mt-4">
                    <p className="text-sm font-semibold text-purple-300 mb-3">
                      📽️ 4 COMIC SLIDES
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {comicEpisode.slides.map((slide: any) => (
                        <div
                          key={slide.slideNumber}
                          className="bg-gray-800/50 p-3 rounded border border-gray-700"
                        >
                          <div className="mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs font-bold text-purple-300">
                                Slide {slide.slideNumber}
                              </p>
                              <span className="text-xs bg-blue-700/40 text-blue-200 px-2 py-0.5 rounded">
                                {slide.character}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div>
                              <p className="text-gray-400 font-semibold">
                                💬 Dialogue:
                              </p>
                              <p className="text-gray-200 italic">
                                "{slide.dialogue}"
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400 font-semibold">
                                🎤 Narration (Voice-over):
                              </p>
                              <p className="text-gray-200 italic">
                                {slide.narration}
                              </p>
                            </div>

                            <div>
                              <p className="text-gray-400 font-semibold mb-1">
                                🎨 Image Prompt:
                              </p>
                              <p className="text-gray-300 bg-gray-900/50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                                {slide.imagePrompt}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-gray-700">
                              <p className="text-xs text-gray-500">
                                💡 Copy the image prompt above to
                                Gemini/Leonardo.ai (use "illustrated comic
                                style")
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded bg-blue-900/30 border border-blue-700">
                    <p className="text-xs text-blue-300 font-semibold mb-2">
                      📋 HOW TO CREATE YOUR TIKTOK SERIES
                    </p>
                    <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                      <li>
                        For EACH of the 4 slides: Copy the IMAGE PROMPT → Paste
                        in Gemini/Leonardo.ai
                      </li>
                      <li>Download each generated image</li>
                      <li>
                        Create 4 TikTok slides in Canva (image + slide
                        character/dialogue text)
                      </li>
                      <li>Add the NARRATION as voice-over for each slide</li>
                      <li>
                        Post all 4 slides consecutively with the HOOK as your
                        first caption
                      </li>
                      <li>Add HASHTAGS to boost visibility</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Newsletter List */}
        <div className="grid gap-6">
          {newsletters?.newsletters?.map((newsletter) => (
            <motion.div
              key={newsletter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {newsletter.subject}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {newsletter.name} •{" "}
                        {new Date(newsletter.createdAt).toLocaleDateString()} •{" "}
                        {newsletter.contentCount || 0} articles
                      </CardDescription>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          handleOpenGenerateModal(newsletter.id, "tiktok")
                        }
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        TikTok Slides
                      </Button>
                      <Button
                        onClick={() =>
                          handleOpenGenerateModal(
                            newsletter.id,
                            "twitter-thread"
                          )
                        }
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                      >
                        <Twitter className="mr-2 h-4 w-4" />
                        Twitter Thread
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}

          {newsletters?.newsletters?.length === 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12 text-center">
                <p className="text-gray-400 mb-4">No newsletters found</p>
                <Link href="/admin/newsletters/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Newsletter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Generation Modal */}
        <Dialog
          open={selectedNewsletter !== null}
          onOpenChange={handleCloseModal}
        >
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedPlatform === "tiktok"
                  ? "Generate TikTok Slides"
                  : "Generate Twitter Thread"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedPlatform === "tiktok"
                  ? "Choose how you want to select articles for your TikTok video"
                  : "AI will generate an engaging Twitter thread from your newsletter content"}
              </DialogDescription>
            </DialogHeader>

            {isGenerating ? (
              // Loading State
              <div className="py-12 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-lg text-gray-300 mb-2">{generationStatus}</p>
                <p className="text-sm text-gray-500">
                  This may take 30-60 seconds...
                </p>
              </div>
            ) : selectedPlatform === "tiktok" && selectionMode === "view" ? (
              // TikTok Script View
              <div className="py-6">
                <div className="mb-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-bold text-white mb-4">
                    📝 TikTok Script
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
                    {tiktokScript}
                  </pre>
                </div>

                {/* Pinned Comment Section */}
                <div className="mb-6 p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📌</span>
                    <h3 className="text-lg font-bold text-purple-200">
                      Pinned Comment
                    </h3>
                  </div>
                  <p className="text-purple-100 text-base mb-4 p-4 bg-purple-950/50 rounded border border-purple-700">
                    {extractPinnedComment(tiktokScript)}
                  </p>
                  <p className="text-xs text-purple-300 mb-3">
                    💡 Copy this and pin it under your TikTok video to drive
                    engagement!
                  </p>
                  <Button
                    onClick={handleCopyComment}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {copiedComment ? (
                      <>✓ Comment Copied!</>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Pinned Comment
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : selectedPlatform === "twitter-thread" &&
              selectionMode === "view" ? (
              // Twitter Thread View
              <div className="py-6">
                <div className="mb-4 p-6 bg-gray-800/50 border border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
                    {generatedThread}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopyThread}
                    variant="outline"
                    className="flex-1 bg-gray-800/50 border-gray-700 text-gray-200"
                  >
                    {copied ? (
                      <>✓ Copied!</>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownloadThread}
                    variant="outline"
                    className="flex-1 bg-gray-800/50 border-gray-700 text-gray-200"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download as .txt
                  </Button>
                  <Button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : selectedPlatform === "twitter-thread" &&
              selectionMode === null ? (
              // Twitter Thread Generation Prompt
              <div className="py-6">
                <div className="p-8 rounded-lg border-2 border-gray-700 bg-gray-800/50 text-center">
                  <Twitter className="h-16 w-16 text-sky-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-3">
                    Ready to Generate Twitter Thread
                  </h3>
                  <p className="text-gray-400 mb-6">
                    AI will analyze your newsletter content and create an
                    engaging multi-tweet thread optimized for Twitter
                    engagement.
                  </p>
                  <div className="flex gap-3 max-w-md mx-auto">
                    <Button
                      onClick={handleCloseModal}
                      variant="outline"
                      className="flex-1 bg-gray-800/50 border-gray-700 text-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleGenerate("auto")}
                      className="flex-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                    >
                      Generate Thread
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectionMode === null ? (
              // Mode Selection
              <div className="grid gap-6 py-6">
                {/* Hook Pattern Selector - Only show for TikTok */}
                {selectedPlatform === "tiktok" && (
                  <div className="mb-4">
                    <HookPatternSelector
                      value={selectedHookPattern}
                      onChange={setSelectedHookPattern}
                    />
                    <div className="mt-3">
                      <Button
                        onClick={handleGenerateHookOnly}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Hook Only
                      </Button>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeSelection("auto")}
                  className="p-8 rounded-lg border-2 border-gray-700 hover:border-blue-500 bg-gray-800/50 hover:bg-gray-800 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <Sparkles className="h-8 w-8 text-blue-500 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        🤖 Auto Selection (AI Picks)
                      </h3>
                      <p className="text-gray-400">
                        Let AI analyze all articles and select 3-5 that work
                        best together thematically for maximum engagement.
                      </p>
                      <div className="mt-4 text-sm text-blue-400">
                        ✨ Recommended for best results
                      </div>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeSelection("manual")}
                  className="p-8 rounded-lg border-2 border-gray-700 hover:border-purple-500 bg-gray-800/50 hover:bg-gray-800 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <CheckSquare className="h-8 w-8 text-purple-500 mt-1" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        ✋ Manual Selection (You Choose)
                      </h3>
                      <p className="text-gray-400">
                        Pick which articles to include in your TikTok video.
                        Full control over content and order.
                      </p>
                      <div className="mt-4 text-sm text-purple-400">
                        💡 Good for specific narratives
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            ) : (
              selectionMode === "manual" && (
                // Manual Article Selection
                <div className="py-6">
                  {isLoadingArticles ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                      <p className="text-gray-400">Loading articles...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-4 bg-purple-950/30 border border-purple-700 rounded-lg">
                        <p className="text-purple-200 text-sm">
                          <strong>💡 Tip:</strong> Select 3-5 articles for best
                          results. Use ↑↓ buttons to reorder selected articles.
                        </p>
                        <p className="text-purple-300 text-sm mt-2">
                          Selected: {selectedArticles.length} articles
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        {availableArticles.map((article) => {
                          const isSelected = selectedArticles.includes(
                            article.id
                          );
                          const orderIndex = selectedArticles.indexOf(
                            article.id
                          );

                          return (
                            <div
                              key={article.id}
                              className={`p-4 rounded-lg border ${
                                isSelected
                                  ? "border-purple-500 bg-purple-900/30"
                                  : "border-gray-700 bg-gray-800/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Thumbnail */}
                                {article.thumbnailUrl && (
                                  <div className="flex-shrink-0">
                                    <Image
                                      src={article.thumbnailUrl}
                                      alt={article.title}
                                      width={80}
                                      height={80}
                                      className="rounded-md object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-white font-semibold mb-1">
                                    {isSelected && `${orderIndex + 1}. `}
                                    {article.title}
                                  </div>
                                  <div className="text-xs text-gray-400 line-clamp-2 mb-2">
                                    {article.summary}
                                  </div>
                                  {article.categoryName && (
                                    <div className="text-xs text-purple-400">
                                      {article.categoryName}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-1 flex-shrink-0">
                                  {isSelected && (
                                    <div className="flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          moveArticle(article.id, -1)
                                        }
                                        className="h-7 px-2 bg-gray-800/50 border-gray-700 text-gray-200"
                                      >
                                        ↑
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          moveArticle(article.id, 1)
                                        }
                                        className="h-7 px-2 bg-gray-800/50 border-gray-700 text-gray-200"
                                      >
                                        ↓
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleArticle(article.id)}
                                    className={
                                      isSelected
                                        ? "h-7 px-3 bg-purple-700/50 border-purple-600 text-purple-200"
                                        : "h-7 px-3 bg-gray-800/50 border-gray-700 text-gray-200"
                                    }
                                  >
                                    {isSelected ? "Remove" : "Add"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleCloseModal}
                          variant="outline"
                          className="flex-1 bg-gray-800/50 border-gray-700 text-gray-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleGenerate("manual")}
                          disabled={selectedArticles.length === 0}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Generate Slides ({selectedArticles.length} articles)
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
