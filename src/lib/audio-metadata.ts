export interface ID3Result {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  label?: string;
  coverArtBlob?: Blob;
}

/**
 * Extract ID3 tags from an audio file using jsmediatags.
 * Dynamically imported to avoid SSR bundling react-native-fs.
 * Gracefully returns empty object if extraction fails (e.g. WAV files).
 */
export async function extractID3Tags(file: File): Promise<ID3Result> {
  const jsmediatags = (await import("jsmediatags")).default;
  return new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess(data) {
        const tags = data.tags;
        const result: ID3Result = {};

        if (tags.title) result.title = tags.title.trim();
        if (tags.artist) result.artist = tags.artist.trim();
        if (tags.album) result.album = tags.album.trim();
        if (tags.genre) result.genre = tags.genre.trim();

        if (tags.year) {
          const parsed = parseInt(tags.year, 10);
          if (!isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
            result.year = parsed;
          }
        }

        if (tags.track) {
          // Track can be "3" or "3/12"
          const trackNum = parseInt(tags.track.split("/")[0], 10);
          if (!isNaN(trackNum) && trackNum > 0) {
            result.trackNumber = trackNum;
          }
        }

        // Publisher/label from TPUB frame
        const tpub = tags.TPUB as { data?: string } | undefined;
        if (tpub?.data) {
          result.label = typeof tpub.data === "string" ? tpub.data.trim() : undefined;
        }

        // Cover art from APIC / picture tag
        if (tags.picture && tags.picture.data && tags.picture.format) {
          const { data, format } = tags.picture;
          const byteArray = new Uint8Array(data);
          result.coverArtBlob = new Blob([byteArray], { type: format });
        }

        resolve(result);
      },
      onError() {
        // Gracefully return empty — file may not have ID3 tags
        resolve({});
      },
    });
  });
}

/**
 * Extract audio duration and bitrate using the Web Audio API.
 * For files >50MB, only estimates bitrate from file size.
 */
export async function extractAudioDuration(
  file: File
): Promise<{ duration: number; bitrate: number } | null> {
  const MAX_DECODE_SIZE = 50 * 1024 * 1024; // 50MB

  if (file.size > MAX_DECODE_SIZE) {
    // Too large to decode in memory — can't extract duration
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = Math.round(audioBuffer.duration);
      const bitrate = duration > 0 ? Math.round((file.size * 8) / duration / 1000) : 0;

      return { duration, bitrate };
    } finally {
      await audioContext.close();
    }
  } catch {
    // Some formats may fail to decode (e.g. FLAC in some browsers)
    return null;
  }
}

/** Map MIME type to audio format string */
export function mimeToFormat(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/mpeg": "MP3",
    "audio/wav": "WAV",
    "audio/x-wav": "WAV",
    "audio/flac": "FLAC",
    "audio/x-flac": "FLAC",
    "audio/ogg": "OGG",
    "audio/aac": "AAC",
    "audio/mp4": "AAC",
    "audio/x-m4a": "AAC",
  };
  return map[mimeType] ?? mimeType.split("/").pop()?.toUpperCase() ?? "MP3";
}
