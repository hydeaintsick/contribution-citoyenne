import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join } from "path";

async function compressScreenshots() {
  const screenshotsDir = join(process.cwd(), "public", "screenshots");
  const files = await readdir(screenshotsDir);
  const pngFiles = files.filter((f) => f.endsWith(".png"));

  console.log(`Found ${pngFiles.length} PNG files to compress`);

  for (const file of pngFiles) {
    const inputPath = join(screenshotsDir, file);
    const outputPath = join(screenshotsDir, file.replace(".png", ".webp"));
    const originalStats = await stat(inputPath);
    const originalSizeKB = originalStats.size / 1024;

    console.log(`\nProcessing ${file} (${originalSizeKB.toFixed(1)} KB)...`);

    try {
      await sharp(inputPath)
        .webp({ quality: 85, effort: 6 })
        .toFile(outputPath);

      const compressedStats = await stat(outputPath);
      const compressedSizeKB = compressedStats.size / 1024;
      const reduction = ((1 - compressedStats.size / originalStats.size) * 100).toFixed(1);

      console.log(
        `✓ Created ${file.replace(".png", ".webp")} (${compressedSizeKB.toFixed(1)} KB, ${reduction}% reduction)`
      );

      // Also create optimized PNG version
      const optimizedPngPath = join(screenshotsDir, file.replace(".png", "-optimized.png"));
      await sharp(inputPath)
        .png({ quality: 85, compressionLevel: 9 })
        .toFile(optimizedPngPath);

      const optimizedStats = await stat(optimizedPngPath);
      const optimizedSizeKB = optimizedStats.size / 1024;
      const pngReduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);

      console.log(
        `✓ Created ${file.replace(".png", "-optimized.png")} (${optimizedSizeKB.toFixed(1)} KB, ${pngReduction}% reduction)`
      );
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error);
    }
  }

  console.log("\n✓ Compression complete!");
}

compressScreenshots().catch(console.error);

