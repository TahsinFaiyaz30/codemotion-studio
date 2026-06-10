import { generateAiText } from "@/lib/ai/provider";
import type {
  AiProviderChoice,
  AppUnderstanding,
  DesignDNA,
  FeatureCluster,
  FolderAgentReport,
  ParsedFileAst,
  RepoFile,
  RuntimeFlow
} from "@/lib/types/analysis";

interface AppUnderstandingInput {
  repoName: string;
  repoDescription?: string | null;
  summary: string;
  files?: RepoFile[];
  parsedFiles?: ParsedFileAst[];
  runtimeFlows: RuntimeFlow[];
  clusters: FeatureCluster[];
  folderReports: FolderAgentReport[];
  designDNA: DesignDNA;
  providerChoice?: AiProviderChoice;
}

interface ProductEvidence {
  appName: string;
  repoDescription: string;
  readmeSummary: string;
  packageDescription: string;
  domainTerms: string[];
  productAreas: string[];
  featureTerms: string[];
  entityTerms: string[];
  routeTerms: string[];
  confidenceBoost: number;
}

const genericPhrases = [
  "backend work",
  "visible actions",
  "clear result",
  "guided web experience",
  "guided application experience",
  "complex workflow",
  "data steps",
  "practical task"
];

const domainRules = [
  {
    id: "creator-ops",
    appType: "creator operations workspace",
    terms: [
      "creatorops",
      "creator ops",
      "creator operations",
      "creator teams",
      "creator",
      "creators",
      "influencer",
      "brand",
      "campaign",
      "sponsor",
      "sponsorship",
      "collab",
      "ugc",
      "media kit",
      "content calendar",
      "deal",
      "publishing",
      "variants",
      "workflow visibility"
    ],
    audience: ["creators", "creator teams", "brand operators"],
    problem:
      "Creators and the teams around them need one place to coordinate collaborations, content work, campaigns, and business follow-up.",
    solution:
      "It gives creator teams an operating workspace for tracking the creator business from opportunity to organized follow-through.",
    outcome:
      "the creator team can see what needs attention, what is moving, and what is finished"
  },
  {
    id: "commerce",
    appType: "commerce application",
    terms: ["shop", "commerce", "cart", "checkout", "stripe", "payment", "order", "product", "invoice"],
    audience: ["buyers", "sellers", "store operators"],
    problem: "People need to choose, pay for, and manage products or orders without losing track of the transaction.",
    solution: "It gives customers and operators a focused way to move products, orders, and payments through the buying process.",
    outcome: "the order or payment state is visible and ready to act on"
  },
  {
    id: "content",
    appType: "content publishing system",
    terms: ["blog", "post", "article", "content", "cms", "editor", "publish", "draft"],
    audience: ["editors", "writers", "content teams"],
    problem: "Content teams need to draft, organize, publish, and review material without losing editorial context.",
    solution: "It gives content teams a workspace for moving ideas and drafts into published content.",
    outcome: "the content is organized, reviewed, or published"
  },
  {
    id: "learning",
    appType: "learning platform",
    terms: ["course", "lesson", "student", "teacher", "class", "quiz", "assignment", "learn"],
    audience: ["students", "teachers", "course operators"],
    problem: "Learners and instructors need a clear way to manage lessons, progress, and learning tasks.",
    solution: "It gives learners and instructors a structured place to move through education work.",
    outcome: "learning progress or course work becomes visible"
  },
  {
    id: "operations",
    appType: "operations dashboard",
    terms: ["admin", "dashboard", "manage", "analytics", "workflow", "approval", "review", "settings"],
    audience: ["operators", "admins", "team members"],
    problem: "Teams need to monitor work, review changes, and act on operational signals from one place.",
    solution: "It gives operators a dashboard for reviewing work, making decisions, and keeping activity organized.",
    outcome: "the team knows what changed and what action comes next"
  },
  {
    id: "communication",
    appType: "communication workspace",
    terms: ["chat", "message", "conversation", "inbox", "notification", "comment"],
    audience: ["users", "teams"],
    problem: "People need to send, receive, and keep track of communication around shared work.",
    solution: "It gives people a place to keep conversations connected to the work they are doing.",
    outcome: "the conversation is visible and the next response is clear"
  }
];

