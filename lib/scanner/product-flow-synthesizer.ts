import type {
  AppUnderstanding,
  FolderAgentReport,
  ParsedFileAst,
  RepoFile,
  RuntimeFlow,
  RuntimeFlowActor,
  RuntimeFlowStep
} from "@/lib/types/analysis";

interface ProductFlowInput {
  appUnderstanding: AppUnderstanding;
  runtimeFlows: RuntimeFlow[];
  folderReports: FolderAgentReport[];
  files: RepoFile[];
  parsedFiles: ParsedFileAst[];
}

function actorFromAudience(audience: string[]): RuntimeFlowActor {
  const text = audience.join(" ").toLowerCase();
  if (text.includes("creator")) return "user";
  if (text.includes("buyer")) return "buyer";
  if (text.includes("seller")) return "seller";
  if (text.includes("admin") || text.includes("operator")) return "admin";
  if (text.includes("visitor")) return "visitor";
  return "user";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isLowSignalEvidencePath(filePath: string) {
  return /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|postcss\.config\.[cm]?js|tailwind\.config\.[cm]?js|eslint\.config\.[cm]?js|next\.config\.[cm]?js|next-env\.d\.ts|tsconfig\.json|\.env|app\.[cm]?[jt]s|architecture|docs?)($|\/)/i.test(
    filePath
  );
}

function evidenceFiles(input: ProductFlowInput) {
  const highSignalPath = /readme|app\/|pages\/|api\/|campaign|creator|brand|content|publish|analytics|comment|account|notification|application/i;
  const candidates = unique([
    ...input.folderReports.flatMap((report) => report.files),
    ...input.files.map((file) => file.path)
  ]);

  return candidates
    .filter((filePath) => highSignalPath.test(filePath) && !isLowSignalEvidencePath(filePath))
    .slice(0, 10);
}

function productStep({
  order,
  title,
  plainEnglish,
  layer,
  filePaths
}: {
  order: number;
  title: string;
  plainEnglish: string;
  layer: RuntimeFlowStep["layer"];
  filePaths: string[];
}): RuntimeFlowStep {
  return {
    order,
    title,
    plainEnglish,
    layer,
    technical: filePaths.length
      ? `Evidence: ${filePaths.slice(0, 5).join(", ")}`
      : "Product step inferred from app understanding and selected code evidence.",
    filePaths,
    nodeIds: [],
    edgeIds: [],
    visualHint:
      layer === "user"
        ? "click"
        : layer === "screen"
          ? "render"
          : layer === "database"
            ? "database-save"
            : layer === "response" || layer === "ui-update"
              ? "response"
              : "request"
  };
}

function primaryAction(input: ProductFlowInput) {
  const text = `${input.appUnderstanding.appType} ${input.appUnderstanding.solution} ${input.appUnderstanding.supportingEvidence.join(" ")}`.toLowerCase();

  if (text.includes("creator")) return "manage creator campaigns, content work, and business follow-up";
  if (text.includes("campaign")) return "moves a campaign or collaboration forward";
  if (text.includes("content")) return "moves content from idea to publishable work";
  if (text.includes("commerce") || text.includes("order") || text.includes("payment")) {
    return "moves an order or payment toward completion";
  }
  if (text.includes("dashboard") || text.includes("operation")) return "reviews work and chooses the next action";
  if (text.includes("message") || text.includes("conversation")) return "keeps the conversation connected to the task";
  return "turns the user's goal into an organized next step";
}

function productAreaSummary(input: ProductFlowInput) {
  const evidenceLine =
    input.appUnderstanding.supportingEvidence.find((item) => item.toLowerCase().startsWith("product areas:")) ??
    input.appUnderstanding.supportingEvidence.find((item) => item.toLowerCase().startsWith("detected product terms:"));

  if (evidenceLine) {
    return evidenceLine.replace(/^[^:]+:\s*/, "");
  }

  return input.appUnderstanding.appType;
}

