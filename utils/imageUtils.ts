import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "react-native";

// Matches the "Upgrade for up to 10" ceiling shown in the web app's
// convert modal — keep the mobile cap in sync with that plan limit.
export const MAX_IMAGES_PER_CONVERSION = 10;

const MAX_DIMENSION = 1600;
const COMPRESSION_QUALITY = 0.6;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

/**
 * Compresses and base64-encodes a captured/picked image before it's sent
 * to /transcribe/process-image. Only downscales if the source is actually
 * larger than MAX_DIMENSION — avoids upscaling small images for nothing.
 */
export async function compressAndEncode(uri: string): Promise<string> {
  const actions: ImageManipulator.Action[] = [];

  try {
    const { width } = await getImageSize(uri);
    if (width > MAX_DIMENSION) {
      actions.push({ resize: { width: MAX_DIMENSION } });
    }
  } catch {
    // Couldn't read dimensions (rare) — resize defensively so we never
    // ship a huge payload.
    actions.push({ resize: { width: MAX_DIMENSION } });
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: COMPRESSION_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("Failed to encode image.");
  }

  return `data:image/jpeg;base64,${result.base64}`;
}