function titleForRepo(repoName: string) {
  const raw = repoName.includes("/")
    ? repoName.split("/").at(-1)?.replace(/[-_]/g, " ") ?? repoName
    : repoName.replace(/[-_]/g, " ");

  return raw
    .split(/\s+/)
    .map((word) => {
      if (word.toLowerCase() === "os") return "OS";
      if (word.toLowerCase() === "api") return "API";
      if (word.toLowerCase() === "ai") return "AI";
      if (word.toLowerCase() === "creatorops") return "CreatorOps";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function appNameFromEvidence(repoName: string, repoDescription: string, packageDescription: string, readmeSummary: string) {
  const source = [repoDescription, packageDescription, readmeSummary].join(" ");
  const creatorOps = source.match(/\bcreatorops\s+os\b/i);

  if (creatorOps) return "CreatorOps OS";

  const leadingName = source.match(/^([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*){0,3})(?:\s+(?:[-:\u2013\u2014]|is|gives|helps)\b)/);

  return leadingName?.[1] ?? titleForRepo(repoName);
}

function splitWords(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]+]\([^)]*\)/g, " ")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readJsonDescription(content: string | undefined) {
  if (!content) return "";

  try {
    const parsed = JSON.parse(content) as { description?: unknown; name?: unknown };
    return typeof parsed.description === "string" ? parsed.description : "";
  } catch {
    return "";
  }
}

function firstUsefulReadmeParagraph(content: string | undefined) {
  if (!content) return "";

  const cleaned = stripMarkdown(content);
  const sentence = cleaned
    .split(/(?<=[.!?])\s+/)
    .find((item) => {
      const lower = item.toLowerCase();
      return item.length > 35 && !lower.includes("badge") && !lower.includes("install");
    });

  return sentence?.slice(0, 360) ?? cleaned.slice(0, 360);
}

function extractProductAreasFromReadme(readmeSummary: string) {
  const match =
    readmeSummary.match(/\bworkspace for ([^.]+)/i) ??
    readmeSummary.match(/\bplatform for ([^.]+)/i) ??
    readmeSummary.match(/\bapplication for ([^.]+)/i);

  if (!match?.[1]) return [];

  return unique(
    match[1]
      .replace(/\band\b/gi, ",")
      .split(",")
      .map((item) => item.trim().replace(/\s+/g, " "))
      .filter((item) => item.length > 2 && item.length < 64)
  ).slice(0, 10);
}

function extractRoutes(files: RepoFile[]) {
  const ignored = new Set([
    "app",
    "apps",
    "page",
    "pages",
    "route",
    "routes",
    "api",
    "tsx",
    "jsx",
    "index",
    "client",
    "server",
    "src",
    "lib",
    "libs",
    "components",
    "component",
    "hooks",
    "utils",
    "styles",
    "style",
    "public",
    "assets",
    "architecture",
    "docs",
    "readme",
    "config",
    "layout",
    "loading",
    "error",
    "template"
  ]);

  return files
    .map((file) => file.path)
    .filter((filePath) => /(^|\/)(app|pages)\//.test(filePath) || filePath.includes("/api/"))
    .flatMap(splitWords)
    .filter((word) => !ignored.has(word));
}

function extractEntities(input: AppUnderstandingInput) {
  const pathWords = (input.files ?? []).flatMap((file) => splitWords(file.path));
  const clusterWords = input.clusters.flatMap((cluster) => splitWords(`${cluster.name} ${cluster.summary}`));
  const reportWords = input.folderReports.flatMap((report) =>
    splitWords(
      `${report.folder} ${report.appPurpose} ${report.userFacingRole} ${report.realWorldSignals.join(" ")}`
    )
  );
  const astWords = (input.parsedFiles ?? []).flatMap((file) =>
    [...file.components, ...file.functions, ...file.apiHandlers, ...file.exports].flatMap(splitWords)
  );

  return unique([...pathWords, ...clusterWords, ...reportWords, ...astWords]).filter(
    (word) =>
      ![
        "component",
        "controller",
        "service",
        "route",
        "routes",
        "middleware",
        "utils",
        "index",
        "layout",
        "page",
        "provider",
        "config",
        "button",
        "card",
        "client",
        "server",
        "src",
        "docs",
        "architecture",
        "package",
        "json",
        "lock",
        "postcss",
        "tailwind",
        "eslint",
        "next",
        "types",
        "tsx",
        "jsx"
      ].includes(word)
  );
}

function collectEvidence(input: AppUnderstandingInput): ProductEvidence {
  const files = input.files ?? [];
  const readme = files.find((file) => /^readme(\.|$)/i.test(file.path.split("/").at(-1) ?? ""));
  const packageFile = files.find((file) => file.path.endsWith("package.json"));
  const repoWords = splitWords(input.repoName);
  const descriptionWords = splitWords(input.repoDescription ?? "");
  const readmeSummary = firstUsefulReadmeParagraph(readme?.content);
  const packageDescription = readJsonDescription(packageFile?.content);
  const productAreas = extractProductAreasFromReadme(readmeSummary);
  const routeTerms = extractRoutes(files);
  const entityTerms = extractEntities(input);
  const allWords = unique([
    ...repoWords,
    ...descriptionWords,
    ...splitWords(readmeSummary),
    ...splitWords(packageDescription),
    ...routeTerms,
    ...entityTerms
  ]);
  const domainTerms = unique(
    domainRules.flatMap((rule) => rule.terms.filter((term) => allWords.join(" ").includes(term)))
  );

  return {
    appName: appNameFromEvidence(input.repoName, input.repoDescription ?? "", packageDescription, readmeSummary),
    repoDescription: input.repoDescription ?? "",
    readmeSummary,
    packageDescription,
    domainTerms,
    productAreas,
    routeTerms: unique(routeTerms).slice(0, 16),
    entityTerms: entityTerms.slice(0, 24),
    featureTerms: unique([...domainTerms, ...routeTerms, ...entityTerms]).slice(0, 24),
    confidenceBoost: (readmeSummary ? 0.12 : 0) + (input.repoDescription ? 0.1 : 0) + (packageDescription ? 0.08 : 0)
  };
}

function evidenceHaystack(evidence: ProductEvidence) {
  return [
    evidence.appName,
    evidence.repoDescription,
    evidence.readmeSummary,
    evidence.packageDescription,
    ...evidence.featureTerms,
    ...evidence.entityTerms,
    ...evidence.routeTerms
  ]
    .join(" ")
    .toLowerCase();
}

function hasCreatorOpsSignal(evidence: ProductEvidence) {
  const haystack = evidenceHaystack(evidence);
  const creatorWord = /\bcreator(s)?\b/.test(haystack) || haystack.includes("creatorops");
  const workWords = ["campaign", "brand", "content", "publishing", "workflow", "review", "analytics", "applications"];
  const workHits = workWords.filter((word) => haystack.includes(word)).length;

  return (
    haystack.includes("creator operations") ||
    haystack.includes("creator teams") ||
    haystack.includes("creatorops") ||
    (creatorWord && workHits >= 2)
  );
}

function scoreDomain(evidence: ProductEvidence) {
  const haystack = evidenceHaystack(evidence);

  const scored = domainRules.map((rule) => ({
    rule,
    score: rule.terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0)
  }));
  const creator = scored.find((item) => item.rule.id === "creator-ops");
  const commerce = scored.find((item) => item.rule.id === "commerce");
  const operations = scored.find((item) => item.rule.id === "operations");

  if (creator && hasCreatorOpsSignal(evidence)) {
    creator.score += 8;
    if (operations) operations.score = Math.max(0, operations.score - 2);
  } else if (creator && commerce && creator.score > 0 && commerce.score > 0 && creator.score >= commerce.score - 1) {
    creator.score += 3;
  }

  return scored.sort((a, b) => b.score - a.score)[0];
}