function isTechnicalSupportFlow(flow: RuntimeFlow) {
  const text = [
    flow.name,
    flow.plainEnglishName,
    flow.purpose,
    flow.userGoal,
    flow.beginnerExplanation,
    ...flow.steps.flatMap((step) => [step.title, step.plainEnglish, step.technical])
  ]
    .join(" ")
    .toLowerCase();

  return /\b(auth|oauth|controller|route|routes|middleware|service|provider|util|helper|backend work|graph nodes|selected files)\b/.test(
    text
  );
}

function productFlow(input: ProductFlowInput, suffix = "primary"): RuntimeFlow {
  const evidence = evidenceFiles(input);
  const actor = actorFromAudience(input.appUnderstanding.audience);
  const action = primaryAction(input);
  const appName = input.appUnderstanding.appName;
  const audienceLabel = input.appUnderstanding.audience[0] ?? "the user";
  const productAreas = productAreaSummary(input);
  const steps: RuntimeFlowStep[] = [
    productStep({
      order: 1,
      layer: "user",
      title: "Real person has a job to do",
      plainEnglish: input.appUnderstanding.realWorldProblem,
      filePaths: evidence.slice(0, 2)
    }),
    productStep({
      order: 2,
      layer: "screen",
      title: `${appName} shows the workspace`,
      plainEnglish: `${appName} presents the workspace where ${audienceLabel} can ${action}.`,
      filePaths: evidence.slice(0, 4)
    }),
    productStep({
      order: 3,
      layer: "component",
      title: "The person chooses the next move",
      plainEnglish: `The interface turns the messy real-world work into a clear action instead of a pile of disconnected files or steps.`,
      filePaths: evidence.slice(1, 5)
    }),
    productStep({
      order: 4,
      layer: "service",
      title: "The app organizes the work",
      plainEnglish: `${appName} applies its product rules around ${productAreas}.`,
      filePaths: evidence.slice(2, 7)
    }),
    productStep({
      order: 5,
      layer: "database",
      title: "Important state is kept",
      plainEnglish: `The important business state is kept so ${audienceLabel} can return and continue with context.`,
      filePaths: evidence.slice(3, 8)
    }),
    productStep({
      order: 6,
      layer: "ui-update",
      title: "The result becomes obvious",
      plainEnglish: `The outcome is visible: ${input.appUnderstanding.primaryOutcome}.`,
      filePaths: evidence.slice(0, 5)
    })
  ];

  return {
    id: `product-flow-${suffix}`,
    name: `${appName} Product Journey`,
    plainEnglishName: `${appName}: from problem to outcome`,
    purpose: input.appUnderstanding.solution,
    actor,
    trigger: input.appUnderstanding.realWorldProblem,
    userGoal: action,
    startsAt: "Real-world problem",
    endsAt: input.appUnderstanding.primaryOutcome,
    steps,
    businessMeaning: input.appUnderstanding.solution,
    beginnerExplanation: `${appName} helps ${input.appUnderstanding.audience.join(", ")} by making ${action} understandable and trackable.`,
    confidence: input.appUnderstanding.confidence
  };
}

export function synthesizeProductRuntimeFlows(input: ProductFlowInput): RuntimeFlow[] {
  const primary = productFlow(input);
  const supporting = input.runtimeFlows
    .filter((flow) => !flow.id.startsWith("product-flow-"))
    .filter((flow) => !isTechnicalSupportFlow(flow))
    .filter((flow) => flow.confidence >= 0.7)
    .slice(0, 1)
    .map((flow, index) => ({
      ...productFlow(input, `supporting-${index + 1}`),
      id: `product-flow-${flow.id}`,
      name: `${input.appUnderstanding.appName} ${flow.name}`,
      plainEnglishName: flow.plainEnglishName.includes("User")
        ? `${input.appUnderstanding.appName}: ${primaryAction(input)}`
        : flow.plainEnglishName,
      confidence: Math.min(input.appUnderstanding.confidence, flow.confidence)
    }));

  return [primary, ...supporting].slice(0, 3);
}
