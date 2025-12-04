import OpenAI from "openai";
import { chatWithModelFallback } from "../utils/ai-fallback";
import FormData from "form-data";

/**
 * AI Video Generator Service
 * Generates talking head videos for TikTok
 *
 * Tech Stack:
 * 1. OpenAI - Script generation (GPT-4)
 * 2. ElevenLabs - Voice synthesis (TTS)
 * 3. HuggingFace/Replicate - Video generation (talking head)
 */

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type AIModel = "sadtalker" | "wav2lip" | "musetalk" | "linly" | "ffmpeg";

interface VideoGenerationOptions {
  articles: Array<{
    title: string;
    summary: string;
    source?: string;
    link?: string;
  }>;
  presenterImage?: string; // URL or base64 of presenter image
  voice?: "male" | "female";
  duration?: number; // seconds per article
  testMode?: boolean; // Skip ElevenLabs, use free browser TTS
  maxAudioDuration?: number; // Limit audio length (e.g., 5 seconds for testing)
  aiModel?: AIModel; // Which AI model to use for video generation
}

interface VideoSegment {
  text: string;
  audioBuffer?: Buffer;
  duration: number;
}

export class AIVideoGenerator {
  /**
   * Generate a TikTok-style news presenter video
   * Uses OpenAI for script + ElevenLabs for voice + HuggingFace for video
   */
  async generatePresenterVideo(
    options: VideoGenerationOptions
  ): Promise<Buffer> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    console.log(
      `🎬 Starting AI video generation... ${options.testMode ? "[TEST MODE]" : ""}`
    );

    // Step 1: Generate script from articles using OpenAI
    let script = await this.generateScript(options.articles);
    console.log("📝 Script generated:", script.substring(0, 100) + "...");

    // If maxAudioDuration is set, truncate script to approximate that duration
    // Rough estimate: 150 words per minute = 2.5 words per second
    if (options.maxAudioDuration) {
      const maxWords = Math.ceil(options.maxAudioDuration * 2.5);
      const words = script.split(/\s+/);
      if (words.length > maxWords) {
        script = words.slice(0, maxWords).join(" ") + "...";
        console.log(
          `✂️ Script truncated to ~${options.maxAudioDuration} seconds (${maxWords} words)`
        );
      }
    }

    // Step 2: Generate speech audio using ElevenLabs TTS or fallback
    const audioBuffer = await this.generateSpeech(
      script,
      options.voice,
      options.testMode
    );
    console.log("🎤 Audio generated:", audioBuffer.length, "bytes");

    // Step 3: Generate video with talking head
    const videoBuffer = await this.generateTalkingHead(
      audioBuffer,
      options.presenterImage,
      options.aiModel
    );
    console.log("🎥 Video generated:", videoBuffer.length, "bytes");

