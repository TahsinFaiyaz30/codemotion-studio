import type {
  AiModelPlanItem,
  AiProviderChoice,
  AiProviderName,
  AiTaskType
} from "@/lib/types/analysis";

export type { AiProviderChoice, AiProviderName, AiTaskType };

export interface AiStatus {
  provider: AiProviderName;
  configured: boolean;
  model?: string;
  task: AiTaskType;
}

interface GenerateAiTextInput {
  system: string;
  prompt: string;
  temperature?: number;
  providerChoice?: AiProviderChoice;
  task?: AiTaskType;
  taskIndex?: number;
}

interface ProviderConfig {
  provider: Exclude<AiProviderName, "local">;
  apiKey?: string;
  defaultModel: string;
  fastModel: string;
  reasoningModel: string;
}

const providerOrder: Array<Exclude<AiProviderName, "local">> = ["openai", "gemini", "groq"];

function clean(value: string | undefined) {
  return value?.trim() || undefined;
}

function providerConfigs(): Record<Exclude<AiProviderName, "local">, ProviderConfig> {
  return {
    openai: {
      provider: "openai",
      apiKey: clean(process.env.OPENAI_API_KEY),
      defaultModel: clean(process.env.OPENAI_MODEL) ?? "gpt-5.4-mini",
      fastModel: clean(process.env.OPENAI_FAST_MODEL) ?? "gpt-5.4-mini",
      reasoningModel:
        clean(process.env.OPENAI_REASONING_MODEL) ?? clean(process.env.OPENAI_MODEL) ?? "gpt-5.5"
    },
    gemini: {
      provider: "gemini",
      apiKey: clean(process.env.GEMINI_API_KEY),
      defaultModel: clean(process.env.GEMINI_MODEL) ?? "gemini-3.5-flash",
      fastModel: clean(process.env.GEMINI_FAST_MODEL) ?? clean(process.env.GEMINI_MODEL) ?? "gemini-3.5-flash",
      reasoningModel:
        clean(process.env.GEMINI_REASONING_MODEL) ?? clean(process.env.GEMINI_MODEL) ?? "gemini-3.5-flash"
    },
    groq: {
      provider: "groq",
      apiKey: clean(process.env.GROQ_API_KEY),
      defaultModel: clean(process.env.GROQ_MODEL) ?? "openai/gpt-oss-120b",
      fastModel: clean(process.env.GROQ_FAST_MODEL) ?? clean(process.env.GROQ_MODEL) ?? "openai/gpt-oss-20b",
      reasoningModel:
        clean(process.env.GROQ_REASONING_MODEL) ?? clean(process.env.GROQ_MODEL) ?? "openai/gpt-oss-120b"
    }
  };
}

export function normalizeAiProviderChoice(value: unknown): AiProviderChoice {
  if (
    value === "auto" ||
    value === "openai" ||
    value === "groq" ||
    value === "gemini" ||
    value === "local"
  ) {
    return value;
  }

  return "auto";
}

function modelForTask(config: ProviderConfig, task: AiTaskType) {
  if (task === "folder-agent" || task === "component" || task === "prompt") {
    return config.fastModel;
  }

  if (task === "story" || task === "story-merge") {
    return config.reasoningModel;
  }

  return config.defaultModel;
}

function configuredProviders() {
  const configs = providerConfigs();
  return providerOrder
    .map((provider) => configs[provider])
    .filter((config) => Boolean(config.apiKey));
}

function autoProviderForTask(task: AiTaskType, taskIndex = 0) {
  const configured = configuredProviders();

  if (!configured.length) {
    return null;
  }

  if (task === "folder-agent") {
    const fastPool = configured
      .filter((config) => config.provider === "gemini" || config.provider === "groq")
      .concat(configured.filter((config) => config.provider === "openai"));
    return fastPool[taskIndex % fastPool.length] ?? configured[0];
  }

  if (task === "story" || task === "story-merge") {
    return (
      configured.find((config) => config.provider === "openai") ??
      configured.find((config) => config.provider === "gemini") ??
      configured[0]
    );
  }

  if (task === "component" || task === "prompt" || task === "cluster-summary") {
    return (
      configured.find((config) => config.provider === "groq") ??
      configured.find((config) => config.provider === "gemini") ??
      configured[0]
    );
  }

  return configured[0];
}

export function getAiStatus({
  providerChoice,
  task = "general",
  taskIndex = 0
}: {
  providerChoice?: AiProviderChoice;
  task?: AiTaskType;
  taskIndex?: number;
} = {}): AiStatus {
  const choice = providerChoice ?? normalizeAiProviderChoice(process.env.AI_PROVIDER ?? "auto");

  if (choice === "local") {
    return {
      provider: "local",
      configured: false,
      task
    };
  }

  const configs = providerConfigs();
  const config = choice === "auto" ? autoProviderForTask(task, taskIndex) : configs[choice];

  if (!config?.apiKey) {
    return {
      provider: "local",
      configured: false,
      task
    };
  }

  return {
    provider: config.provider,
    configured: true,
    model: modelForTask(config, task),
    task
  };
}

export function getAiModelPlan(providerChoice?: AiProviderChoice): AiModelPlanItem[] {
  const tasks: AiTaskType[] = [
    "folder-agent",
    "cluster-summary",
    "story",
    "story-merge",
    "component",
    "prompt"
  ];

  return tasks.map((task, index) => {
    const status = getAiStatus({ providerChoice, task, taskIndex: index });

    return {
      task,
      provider: status.provider,
      model: status.model,
      reason:
        providerChoice === "auto" || !providerChoice
          ? reasonForAutoTask(task, status.provider)
          : `User selected ${providerChoice}; this task uses the same provider.`
    };
  });
}

function reasonForAutoTask(task: AiTaskType, provider: AiProviderName) {
  if (provider === "local") {
    return "No configured AI provider was available, so deterministic local analysis is used.";
  }

  if (task === "folder-agent") {
    return `${provider} is used as a fast folder agent for small parallel summaries.`;
  }

  if (task === "story" || task === "story-merge") {
    return `${provider} is used for app-level synthesis and narrative quality.`;
  }

  return `${provider} is used for compact generation work.`;
}

export async function generateAiTextWithMeta(input: GenerateAiTextInput) {
  const status = getAiStatus({
    providerChoice: input.providerChoice,
    task: input.task ?? "general",
    taskIndex: input.taskIndex ?? 0
  });

  if (!status.configured || status.provider === "local") {
    return {
      text: null,
      status
    };
  }

  if (status.provider === "openai") {
    return {
      text: await callOpenAi(status, input),
      status
    };
  }

  if (status.provider === "groq") {
    return {
      text: await callGroq(status, input),
      status
    };
  }

  return {
    text: await callGemini(status, input),
    status
  };
}

export async function generateAiText(input: GenerateAiTextInput) {
  const result = await generateAiTextWithMeta(input);
  return result.text;
}

async function callOpenAi(status: AiStatus, input: GenerateAiTextInput) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: status.model,
      input: [
        { role: "developer", content: input.system },
        { role: "user", content: input.prompt }
      ],
      reasoning: status.model?.startsWith("gpt-5") ? { effort: "low" } : undefined
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}.`);
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  return (
    data.output_text?.trim() ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ??
    null
  );
}

async function callGroq(status: AiStatus, input: GenerateAiTextInput) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: status.model,
      temperature: input.temperature ?? 0.2,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt }
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

async function callGemini(status: AiStatus, input: GenerateAiTextInput) {
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
                text: `${input.system}\n\n${input.prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: input.temperature ?? 0.2
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
