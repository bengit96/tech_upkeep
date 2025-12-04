/**
 * Test script for TikTok slide generation
 *
 * This script tests the slide generation functionality by creating
 * slides for a sample blog post and saving them to disk.
 */

import { generateSlidesFromBlogPost, saveSlidesToDisk, BlogPostData } from '../lib/services/slide-generator';
import path from 'path';

async function testSlideGeneration() {
  console.log('🎨 Testing TikTok Slide Generation...\n');

  // Sample blog post data with 5 key points
  const sampleBlogPost: BlogPostData = {
    title: 'Best Tech Newsletters for Junior Developers',
    description: 'Curated list of must-read newsletters to accelerate your career',
    keyPoints: [
      'Stay updated with industry trends and best practices daily',
      'Learn from senior developers and tech leaders worldwide',
      'Discover new tools, libraries, and frameworks as they emerge',
      'Get career advice and growth opportunities from experts',
      'Build your professional network through curated content',
    ],
    category: 'Career Growth',
    readTime: '8 min read',
  };

  try {
    console.log('📝 Generating slides for:', sampleBlogPost.title);
    console.log('   Key points:', sampleBlogPost.keyPoints.length);
    console.log('');

    // Generate slides
    const startTime = Date.now();
    const slides = await generateSlidesFromBlogPost(sampleBlogPost, {
      brandName: 'Tech Upkeep',
      website: 'techupkeep.dev',
      includeIntro: true,
      includeOutro: true,
      format: 'png',
    });
    const duration = Date.now() - startTime;

    console.log(`✅ Generated ${slides.length} slides in ${duration}ms\n`);

    // Save slides to disk
    const outputDir = path.join(process.cwd(), 'test-output', 'slides');
    console.log('💾 Saving slides to:', outputDir);

    const filePaths = await saveSlidesToDisk(slides, outputDir);

    console.log('\n✨ Slides saved successfully:');
    filePaths.forEach((filepath, index) => {
      console.log(`   ${index + 1}. ${path.basename(filepath)}`);
    });

    console.log('\n🎉 Test completed successfully!');
    console.log(`\n📂 View your slides at: ${outputDir}`);
  } catch (error: any) {
    console.error('\n❌ Error generating slides:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testSlideGeneration();
