import Anthropic from "@anthropic-ai/sdk";

// A cheap, solo-founder-friendly moderation pipeline: a fast local wordlist
// catches obvious profanity without an API round-trip, and Claude Haiku
// catches everything nuanced (harassment, spam, NSFW, hate speech) that a
// wordlist can't. Fails open on the LLM step if ANTHROPIC_API_KEY isn't set
// or the API call errors — the wordlist still runs either way — so a
// misconfigured key never fully blocks posting.

const BLOCKED_SUBSTRINGS = [
  "хуй", "хуе", "хуя", "пизд", "ебат", "ебал", "ебан", "ёбан", "бляд", "сука ",
  "мудак", "долбоеб", "долбоёб", "залуп", "пидор", "пидар", "гандон", "уебок", "уёбок",
  "fuck", "shit", "bitch ", "asshole", "cunt",
];

function hasObviousProfanity(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-zа-яё\s]/gi, "");
  return BLOCKED_SUBSTRINGS.some((word) => normalized.includes(word));
}

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const trimmed = text.trim();
  if (!trimmed) return { allowed: true };

  if (hasObviousProfanity(trimmed)) {
    return { allowed: false, reason: "Текст содержит нецензурную лексику" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { allowed: true };

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 100,
      system:
        "Ты — модератор делового сообщества для предпринимателей и инвесторов (SAPNUM). " +
        "Блокируй только: мат и оскорбления, спам/флуд, откровенный NSFW-контент, разжигание розни, мошенничество, рекламу запрещённых веществ/услуг. " +
        "НЕ блокируй обычные деловые обсуждения, критику, споры, эмоциональные, но приличные высказывания. " +
        'Ответь строго JSON без пояснений: {"allowed": true} или {"allowed": false, "reason": "краткая причина по-русски"}.',
      messages: [{ role: "user", content: trimmed }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return { allowed: true };

    const parsed = JSON.parse(block.text.trim());
    if (parsed.allowed === false) {
      return { allowed: false, reason: parsed.reason ?? "Контент не прошёл модерацию" };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[moderation] text check failed, failing open", err);
    return { allowed: true };
  }
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { allowed: true };

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return { allowed: true };
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return { allowed: true };

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length > 5_000_000) return { allowed: true }; // skip huge files rather than fail the post

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: contentType as "image/jpeg", data: buffer.toString("base64") },
            },
            {
              type: "text",
              text:
                "Это изображение для делового сообщества предпринимателей. Заблокируй только откровенный NSFW/порнографический " +
                "контент, насилие/жестокость или явно незаконный контент. Обычные деловые фото, графики, скриншоты, люди в обычной " +
                'одежде — разрешены. Ответь строго JSON: {"allowed": true} или {"allowed": false, "reason": "краткая причина по-русски"}.',
            },
          ],
        },
      ],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return { allowed: true };

    const parsed = JSON.parse(block.text.trim());
    if (parsed.allowed === false) {
      return { allowed: false, reason: parsed.reason ?? "Изображение не прошло модерацию" };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[moderation] image check failed, failing open", err);
    return { allowed: true };
  }
}