function sentenceFromEvidence(evidence: ProductEvidence) {
  return (
    evidence.repoDescription ||
    evidence.packageDescription ||
    evidence.readmeSummary ||
    `${evidence.appName} exposes features around ${evidence.featureTerms.slice(0, 6).join(", ")}.`
  );
}

function hasGenericLanguage(understanding: AppUnderstanding) {
  const text = `${understanding.appType} ${understanding.realWorldProblem} ${understanding.solution} ${understanding.mainUserJourney}`.toLowerCase();
  return genericPhrases.some((phrase) => text.includes(phrase));
}

function contradictsStrongerEvidence(parsed: AppUnderstanding, fallback: AppUnderstanding) {
  const parsedType = parsed.appType.toLowerCase();
  const fallbackType = fallback.appType.toLowerCase();

  return (
    fallbackType.includes("creator") &&
    !parsedType.includes("creator") &&
    (parsedType.includes("commerce") || parsedType.includes("operations") || parsedType.includes("dashboard"))
  );
}

function localUnderstanding(input: AppUnderstandingInput): AppUnderstanding {
  const evidence = collectEvidence(input);
  const domain = scoreDomain(evidence);
  const rule = domain.score > 0 ? domain.rule : null;
  const evidenceSentence = sentenceFromEvidence(evidence);
  const concreteFeatures = evidence.featureTerms.slice(0, 7);
  const productAreas = unique([
    ...evidence.productAreas,
    ...evidence.domainTerms,
    ...evidence.routeTerms,
    ...evidence.entityTerms
  ])
    .filter((term) => !["dashboard", "admin", "manage"].includes(term))
    .slice(0, 8);
  const audience = rule?.audience ?? ["users", "teams"];
  const appType =
    rule?.appType ??
    (evidence.featureTerms.length ? `${concreteFeatures.slice(0, 2).join(" and ")} tool` : "application");
  const realWorldProblem =
    rule?.problem ??
    (evidence.featureTerms.length
      ? `People need to manage ${concreteFeatures.slice(0, 4).join(", ")} without losing context.`
      : `The code does not expose enough product language to safely name the exact problem yet.`);
  const solution =
    rule?.solution ??
    (evidence.featureTerms.length
      ? `${evidence.appName} organizes ${concreteFeatures.slice(0, 5).join(", ")} into one usable workspace.`
      : `${evidence.appName} needs stronger README or route evidence before CodeMotion can safely summarize its product purpose.`);
  const primaryOutcome =
    rule?.outcome ??
    (evidence.featureTerms.length
      ? `${concreteFeatures.slice(0, 3).join(", ")} are easier to track`
      : "the app purpose remains uncertain");

  return {
    appName: evidence.appName,
    appType,
    audience,
    realWorldProblem,
    solution,
    primaryOutcome,
    mainUserJourney: `${evidenceSentence} The detected product areas are ${productAreas.join(", ") || "not yet clear from selected files"}.`,
    supportingEvidence: unique([
      evidence.repoDescription ? `GitHub description: ${evidence.repoDescription}` : "",
      evidence.packageDescription ? `package.json: ${evidence.packageDescription}` : "",
      evidence.readmeSummary ? `README: ${evidence.readmeSummary}` : "",
      concreteFeatures.length ? `Detected product terms: ${concreteFeatures.join(", ")}` : "",
      productAreas.length ? `Product areas: ${productAreas.join(", ")}` : ""
    ]).slice(0, 8),
    confidence: Math.min(0.95, Math.max(0.35, 0.48 + domain.score * 0.045 + evidence.confidenceBoost))
  };
}

