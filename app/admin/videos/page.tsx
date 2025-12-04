"use client";

import { useState } from "react";
import useSWR from "swr";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  Video,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Article {
  id: number;
  title: string;
  summary: string;
  link: string;
  status: string;
}

interface VideoGeneration {
  id: number;
  visualPrompt: string;
  narrationScript: string;
  style: string;
  duration: number;
  status: string;
  createdAt: string;
  article: {
    id: number;
    title: string;
    link: string;
  };
}

export default function VideosPage() {
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("tech-news");
  const [selectedDuration, setSelectedDuration] = useState<number>(8);
  const [selectedResolution, setSelectedResolution] = useState<string>("720p");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<VideoGeneration | null>(null);
  const [copiedVisual, setCopiedVisual] = useState(false);
  const [copiedNarration, setCopiedNarration] = useState(false);

  // Fetch accepted articles for video generation
  const {
    data: articlesData,
    error: articlesError,
    isLoading: articlesLoading,
  } = useSWR<{ items: Article[] }>(
    "/api/admin/content?status=accepted&limit=100",
    fetcher
  );

  // Fetch all video generations
  const {
    data: videosData,
    error: videosError,
    mutate: mutateVideos,
  } = useSWR<{ videos: VideoGeneration[] }>("/api/admin/videos", fetcher);

  const handleGenerateVideo = async () => {
    if (!selectedArticle) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: selectedArticle,
          style: selectedStyle,
          duration: selectedDuration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video prompt");
      }

      setSuccess(
        `✅ Video prompt generated! ${data.note || ""}`
      );
      setCurrentGeneration(data.videoGeneration);
      setShowPromptDialog(true);

      // Refresh video list
      await mutateVideos();

      // Reset selection
      setSelectedArticle(null);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate video prompt");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyVisual = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedVisual(true);
      setTimeout(() => setCopiedVisual(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyNarration = async (script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setCopiedNarration(true);
      setTimeout(() => setCopiedNarration(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleGenerateActualVideo = async (videoGenId: number) => {
    if (!confirm("Generate video with Google Veo? This may take 11 seconds to 6 minutes.")) {
      return;
    }

    setIsGeneratingVideo(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/videos/${videoGenId}/generate-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: selectedResolution,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start video generation");
      }

      setVideoJobId(data.jobId);
      setSuccess(`✅ Video generation started! Job ID: ${data.jobId}`);

      // Start polling for status
      pollVideoStatus(videoGenId);
    } catch (err) {
      console.error("Video generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate video");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const pollVideoStatus = async (videoGenId: number) => {
    const maxAttempts = 120; // Poll for up to 10 minutes (120 * 5s)
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/videos/${videoGenId}/status`);
        const data = await response.json();

        if (data.status === "completed") {
          setSuccess(`🎉 Video ready! ${data.videoUrl}`);
          await mutateVideos(); // Refresh the list
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setError("Video generation failed");
          clearInterval(pollInterval);
        } else if (attempts >= maxAttempts) {
          setError("Video generation timed out");
          clearInterval(pollInterval);
        }

        attempts++;
      } catch (err) {
        console.error("Error polling status:", err);
      }
    };

    const pollInterval = setInterval(poll, 5000); // Poll every 5 seconds
    poll(); // Initial poll
  };

  if (articlesLoading) {
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
                Video Content Generator
              </h1>
              <p className="text-gray-400">
                Generate AI video prompts for Google Veo from your newsletter articles
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
            className="mb-6 p-4 rounded-lg bg-red-950/30 border border-red-700 text-red-300 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-950/30 border border-green-700 text-green-300 flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">{success}</p>
            </div>
          </motion.div>
        )}

        {/* Generate New Video Section */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="h-6 w-6 text-blue-500" />
              Generate New Video
            </CardTitle>
            <CardDescription className="text-gray-400">
              Select an article and customize the video settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Select Article
              </label>
              <Select
                value={selectedArticle?.toString()}
                onValueChange={(value) => setSelectedArticle(parseInt(value))}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                  <SelectValue placeholder="Choose an article..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {articlesData?.items?.map((article) => (
                    <SelectItem
                      key={article.id}
                      value={article.id.toString()}
                      className="text-gray-200"
                    >
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Video Style
                </label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="tech-news" className="text-gray-200">
                      📰 Tech News
                    </SelectItem>
                    <SelectItem value="tutorial" className="text-gray-200">
                      📚 Tutorial
                    </SelectItem>
                    <SelectItem value="promotional" className="text-gray-200">
                      📣 Promotional
                    </SelectItem>
                    <SelectItem value="explainer" className="text-gray-200">
                      💡 Explainer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Duration (seconds)
                </label>
                <Select
                  value={selectedDuration.toString()}
                  onValueChange={(value) => setSelectedDuration(parseInt(value))}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="4" className="text-gray-200">
                      4 seconds
                    </SelectItem>
                    <SelectItem value="6" className="text-gray-200">
                      6 seconds
                    </SelectItem>
                    <SelectItem value="8" className="text-gray-200">
                      8 seconds
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  Resolution
                </label>
                <Select
                  value={selectedResolution}
                  onValueChange={setSelectedResolution}
                  disabled={selectedDuration !== 8 && selectedResolution === "1080p"}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="720p" className="text-gray-200">
                      720p (HD)
                    </SelectItem>
                    <SelectItem
                      value="1080p"
                      className="text-gray-200"
                      disabled={selectedDuration !== 8}
                    >
                      1080p (Full HD){selectedDuration !== 8 ? " - 8s only" : ""}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedResolution === "1080p" && selectedDuration !== 8 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    1080p only available for 8-second videos
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={handleGenerateVideo}
              disabled={!selectedArticle || isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video Prompt...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video Prompt
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Videos List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Generated Video Prompts
          </h2>
          {videosData?.videos && videosData.videos.length > 0 ? (
            <div className="grid gap-4">
              {videosData.videos.map((video) => (
                <Card
                  key={video.id}
                  className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">
                          {video.article.title}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Style: {video.style} • Duration: {video.duration}s •{" "}
                          {new Date(video.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentGeneration(video);
                          setShowPromptDialog(true);
                        }}
                        size="sm"
                        variant="outline"
                        className="bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800"
                      >
                        View Prompts
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12 text-center">
                <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No video prompts generated yet</p>
                <p className="text-sm text-gray-500">
                  Select an article above to generate your first video prompt
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prompt Dialog */}
        <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Video Prompts</DialogTitle>
              <DialogDescription className="text-gray-400">
                {currentGeneration?.article.title}
              </DialogDescription>
            </DialogHeader>

            {currentGeneration && (
              <div className="space-y-6 py-4">
                {/* Visual Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      🎬 Visual Prompt (for Google Veo)
                    </h3>
                    <Button
                      onClick={() => handleCopyVisual(currentGeneration.visualPrompt)}
                      size="sm"
                      variant="outline"
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    >
                      {copiedVisual ? (
                        <>✓ Copied!</>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-200 font-mono">
                      {currentGeneration.visualPrompt}
                    </pre>
                  </div>
                </div>

                {/* Narration Script */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      🎙️ Narration Script
                    </h3>
                    <Button
                      onClick={() => handleCopyNarration(currentGeneration.narrationScript)}
                      size="sm"
                      variant="outline"
                      className="bg-gray-800 border-gray-700 text-gray-200"
                    >
                      {copiedNarration ? (
                        <>✓ Copied!</>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-200">
                      {currentGeneration.narrationScript}
                    </pre>
                  </div>
                </div>

                {/* Generate Video Button */}
                <div className="p-6 bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-2 border-blue-600 rounded-lg">
                  <h4 className="text-blue-200 font-semibold mb-3 flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Generate Video with Google Veo
                  </h4>
                  <p className="text-sm text-blue-100 mb-4">
                    Click below to automatically generate a video using Google Veo 3.1.
                    Takes 11 seconds to 6 minutes.
                  </p>
                  <Button
                    onClick={() => currentGeneration && handleGenerateActualVideo(currentGeneration.id)}
                    disabled={isGeneratingVideo}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-5 w-5" />
                        Generate Video Now
                      </>
                    )}
                  </Button>
                  {videoJobId && (
                    <p className="text-xs text-green-300 mt-2 text-center">
                      ✓ Job started: {videoJobId}
                    </p>
                  )}
                </div>

                {/* Instructions */}
                <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                  <h4 className="text-gray-200 font-semibold mb-2">
                    📋 Alternative: Manual Upload
                  </h4>
                  <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Copy the Visual Prompt above</li>
                    <li>Go to Google AI Studio manually</li>
                    <li>Paste the prompt to generate your video</li>
                    <li>Use the Narration Script for voiceover or captions</li>
                    <li>Download and use for newsletter outreach!</li>
                  </ol>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
