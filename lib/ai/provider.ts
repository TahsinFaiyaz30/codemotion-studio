export type AiProviderName = "groq" | "gemini" | "local";

export interface AiStatus {
  provider: AiProviderName;
  configured: boolean;
  model?: string;
}

export function getAiStatus(): AiStatus {
  const requested = process.env.AI_PROVIDER;

  if (requested === "groq" && process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      configured: true,
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"
    };
  }

  if (requested === "gemini" && process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      configured: true,
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash"
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      provider: "groq",
      configured: true,
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b"
    };
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      configured: true,
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash"
    };
  }

  return {
    provider: "local",
    configured: false
  };
}

export async function generateAiText({
  system,
  prompt,
  temperature = 0.2
}: {
  system: string;
  prompt: string;
  temperature?: number;
}) {
  const status = getAiStatus();

  if (!status.configured || status.provider === "local") {
    return null;
  }

  if (status.provider === "groq") {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: status.model,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Groq request failed with ${response.status}.`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? null;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${status.model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${system}\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}.`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? null;
}