function buildPrompt(input: AppUnderstandingInput, fallback: AppUnderstanding, evidence: ProductEvidence) {
  return JSON.stringify({
    task:
      "Infer the exact product purpose of this repository. Return JSON matching AppUnderstanding only.",
    hardRules: [
      "Do not describe the app as backend work, visible actions, clear result, data steps, or generic web workflow.",
      "Name the actual domain and job-to-be-done using evidence.",
      "If evidence is weak, say what is detected and that the exact purpose is uncertain.",
      "Do not over-classify as commerce just because order/payment/auth files exist if creator, campaign, brand, content, or operations evidence is stronger.",
      "Every field must be product-facing and concrete."
    ],
    repoName: input.repoName,
    repoDescription: input.repoDescription,
    evidence,
    fallback,
    folderReports: input.folderReports.map((report) => ({
      folder: report.folder,
      appPurpose: report.appPurpose,
      userFacingRole: report.userFacingRole,
      realWorldSignals: report.realWorldSignals,
      dataSignals: report.dataSignals
    })),
    runtimeFlows: input.runtimeFlows.map((flow) => ({
      name: flow.plainEnglishName,
      actor: flow.actor,
      userGoal: flow.userGoal,
      businessMeaning: flow.businessMeaning
    }))
  });
}

function parseUnderstanding(value: string): AppUnderstanding | null {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<AppUnderstanding>;

    if (
      typeof parsed.appName !== "string" ||
      typeof parsed.appType !== "string" ||
      typeof parsed.realWorldProblem !== "string" ||
      typeof parsed.solution !== "string"
    ) {
      return null;
    }

    return {
      appName: parsed.appName,
      appType: parsed.appType,
      audience: Array.isArray(parsed.audience)
        ? parsed.audience.filter((item): item is string => typeof item === "string").slice(0, 6)
        : ["users"],
      realWorldProblem: parsed.realWorldProblem,
      solution: parsed.solution,
      primaryOutcome: parsed.primaryOutcome ?? "the user reaches the app outcome",
      mainUserJourney: parsed.mainUserJourney ?? parsed.solution,
      supportingEvidence: Array.isArray(parsed.supportingEvidence)
        ? parsed.supportingEvidence.filter((item): item is string => typeof item === "string").slice(0, 8)
        : [],
      confidence:
        typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.68
    };
  } catch {
    return null;
  }
}

export async function synthesizeAppUnderstanding(input: AppUnderstandingInput) {
  const fallback = localUnderstanding(input);
  const evidence = collectEvidence(input);

  try {
    const aiText = await generateAiText({
      providerChoice: input.providerChoice,
      task: "story-merge",
      system:
        "You are a strict product analyst. Return valid JSON only. Prefer uncertainty over generic filler.",
      prompt: buildPrompt(input, fallback, evidence),
      temperature: 0.12
    });
    const parsed = aiText ? parseUnderstanding(aiText) : null;

    if (!parsed || hasGenericLanguage(parsed) || contradictsStrongerEvidence(parsed, fallback)) {
      return fallback;
    }

    return {
      ...parsed,
      supportingEvidence: parsed.supportingEvidence.length
        ? parsed.supportingEvidence
        : fallback.supportingEvidence,
      confidence: Math.max(Math.min(parsed.confidence, 0.96), fallback.confidence - 0.05)
    };
  } catch {
    return fallback;
  }
}
