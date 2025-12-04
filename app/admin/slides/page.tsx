"use client";

import { useEffect, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Image as ImageIcon,
  Download,
  Sparkles,
  ArrowLeft,
  Plus,
  X,
  Palette,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  readTime: string | null;
}

interface SlideConfig {
  id: string;
  header: string;
  points: string[];
  colorTheme: string;
  imageUrl?: string;
}

interface GeneratedSlides {
  slides: Array<{
    buffer: string; // base64 encoded
    index: number;
    type: string;
  }>;
  count: number;
}

const COLOR_THEMES = [
  { id: "slate", name: "Slate Blue", gradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" },
  { id: "purple", name: "Purple Dream", gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" },
  { id: "blue", name: "Ocean Blue", gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" },
  { id: "green", name: "Forest Green", gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
  { id: "orange", name: "Sunset Orange", gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)" },
  { id: "pink", name: "Hot Pink", gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" },
  { id: "red", name: "Fire Red", gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
];

export default function SlideGeneratorPage() {
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSlides, setGeneratedSlides] = useState<GeneratedSlides | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // New state for slide configuration
  const [slides, setSlides] = useState<SlideConfig[]>([
    {
      id: crypto.randomUUID(),
      header: "",
      points: ["", "", "", "", ""],
      colorTheme: "slate",
    }
  ]);
  const [generatingPointsFor, setGeneratingPointsFor] = useState<string | null>(null);
  const [manualContext, setManualContext] = useState<string>("");

  // Fetch blog posts
  const { data: blogPosts, isLoading: blogPostsLoading } = useSWR<{
    posts: BlogPost[];
  }>("/api/admin/blog-posts", fetcher);

  const selectedBlog = blogPosts?.posts.find(
    (post) => post.id === selectedBlogId
  );

  // Add new slide
  const addSlide = () => {
    setSlides([
      ...slides,
      {
        id: crypto.randomUUID(),
        header: "",
        points: ["", "", "", "", ""],
        colorTheme: COLOR_THEMES[Math.floor(Math.random() * COLOR_THEMES.length)].id,
      }
    ]);
  };

  // Remove slide
  const removeSlide = (id: string) => {
    if (slides.length === 1) return;
    setSlides(slides.filter(s => s.id !== id));
  };

  // Update slide header
  const updateSlideHeader = (id: string, header: string) => {
    setSlides(slides.map(s => s.id === id ? { ...s, header } : s));
  };

  // Update slide point
  const updateSlidePoint = (id: string, pointIndex: number, value: string) => {
    setSlides(slides.map(s => {
      if (s.id === id) {
        const newPoints = [...s.points];
        newPoints[pointIndex] = value;
        return { ...s, points: newPoints };
      }
      return s;
    }));
  };

  // Update slide color
  const updateSlideColor = (id: string, colorTheme: string) => {
    setSlides(slides.map(s => s.id === id ? { ...s, colorTheme } : s));
  };

  // Update slide image
  const updateSlideImage = async (id: string, file: File | null) => {
    if (!file) {
      // Remove image
      setSlides(slides.map(s => s.id === id ? { ...s, imageUrl: undefined } : s));
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSlides(slides.map(s => s.id === id ? { ...s, imageUrl: base64 } : s));
    };
    reader.readAsDataURL(file);
  };

  // Generate points for a slide using AI
  const generatePointsForSlide = async (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide || !slide.header.trim()) {
      setError("Please enter a header first");
      return;
    }

    setGeneratingPointsFor(slideId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/slides/generate-points-from-header", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          header: slide.header,
          blogPostId: selectedBlogId,
          manualContext: manualContext.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate points");
      }

      const data = await response.json();

      // Update slide with generated points
      setSlides(slides.map(s => {
        if (s.id === slideId) {
          return { ...s, points: data.points };
        }
        return s;
      }));

      setSuccessMessage("Points generated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to generate points");
    } finally {
      setGeneratingPointsFor(null);
    }
  };

  // Generate all slides
  const handleGenerateSlides = async () => {
    if (!selectedBlogId) {
      setError("Please select a blog post");
      return;
    }

    // Validate slides
    const validSlides = slides.filter(s =>
      s.header.trim() && s.points.some(p => p.trim())
    );

    if (validSlides.length === 0) {
      setError("Please add at least one slide with a header and points");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/admin/slides/generate-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogPostId: selectedBlogId,
          slides: validSlides,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate slides");
      }

      const data = await response.json();
      setGeneratedSlides(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate slides");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSlides = async () => {
    if (!generatedSlides || !selectedBlog) return;

    for (let i = 0; i < generatedSlides.slides.length; i++) {
      const slide = generatedSlides.slides[i];
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${slide.buffer}`;
      link.download = `${selectedBlog.slug}-slide-${i + 1}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center text-sm text-gray-400 hover:text-gray-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              TikTok Slide Generator
            </h1>
            <p className="mt-2 text-gray-400">
              Create custom slides with AI-generated content
            </p>
            <div className="mt-3 flex gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                Auto: Hook Slide
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
                Auto: CTA Slide
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Blog Post Selection */}
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-50">
                  Select Blog Post
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose a blog post context for better AI generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blogPostsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <Select
                    value={selectedBlogId?.toString()}
                    onValueChange={(value) =>
                      setSelectedBlogId(parseInt(value))
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-50">
                      <SelectValue placeholder="Select a blog post..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {blogPosts?.posts.map((post) => (
                        <SelectItem
                          key={post.id}
                          value={post.id.toString()}
                          className="text-gray-50 focus:bg-gray-700 focus:text-gray-50"
                        >
                          {post.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {selectedBlog && (
                  <div className="mt-4 rounded-lg bg-gray-700/50 p-4">
                    <h3 className="font-semibold text-gray-50">
                      {selectedBlog.title}
                    </h3>
                    {selectedBlog.description && (
                      <p className="mt-2 text-sm text-gray-400">
                        {selectedBlog.description}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Context */}
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-50">
                  Additional Context (Optional)
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Provide extra context to help AI generate better points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={manualContext}
                  onChange={(e) => setManualContext(e.target.value)}
                  placeholder="e.g., This is about building scalable microservices using Kubernetes and Docker. The target audience is senior engineers..."
                  rows={4}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  This context will be used when generating points for all slides
                </p>
              </CardContent>
            </Card>

            {/* Slide Builder */}
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardDescription className="text-gray-400">
                  💡 Tip: Slide 1 (hook) and last slide (CTA) are auto-generated. Create your content slides below.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {slides.map((slide, slideIndex) => (
                <Card key={slide.id} className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-50">
                        Content Slide {slideIndex + 1}
                      </CardTitle>
                      <div className="flex gap-2">
                        {/* Color Theme Selector */}
                        <Select
                          value={slide.colorTheme}
                          onValueChange={(value) => updateSlideColor(slide.id, value)}
                        >
                          <SelectTrigger className="w-[140px] bg-gray-700 border-gray-600 text-gray-50 h-8">
                            <Palette className="w-4 h-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {COLOR_THEMES.map((theme) => (
                              <SelectItem
                                key={theme.id}
                                value={theme.id}
                                className="text-gray-50 focus:bg-gray-700"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ background: theme.gradient }}
                                  />
                                  {theme.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {slides.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSlide(slide.id)}
                            className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Header Input */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Slide Header
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={slide.header}
                          onChange={(e) => updateSlideHeader(slide.id, e.target.value)}
                          placeholder="Enter slide header..."
                          className="flex-1 rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePointsForSlide(slide.id)}
                          disabled={!slide.header.trim() || generatingPointsFor === slide.id}
                          className="border-purple-600 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                        >
                          {generatingPointsFor === slide.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Points */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Key Points (3-5)
                      </label>
                      <div className="space-y-2">
                        {slide.points.map((point, pointIndex) => (
                          <input
                            key={pointIndex}
                            type="text"
                            value={point}
                            onChange={(e) => updateSlidePoint(slide.id, pointIndex, e.target.value)}
                            placeholder={`Point ${pointIndex + 1}...`}
                            className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-50 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">
                        Background Image (Optional)
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-400 hover:border-blue-500 transition">
                              <Upload className="h-4 w-4" />
                              <span>
                                {slide.imageUrl ? "Change image" : "Upload image"}
                              </span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                updateSlideImage(slide.id, file || null);
                              }}
                            />
                          </label>
                          {slide.imageUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateSlideImage(slide.id, null)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {slide.imageUrl && (
                          <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-600">
                            <img
                              src={slide.imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Slide Button */}
              <Button
                onClick={addSlide}
                variant="outline"
                className="w-full border-dashed border-gray-600 bg-gray-800/30 text-gray-300 hover:bg-gray-700/50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Slide
              </Button>
            </div>

            {/* Generate Button */}
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Button
                  onClick={handleGenerateSlides}
                  disabled={!selectedBlogId || isGenerating}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Slides...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate All Slides
                    </>
                  )}
                </Button>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="mt-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
                    {successMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-50 flex items-center justify-between">
                  <span>Generated Slides</span>
                  {generatedSlides && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadSlides}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {generatedSlides
                    ? `${generatedSlides.count} slides generated`
                    : "Slides will appear here after generation"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedSlides ? (
                  <div className="grid gap-4">
                    {generatedSlides.slides.map((slide, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-gray-700/50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">
                            Slide {slide.index + 1}
                          </span>
                        </div>
                        <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-900">
                          <img
                            src={`data:image/png;base64,${slide.buffer}`}
                            alt={`Slide ${slide.index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-16 w-16 text-gray-600 mb-4" />
                    <p className="text-gray-400">No slides generated yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Configure your slides and click Generate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