    return videoBuffer;
  }

  /**
   * Generate TikTok-optimized script from articles using OpenAI
   * Quick, punchy, casual style
   */
  private async generateScript(
    articles: Array<{
      title: string;
      summary: string;
      source?: string;
    }>
  ): Promise<string> {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }

    const articlesText = articles
      .map((a, i) => `${i + 1}. ${a.title}\n${a.summary}`)
      .join("\n\n");

    const prompt = `You are a tech news presenter for TikTok. Write a 60-90 second video script covering these top stories.

Articles:
${articlesText}

Script requirements:
- Start with a punchy hook (e.g., "This week in tech was WILD")
- Cover ${articles.length} stories (20-25 seconds each)
- Use casual, energetic language - talk like a friend
- Include specific numbers, company names, facts
- End with CTA: "Subscribe at techupkeep.dev for more"
- Write as SPOKEN WORDS, not formal text
- NO stage directions, NO formatting, just what to say out loud
- Keep it under 300 words total

Example style:
"What's up tech fam! This week Wispr Flow just hit 50% monthly growth with their voice AI tech. Meta dropped Llama 3 and it's crushing GPT-4 on coding benchmarks. And environment variables? Still a legacy mess, let's fix that. Hit subscribe at techupkeep.dev - see you Friday!"

Write the script now (just the spoken words):`;

    console.log("🤖 Generating script with OpenAI...");

    const { response, modelUsed } = await chatWithModelFallback(openai, {
      messages: [
        {
          role: "system",
          content:
            "You are a TikTok tech news presenter. Write short, punchy, casual scripts.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const script = response.choices[0]?.message?.content?.trim() || "";

    console.log(`📝 Script generated using ${modelUsed}`);

    return script;
  }

  /**
   * Generate speech audio from text using ElevenLabs TTS
   * Professional, natural-sounding voices
   *
   * @param testMode - If true, uses free fallback TTS instead of ElevenLabs
   */
  private async generateSpeech(
    text: string,
    voice: "male" | "female" = "female",
    testMode: boolean = false
  ): Promise<Buffer> {
    // Test mode: Use free alternatives
    if (testMode) {
      console.log("🆓 Using FREE TTS (test mode - no ElevenLabs charges)");
      return await this.generateSpeechFallback(text, voice);
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenLabsApiKey) {
      console.warn(
        "⚠️ ElevenLabs API key not configured. Falling back to free TTS."
      );
      return await this.generateSpeechFallback(text, voice);
    }

    console.log("🎙️ Generating speech with ElevenLabs...");

    // ElevenLabs voice IDs
    // Female: Rachel (clear, professional), Bella (young, energetic)
    // Male: Adam (deep, confident), Antoni (friendly, warm)
    const voiceId =
      voice === "female"
        ? "21m00Tcm4TlvDq8ikWAM" // Rachel - clear, professional
        : "ErXwobaYiN019PkySvjV"; // Antoni - friendly, warm

    // Alternative voices:
    // Female energetic: "EXAVITQu4vr4xnSDxMaL" (Bella)
    // Male deep: "pNInz6obpgDQGcFmaJgB" (Adam)

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1", // Fast, high-quality
            voice_settings: {
              stability: 0.5, // More natural variation
              similarity_boost: 0.75, // Keep voice characteristics
              style: 0.5, // Moderate style
              use_speaker_boost: true, // Enhanced clarity
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ElevenLabs API error: ${response.status} - ${errorText}`
        );
      }

      const audioArrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(audioArrayBuffer);

      console.log(
        `🎤 Audio generated: ${audioBuffer.length} bytes, voice: ${voice}`
      );

      return audioBuffer;
    } catch (error) {
      console.error("ElevenLabs TTS generation failed:", error);
      throw new Error(
        `Failed to generate speech audio: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Fallback TTS using free alternatives (Google TTS or similar)
   * Used when ElevenLabs is not available or in test mode
   */
  private async generateSpeechFallback(
    text: string,
    voice: "male" | "female" = "female"
  ): Promise<Buffer> {
    console.log("🆓 Using fallback TTS (free, unlimited)...");

    try {
      // Use open-source TTS API
      // Using StreamElements TTS (free, unlimited)
      const response = await fetch("https://api.streamelements.com/kappa/v2/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voice: voice === "female" ? "Joanna" : "Matthew", // Amazon Polly voices
          text: text.substring(0, 500), // Limit for free tier
        }),
      });

      if (response.ok) {
        const audioArrayBuffer = await response.arrayBuffer();
        return Buffer.from(audioArrayBuffer);
      }

      // Option 3: Last resort - generate silence (for testing video generation only)
      console.warn("⚠️ All TTS options failed. Generating silent audio for testing.");
      return await this.generateSilentAudio(10); // 10 seconds of silence
    } catch (error) {
      console.error("Fallback TTS failed:", error);
      // Return silent audio for testing
      return await this.generateSilentAudio(10);
    }
  }

  /**
   * Generate silent audio for testing (WAV format)
   * Used when no TTS is available
   */
  private async generateSilentAudio(durationSeconds: number): Promise<Buffer> {
    console.log(`🔇 Generating ${durationSeconds}s of silent audio for testing`);

    const sampleRate = 44100;
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * numChannels * (bitsPerSample / 8);

    // Create WAV header
    const header = Buffer.alloc(44);

    // "RIFF" chunk descriptor
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4); // File size - 8
    header.write("WAVE", 8);

    // "fmt " sub-chunk
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // Subchunk size
    header.writeUInt16LE(1, 20); // Audio format (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // Byte rate
    header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
    header.writeUInt16LE(bitsPerSample, 34);

    // "data" sub-chunk
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);

    // Silent audio data (all zeros)
    const audioData = Buffer.alloc(dataSize);

    return Buffer.concat([header, audioData]);
  }

  /**
   * Generate video using specified AI model or fallback chain
   */
  private async generateTalkingHead(
    audioBuffer: Buffer,
    presenterImage?: string,
    aiModel?: AIModel
  ): Promise<Buffer> {
    console.log("🎭 Generating video...");

    // Default presenter image (can be customized)
    const defaultPresenter = this.getDefaultPresenterImage();
    const imageToUse = presenterImage || defaultPresenter;

    // If specific model requested, try only that model
    if (aiModel) {
      console.log(`🎯 Using ${aiModel.toUpperCase()} (user selected)`);
      switch (aiModel) {
        case "sadtalker":
          return await this.generateWithSadTalker(audioBuffer, imageToUse);
        case "wav2lip":
          return await this.generateWithWav2Lip(audioBuffer, imageToUse);
        case "musetalk":
          return await this.generateWithMuseTalk(audioBuffer, imageToUse);
        case "linly":
          return await this.generateWithLinly(audioBuffer, imageToUse);
        case "ffmpeg":
          return await this.generateVideoWithFFmpeg(audioBuffer, imageToUse);
      }
    }

    // Default: try models in order of quality/speed
    // SadTalker first (free HF Space via Gradio)
    const models: AIModel[] = ["sadtalker", "wav2lip", "musetalk", "linly", "ffmpeg"];

    for (const model of models) {
      try {
        console.log(`🤖 Attempting ${model.toUpperCase()}...`);

        switch (model) {
          case "sadtalker":
            return await this.generateWithSadTalker(audioBuffer, imageToUse);
          case "wav2lip":
            return await this.generateWithWav2Lip(audioBuffer, imageToUse);
          case "musetalk":
            return await this.generateWithMuseTalk(audioBuffer, imageToUse);
          case "linly":
            return await this.generateWithLinly(audioBuffer, imageToUse);
          case "ffmpeg":
            return await this.generateVideoWithFFmpeg(audioBuffer, imageToUse);
        }
      } catch (error) {
        console.warn(`⚠️ ${model.toUpperCase()} failed:`, error instanceof Error ? error.message : "Unknown error");
        if (model === "ffmpeg") {
          // FFmpeg is last resort, throw if it fails
          throw error;
        }
        console.log(`⏭️ Trying next model...`);
      }
    }

    throw new Error("All video generation models failed");
  }

  /**
   * Generate video using SadTalker on HuggingFace Space (via HTTP API)
   * Best for: FREE, excellent quality, realistic head movements
   * Cost: $0 (uses public HF Space)
   *
   * Note: Uses proper Gradio HTTP API with file upload
   */
  private async generateWithSadTalker(
    audioBuffer: Buffer,
    presenterImage: string
  ): Promise<Buffer> {
    console.log("🎬 Calling SadTalker via Gradio HTTP API (FREE)...");

    const fs = await import("fs");
    const path = await import("path");
    const FormData = (await import("form-data")).default;

    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const audioPath = path.join(tmpDir, `audio_${timestamp}.wav`);
    const imagePath = path.join(tmpDir, `image_${timestamp}.jpg`);

    try {
      // Save audio to temp file
      fs.writeFileSync(audioPath, audioBuffer);
      console.log("📁 Audio saved to:", audioPath);

      // Download presenter image
      console.log("📥 Downloading presenter image...");
      const imageResponse = await fetch(presenterImage);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      console.log("📁 Image saved to:", imagePath);

      const baseUrl = "https://vinthony-sadtalker.hf.space";

      // Step 1: Upload image file
      console.log("📤 Uploading image file...");
      const imageFormData = new FormData();
      imageFormData.append("files", fs.createReadStream(imagePath), {
        filename: "image.jpg",
        contentType: "image/jpeg",
      });

      const imageUploadResponse = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        body: imageFormData as any,
        headers: imageFormData.getHeaders() as any,
      });

      if (!imageUploadResponse.ok) {
        throw new Error(`Image upload failed: ${imageUploadResponse.status}`);
      }

      const imageUploadResult = await imageUploadResponse.json();
      const imageTempPath = imageUploadResult[0]; // Server path
      console.log("✅ Image uploaded:", imageTempPath);

      // Step 2: Upload audio file
      console.log("📤 Uploading audio file...");
      const audioFormData = new FormData();
      audioFormData.append("files", fs.createReadStream(audioPath), {
        filename: "audio.wav",
        contentType: "audio/wav",
      });

      const audioUploadResponse = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        body: audioFormData as any,
        headers: audioFormData.getHeaders() as any,
      });

      if (!audioUploadResponse.ok) {
        throw new Error(`Audio upload failed: ${audioUploadResponse.status}`);
      }

      const audioUploadResult = await audioUploadResponse.json();
      const audioTempPath = audioUploadResult[0]; // Server path
      console.log("✅ Audio uploaded:", audioTempPath);

      // Step 3: Call prediction API with uploaded file paths
      console.log("📤 Calling SadTalker prediction API...");

      const callResponse = await fetch(`${baseUrl}/call/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            { path: imageTempPath },  // source_image
            { path: audioTempPath },  // driven_audio
            "crop",         // preprocess
            false,          // Still Mode
            false,          // GFPGAN enhancer
            1,              // batch size
            "256",          // resolution
            0,              // pose style
            "facevid2vid",  // facerender
            1.0,            // expression scale
            false,          // use ref video
            null,           // ref video
            "pose",         // ref info
            false,          // idle mode
            0,              // length
            true,           // eye blink
          ]
        }),
      });

      if (!callResponse.ok) {
        throw new Error(`Prediction call failed: ${callResponse.status}`);
      }

      const callResult = await callResponse.json();
      const eventId = callResult.event_id;
      console.log(`📡 Polling for result (event: ${eventId})...`);

      // Step 4: Poll for result using server-sent events
      let videoUrl = null;
      const pollResponse = await fetch(`${baseUrl}/call/predict/${eventId}`);

      if (!pollResponse.body) {
        throw new Error("No response body from polling");
      }

      const reader = pollResponse.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("📦 Event data:", JSON.stringify(data).substring(0, 150));

              if (data.msg === "process_completed" && data.output) {
                const outputData = data.output.data;
                if (Array.isArray(outputData) && outputData.length > 0) {
                  const videoData = outputData[0];
                  if (videoData?.url) {
                    videoUrl = videoData.url;
                  } else if (videoData?.path) {
                    videoUrl = `${baseUrl}/file=${videoData.path}`;
                  } else if (typeof videoData === 'string') {
                    videoUrl = videoData;
                  }
                  break;
                }
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }

        if (videoUrl) break;
      }

      if (!videoUrl) {
        throw new Error("SadTalker did not return video URL");
      }

      console.log(`📥 Downloading video from: ${videoUrl}`);

      // Step 5: Download video
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`);
      }

      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

      // Clean up temp files
      fs.unlinkSync(audioPath);
      fs.unlinkSync(imagePath);

      console.log(`✅ SadTalker video generated: ${videoBuffer.length} bytes`);
      return videoBuffer;

    } catch (error) {
      // Clean up on error
      [audioPath, imagePath].forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });

      console.error("SadTalker generation failed:", error);
      throw new Error(
        `SadTalker video generation failed: ${error instanceof Error ? error.message : "Unknown error"}. Falling back to next model...`
      );
    }
  }

  /**
   * Generate video using Wav2Lip on HuggingFace Space
   * Best for: Fast, accurate lip-sync
   */
  private async generateWithWav2Lip(
    audioBuffer: Buffer,
    presenterImage: string
  ): Promise<Buffer> {
    console.log("🎬 Calling Wav2Lip API...");

    const fs = await import("fs");
    const path = await import("path");

    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const audioPath = path.join(tmpDir, `audio_${timestamp}.wav`);
    const imagePath = path.join(tmpDir, `image_${timestamp}.jpg`);

    try {
      fs.writeFileSync(audioPath, audioBuffer);

      const imageResponse = await fetch(presenterImage);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));

      // Convert to base64 for Gradio API
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");
      const audioBase64 = fs.readFileSync(audioPath).toString("base64");

      // Gradio file format with base64 data
      const imageFile = {
        name: path.basename(imagePath),
        data: `data:image/jpeg;base64,${imageBase64}`
      };

      const audioFile = {
        name: path.basename(audioPath),
        data: `data:audio/wav;base64,${audioBase64}`
      };

      console.log("📤 Sending request to Wav2Lip (base64 encoded)...");

      const response = await fetch("https://manavisrani07-gradio-lipsync-wav2lip.hf.space/call/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [imageFile, audioFile]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Wav2Lip API error response:", errorText);
        throw new Error(`Wav2Lip API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Wav2Lip response:", JSON.stringify(result).substring(0, 200));

      if (!result.event_id) {
        throw new Error("Wav2Lip did not return event_id");
      }

      const eventId = result.event_id;

      // Poll for result with streaming response
      console.log(`📡 Polling for Wav2Lip result (event: ${eventId})...`);
      const resultResponse = await fetch(`https://manavisrani07-gradio-lipsync-wav2lip.hf.space/call/generate/${eventId}`);
      const reader = resultResponse.body?.getReader();
      if (!reader) throw new Error("No response body");

      let videoUrl = null;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("Wav2Lip streaming data:", JSON.stringify(data).substring(0, 200));

              // Check for video URL in different possible formats
              if (Array.isArray(data) && data.length > 0) {
                if (data[0]?.url) {
                  videoUrl = data[0].url;
                } else if (data[0]?.name) {
                  // File reference format
                  videoUrl = `https://manavisrani07-gradio-lipsync-wav2lip.hf.space/file=${data[0].name}`;
                } else if (typeof data[0] === 'string' && data[0].startsWith('http')) {
                  videoUrl = data[0];
                }
              }
            } catch (e) {
              // Ignore JSON parse errors
              console.warn("Failed to parse streaming data:", e);
            }
          }
        }
      }

      if (!videoUrl) throw new Error("Wav2Lip did not return video URL");

      console.log(`📥 Downloading video from: ${videoUrl}`);
      const videoResponse = await fetch(videoUrl);
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

      fs.unlinkSync(audioPath);
      fs.unlinkSync(imagePath);

      console.log(`✅ Wav2Lip video generated: ${videoBuffer.length} bytes`);
      return videoBuffer;

    } catch (error) {
      [audioPath, imagePath].forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      throw error;
    }
  }

  /**
   * Generate video using MuseTalk on HuggingFace Space
   * Best for: Highest quality, real-time performance
   */
  private async generateWithMuseTalk(
    audioBuffer: Buffer,
    presenterImage: string
  ): Promise<Buffer> {
    console.log("🎬 Calling MuseTalk API...");

    const fs = await import("fs");
    const path = await import("path");

    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const audioPath = path.join(tmpDir, `audio_${timestamp}.wav`);
    const imagePath = path.join(tmpDir, `image_${timestamp}.jpg`);

    try {
      fs.writeFileSync(audioPath, audioBuffer);

      const imageResponse = await fetch(presenterImage);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));

      const imageData = `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString("base64")}`;
      const audioData = {
        name: path.basename(audioPath),
        data: `data:audio/wav;base64,${fs.readFileSync(audioPath).toString("base64")}`
      };

      console.log("📤 Sending request to MuseTalk...");

      const response = await fetch("https://tmelyralab-musetalk.hf.space/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [audioData, imageData]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503) {
          throw new Error(`MuseTalk Space is currently unavailable (503 Service Unavailable). The HuggingFace Space may be overloaded or down. Try using 'Auto' mode to automatically fall back to other models, or select 'FFmpeg' for a reliable static video.`);
        }
        console.error("MuseTalk API error response:", errorText);
        throw new Error(`MuseTalk API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.data || !result.data[0]) {
        throw new Error("MuseTalk did not return video data");
      }

      let videoUrl = result.data[0];
      if (typeof videoUrl === 'object' && videoUrl.name) {
        videoUrl = `https://tmelyralab-musetalk.hf.space/file=${videoUrl.name}`;
      }

      const videoResponse = await fetch(videoUrl);
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

      fs.unlinkSync(audioPath);
      fs.unlinkSync(imagePath);

      console.log(`✅ MuseTalk video generated: ${videoBuffer.length} bytes`);
      return videoBuffer;

    } catch (error) {
      [audioPath, imagePath].forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      throw error;
    }
  }

  /**
   * Generate video using Linly-Talker on HuggingFace Space
   * Best for: Multi-model support (can use Wav2Lip, SadTalker, MuseTalk)
   */
  private async generateWithLinly(
    audioBuffer: Buffer,
    presenterImage: string
  ): Promise<Buffer> {
    console.log("🎬 Calling Linly-Talker API...");

    const fs = await import("fs");
    const path = await import("path");

    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const audioPath = path.join(tmpDir, `audio_${timestamp}.wav`);
    const imagePath = path.join(tmpDir, `image_${timestamp}.jpg`);

    try {
      fs.writeFileSync(audioPath, audioBuffer);

      const imageResponse = await fetch(presenterImage);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));

      const imageData = `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString("base64")}`;
      const audioData = {
        name: path.basename(audioPath),
        data: `data:audio/wav;base64,${fs.readFileSync(audioPath).toString("base64")}`
      };

      console.log("📤 Sending request to Linly-Talker...");

      const response = await fetch("https://thepianist9-linly.hf.space/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [imageData, audioData, "MuseTalk"] // Use MuseTalk model in Linly
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503) {
          throw new Error(`Linly-Talker Space is currently unavailable (503 Service Unavailable). The HuggingFace Space may be overloaded or down. Try using 'Auto' mode to automatically fall back to other models, or select 'FFmpeg' for a reliable static video.`);
        }
        console.error("Linly-Talker API error response:", errorText);
        throw new Error(`Linly-Talker API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (!result.data || !result.data[0]) {
        throw new Error("Linly-Talker did not return video data");
      }

      let videoUrl = result.data[0];
      if (typeof videoUrl === 'object' && videoUrl.name) {
        videoUrl = `https://thepianist9-linly.hf.space/file=${videoUrl.name}`;
      }

      const videoResponse = await fetch(videoUrl);
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

      fs.unlinkSync(audioPath);
      fs.unlinkSync(imagePath);

      console.log(`✅ Linly-Talker video generated: ${videoBuffer.length} bytes`);
      return videoBuffer;

    } catch (error) {
      [audioPath, imagePath].forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      throw error;
    }
  }

  /**
   * Generate a video using FFmpeg (static image + audio)
   * Free and reliable, works locally without API calls
   */
  private async generateVideoWithFFmpeg(
    audioBuffer: Buffer,
    presenterImage: string
  ): Promise<Buffer> {
    console.log("🎬 Generating video with FFmpeg (static image + audio)");

    const fs = await import("fs");
    const path = await import("path");
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Create temp directory
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const timestamp = Date.now();
    const audioPath = path.join(tmpDir, `audio_${timestamp}.mp3`);
    const imagePath = path.join(tmpDir, `image_${timestamp}.jpg`);
    const videoPath = path.join(tmpDir, `video_${timestamp}.mp4`);

    try {
      // Save audio to temp file
      fs.writeFileSync(audioPath, audioBuffer);
      console.log("📁 Audio saved to:", audioPath);

      // Download presenter image
      console.log("📥 Downloading presenter image...");
      const imageResponse = await fetch(presenterImage);
      const imageBuffer = await imageResponse.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      console.log("📁 Image saved to:", imagePath);

      // Use FFmpeg to create video
      console.log("🎥 Creating video with FFmpeg...");

      // FFmpeg command: create video from static image with audio
      // -loop 1: loop the image
      // -i image.jpg: input image
      // -i audio.mp3: input audio
      // -vf "scale=..." : scale/pad to ensure dimensions divisible by 2
      // -c:v libx264: video codec
      // -tune stillimage: optimize for static image
      // -c:a aac: audio codec
      // -b:a 192k: audio bitrate
      // -pix_fmt yuv420p: pixel format (for compatibility)
      // -shortest: end when audio ends

      // Scale filter: ensures width and height are divisible by 2
      // 'scale=trunc(iw/2)*2:trunc(ih/2)*2' rounds down to nearest even number
      const ffmpegCommand = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -t 60 "${videoPath}"`;

      console.log("Running:", ffmpegCommand);
      await execAsync(ffmpegCommand);

      // Read the generated video
      const videoBuffer = fs.readFileSync(videoPath);
      console.log(`✅ Video generated: ${videoBuffer.length} bytes`);

      // Clean up temp files
      fs.unlinkSync(audioPath);
      fs.unlinkSync(imagePath);
      fs.unlinkSync(videoPath);

      return videoBuffer;
    } catch (error) {
      // Clean up on error
      [audioPath, imagePath, videoPath].forEach((file) => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });

      console.error("FFmpeg video generation failed:", error);
      throw new Error(
        `FFmpeg video generation failed. ` +
        `Make sure FFmpeg is installed (brew install ffmpeg on Mac). ` +
        `Error: ${error instanceof Error ? error.message : "Unknown error"}. ` +
        `Alternative: Set REPLICATE_API_KEY and use ?replicate=true for AI talking head videos.`
      );
    }
  }

  /**
   * Alternative: Generate video using Replicate API
   * More reliable for production use
   */
  async generateWithReplicate(
    options: VideoGenerationOptions
  ): Promise<Buffer> {
    // Replicate has better video generation models
    // Including DID, HeyGen-style models

    const script = await this.generateScript(options.articles);

    // Use Replicate's API
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "a5b2b3e7d9e8f7a6c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1",
        input: {
          script: script,
          voice: options.voice || "female",
          avatar: "professional_female_1",
        },
      }),
    });

    const prediction = await response.json();

    // Poll for completion
    let videoUrl = null;
    while (!videoUrl) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
          },
        }
      );

      const status = await statusResponse.json();

      if (status.status === "succeeded") {
        videoUrl = status.output;
        break;
      } else if (status.status === "failed") {
        throw new Error("Video generation failed");
      }
    }

    // Download video
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();
    return Buffer.from(videoBuffer);
  }

  /**
   * Get default presenter image (professional tech presenter)
   */
  private getDefaultPresenterImage(): string {
    // Base64 encoded default avatar or URL
    // Could be a stock photo or AI-generated professional headshot
    return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=512"; // Professional woman
  }

  /**
   * Generate short-form video with text overlays (simpler approach)
   * Uses image generation + text animation
   */
  async generateTextOverlayVideo(
    articles: Array<{
      title: string;
      summary: string;
    }>
  ): Promise<Buffer> {
    console.log("🎬 Generating text overlay video (simpler approach)...");

    // This approach uses FFmpeg to create a video from images + audio
    // More reliable than full video generation

    // 1. Generate images for each slide (already have this)
    // 2. Generate TTS audio
    // 3. Combine with FFmpeg

    // For now, return a placeholder
    // Full implementation would use fluent-ffmpeg

    throw new Error(
      "Text overlay video generation requires FFmpeg - implement in next iteration"
    );
  }
}
