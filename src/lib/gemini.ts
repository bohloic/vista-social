// Gemini AI Engine for Vista Social CM
// Supports Post Caption Generation, Hashtag Suggestions, Inbox Smart Replies, and Review Responses

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

export interface CaptionOptions {
  topic: string;
  tone: 'professional' | 'engaging' | 'humorous' | 'urgent' | 'minimalist' | 'storytelling';
  platforms: string[];
  includeHashtags: boolean;
  includeEmojis: boolean;
  callToAction?: string;
}

export async function generateSocialCaption(options: CaptionOptions): Promise<{
  caption: string;
  hashtags: string[];
  platformVariations: Record<string, string>;
}> {
  const prompt = `You are a world-class Social Media Manager and Copywriter.
Create a high-converting, viral social media post about: "${options.topic}".
Tone: ${options.tone}.
Target Networks: ${options.platforms.join(', ')}.
Include Emojis: ${options.includeEmojis ? 'Yes' : 'No'}.
Include Hashtags: ${options.includeHashtags ? 'Yes' : 'No'}.
Call To Action: ${options.callToAction || 'Engage with the audience'}.

Format your response strictly as valid JSON with no markdown wrapping or backticks:
{
  "caption": "The main universal caption text",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "platformVariations": {
    "instagram": "Caption tailored for Instagram with line breaks and emoji style",
    "linkedin": "Professional corporate insight version for LinkedIn",
    "twitter": "Concise punchy hook under 260 characters for X",
    "tiktok": "Casual, trending creator style caption for TikTok"
  }
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText) {
      return JSON.parse(candidateText);
    }
  } catch (err) {
    console.warn('Fallback to local intelligent generator due to:', err);
  }

  // Graceful fallback if offline or API key limit
  const baseCaption = `🚀 ${options.topic}\n\nDécouvrez nos dernières actualités et partagez votre avis en commentaire !`;
  return {
    caption: baseCaption,
    hashtags: ['#socialmedia', '#marketing', '#community', '#innovation', '#growth'],
    platformVariations: {
      instagram: `${baseCaption}\n.\n.\n#insta #growth #community`,
      linkedin: `Chez notre organisation, nous croyons fermement en l'impact de : ${options.topic}.\n\nQu'en pensez-vous ? Discutons-en dans les commentaires.`,
      twitter: `💡 ${options.topic.slice(0, 200)}... #update #news`,
      tiktok: `POV: Quand tu réalises que ${options.topic} change tout 🔥 #fyp #trend`,
    },
  };
}

export async function generateSmartReply(context: {
  customerName: string;
  customerMessage: string;
  sentiment: string;
  channel: string;
}): Promise<string[]> {
  const prompt = `You are a courteous, professional Community Manager responding to a customer on ${context.channel}.
Customer: ${context.customerName}
Message: "${context.customerMessage}"
Sentiment: ${context.sentiment}

Provide 3 distinct short, natural, high-quality reply options (1: Friendly & Warm, 2: Direct & Professional, 3: Enthusiastic & Problem Solver).
Return strictly valid JSON array of strings: ["Option 1", "Option 2", "Option 3"]`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return JSON.parse(text);
      }
    }
  } catch (err) {
    console.warn('Smart reply fallback:', err);
  }

  return [
    `Bonjour ${context.customerName}, un grand merci pour votre retour ! Nous restons à votre entière disposition.`,
    `Merci ${context.customerName} pour votre message ! Notre équipe a bien pris note et reste à votre écoute si vous avez d'autres questions.`,
    `Ravis de vous lire ${context.customerName} ! N'hésitez pas si nous pouvons vous aider sur quoi que ce soit d'autre.`
  ];
}

