import { getGooglePlacesApiKey } from "@/lib/google/places-api-key";

type TranslateResponse = {
  data?: {
    translations?: Array<{ translatedText?: string }>;
  };
  error?: { message?: string };
};

export async function translateGoogleText(
  text: string,
  target: "en" | "et",
  source?: "en" | "et",
): Promise<string | null> {
  const apiKey = getGooglePlacesApiKey();
  const normalized = text.trim();

  if (!apiKey || !normalized) {
    return null;
  }

  const params = new URLSearchParams({
    q: normalized,
    target,
    format: "text",
  });

  if (source) {
    params.set("source", source);
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Api-Key": apiKey,
        },
        next: { revalidate: 86_400 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as TranslateResponse;
    const translated = payload.data?.translations?.[0]?.translatedText?.trim();

    return translated || null;
  } catch {
    return null;
  }
}

export function isEstonianLanguageCode(languageCode?: string) {
  return languageCode?.toLowerCase().startsWith("et") ?? false;
}

export function isEnglishLanguageCode(languageCode?: string) {
  return languageCode?.toLowerCase().startsWith("en") ?? false;
}
