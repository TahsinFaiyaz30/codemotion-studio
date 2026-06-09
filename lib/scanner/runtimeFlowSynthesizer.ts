import type {
  AnalysisResult,
  CodeEdge,
  CodeNode,
  FeatureCluster,
  FlowScenario,
  ParsedFileAst,
  RuntimeFlow,
  RuntimeFlowActor,
  RuntimeFlowStep,
  RuntimeFlowStepLayer,
  RuntimeFlowVisualHint
} from "@/lib/types/analysis";

type StackItem = AnalysisResult["stack"][number];

interface RuntimeFlowInput {
  nodes: CodeNode[];
  edges: CodeEdge[];
  parsedFiles: ParsedFileAst[];
  stack: StackItem[];
  clusters: FeatureCluster[];
  flows: FlowScenario[];
}

const layerByKind: Partial<Record<CodeNode["kind"], RuntimeFlowStepLayer>> = {
  page: "screen",
  component: "component",
  hook: "state",
  api: "api",
  controller: "service",
  service: "service",
  model: "database",
  database: "database",
  external: "external"
};

const visualByLayer: Record<RuntimeFlowStepLayer, RuntimeFlowVisualHint> = {
  user: "click",
  screen: "render",
  component: "submit",
  state: "loading",
  api: "request",
  validation: "submit",
  service: "request",
  database: "database-save",
  external: "request",
  response: "response",
  "ui-update": "notification"
};

function titleCase(value: string) {
  return value
    .split(/[-_\s/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function actorForName(name: string): RuntimeFlowActor {
  const lower = name.toLowerCase();
  if (lower.includes("admin")) return "admin";
  if (lower.includes("seller")) return "seller";
  if (lower.includes("buyer") || lower.includes("checkout")) return "buyer";
  if (lower.includes("visitor") || lower.includes("browse")) return "visitor";
  if (lower.includes("system")) return "system";
  return "user";
}

function goalForFlow(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("checkout")) return "complete a purchase and receive confirmation";
  if (lower.includes("auth") || lower.includes("login")) return "enter the app safely";
  if (lower.includes("upload")) return "add a file or piece of media";
  if (lower.includes("admin")) return "review and manage important app data";
  if (lower.includes("content")) return "publish or browse content";
  if (lower.includes("chat")) return "send and receive messages";
  return `finish the ${name.toLowerCase()} journey`;
}

function plainName(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("checkout")) return "Buyer checks out";
  if (lower.includes("auth")) return "User signs in";
  if (lower.includes("upload")) return "User uploads something";
  if (lower.includes("admin")) return "Admin reviews work";
  if (lower.includes("content")) return "Visitor reads or publishes content";
  if (lower.includes("chat")) return "User sends a message";
  return `User uses ${name}`;
}

function relatedEdges(edges: CodeEdge[], nodeIds: string[]) {
  const nodeIdSet = new Set(nodeIds);
  return edges.filter((edge) => nodeIdSet.has(edge.source) || nodeIdSet.has(edge.target));
}

function nodeFiles(nodes: CodeNode[]) {
  return nodes.map((node) => node.path).filter((path): path is string => Boolean(path));
}

function stepFromNode({
  node,
  order,
  edges
}: {
  node: CodeNode;
  order: number;
  edges: CodeEdge[];
}): RuntimeFlowStep {
  const layer = layerByKind[node.kind] ?? "component";
  const connectedEdgeIds = relatedEdges(edges, [node.id]).map((edge) => edge.id);

  return {
    order,
    layer,
    title: node.label,
    plainEnglish: humanStepForLayer(layer, node),
    technical: `${node.path ?? node.label} participates as a ${node.kind}. ${node.summary ?? ""}`.trim(),
    filePaths: node.path ? [node.path] : [],
    nodeIds: [node.id],
    edgeIds: connectedEdgeIds.slice(0, 6),
    visualHint: visualByLayer[layer]
  };
}

function humanStepForLayer(layer: RuntimeFlowStepLayer, node: CodeNode) {
  if (layer === "screen") return `The person sees the ${node.label} screen.`;
  if (layer === "component") return `The interface uses ${node.label} to collect or show the next piece of information.`;
  if (layer === "state") return `${node.label} keeps track of what changed on the page.`;
  if (layer === "api") return `The app sends a request to ${node.label} so the backend can handle the action.`;
  if (layer === "service") return `${node.label} applies the app's business logic.`;
  if (layer === "database") return `${node.label} stores or reads the lasting data.`;
  if (layer === "external") return `The app relies on ${node.label} for a connected outside service.`;
  return `${node.label} helps move the journey forward.`;
}

function validationStep(order: number, parsedFiles: ParsedFileAst[], flowNodes: CodeNode[]): RuntimeFlowStep | null {
  const flowPaths = new Set(nodeFiles(flowNodes));
  const validationFile = parsedFiles.find((file) => {
    if (!flowPaths.has(file.path)) return false;
    return file.imports.includes("zod") || file.calls.some((call) => /parse|safeParse|validate/i.test(call));
  });

  if (!validationFile) return null;

  return {
    order,
    layer: "validation",
    title: "Validate the request",
    plainEnglish: "The app checks whether the submitted information is shaped correctly before trusting it.",
    technical: `${validationFile.path} contains validation-like imports or calls.`,
    filePaths: [validationFile.path],
    nodeIds: flowNodes.filter((node) => node.path === validationFile.path).map((node) => node.id),
    edgeIds: [],
    visualHint: "submit"
  };
}

function responseStep(order: number, flowName: string, lastNode: CodeNode | undefined): RuntimeFlowStep {
  return {
    order,
    layer: "response",
    title: "Return the result",
    plainEnglish: `The app sends back the result of ${flowName.toLowerCase()} so the interface knows what happened.`,
    technical: lastNode?.path
      ? `${lastNode.path} is the last detected technical stop before the response.`
      : "Response step inferred from the runtime journey.",
    filePaths: lastNode?.path ? [lastNode.path] : [],
    nodeIds: lastNode ? [lastNode.id] : [],
    edgeIds: [],
    visualHint: "response"
  };
}

function uiUpdateStep(order: number, flowName: string, firstNode: CodeNode | undefined): RuntimeFlowStep {
  return {
    order,
    layer: "ui-update",
    title: "Update the interface",
    plainEnglish: `The screen changes so the person can see that ${flowName.toLowerCase()} worked.`,
    technical: firstNode?.path
      ? `${firstNode.path} is the first detected UI surface for this journey.`
      : "UI update step inferred from the runtime journey.",
    filePaths: firstNode?.path ? [firstNode.path] : [],
    nodeIds: firstNode ? [firstNode.id] : [],
    edgeIds: [],
    visualHint: "notification"
  };
}

function runtimeFlowFromScenario({
  scenario,
  nodes,
  edges,
  parsedFiles,
  clusters
}: {
  scenario: FlowScenario;
  nodes: CodeNode[];
  edges: CodeEdge[];
  parsedFiles: ParsedFileAst[];
  clusters: FeatureCluster[];
}): RuntimeFlow {
  const flowNodes = scenario.steps
    .map((step) => nodes.find((node) => node.id === step.nodeId))
    .filter((node): node is CodeNode => Boolean(node));
  const actor = actorForName(scenario.name);
  const nodeSteps = flowNodes.map((node, index) =>
    stepFromNode({
      node,
      order: index + 2,
      edges
    })
  );
  const validation = validationStep(nodeSteps.length + 2, parsedFiles, flowNodes);
  const technicalSteps = validation ? [...nodeSteps, validation] : nodeSteps;
  const firstNode = flowNodes[0];
  const lastNode = flowNodes.at(-1);
  const startStep: RuntimeFlowStep = {
    order: 1,
    layer: "user",
    title: `${titleCase(String(actor))} starts`,
    plainEnglish: `A ${actor} wants to ${goalForFlow(scenario.name)}.`,
    technical: "This is the human trigger inferred from detected routes, components, APIs, and feature names.",
    filePaths: [],
    nodeIds: [],
    edgeIds: [],
    visualHint: "click"
  };
  const steps: RuntimeFlowStep[] = [
    startStep,
    ...technicalSteps,
    responseStep(technicalSteps.length + 2, scenario.name, lastNode),
    uiUpdateStep(technicalSteps.length + 3, scenario.name, firstNode)
  ].map((step, index) => ({ ...step, order: index + 1 }));
  const relatedCluster = clusters.find((cluster) =>
    cluster.nodeIds.some((nodeId) => flowNodes.some((node) => node.id === nodeId))
  );

  return {
    id: `runtime-${scenario.id}`,
    name: scenario.name,
    plainEnglishName: plainName(scenario.name),
    purpose: scenario.summary,
    actor,
    trigger: `The ${actor} takes an action in the app.`,
    userGoal: goalForFlow(scenario.name),
    startsAt: firstNode?.label ?? "Detected entry screen",
    endsAt: lastNode?.label ?? "Updated interface",
    steps,
    businessMeaning:
      relatedCluster?.summary ??
      `This flow explains how ${scenario.name.toLowerCase()} creates value for the person using the app.`,
    beginnerExplanation: `${plainName(scenario.name)}: the app starts with what the person sees, moves through UI and backend work, then returns a result the person can understand.`,
    confidence: Math.min(0.92, Math.max(0.48, 0.45 + flowNodes.length * 0.07))
  };
}

function fallbackRuntimeFlow(nodes: CodeNode[], edges: CodeEdge[]): RuntimeFlow {
  const topNodes = nodes.filter((node) => node.kind !== "repo").slice(0, 6);
  const nodeSteps = topNodes.map((node, index) =>
    stepFromNode({
      node,
      order: index + 2,
      edges
    })
  );

  return {
    id: "runtime-overview",
    name: "Application Overview",
    plainEnglishName: "User opens and uses the app",
    purpose: "Explain the main app journey from the most important detected files.",
    actor: "user",
    trigger: "The user opens the app.",
    userGoal: "understand and complete the main task",
    startsAt: topNodes[0]?.label ?? "App entry",
    endsAt: topNodes.at(-1)?.label ?? "Updated interface",
    steps: [
      {
        order: 1,
        layer: "user",
        title: "User arrives",
        plainEnglish: "A person opens the app because they want to accomplish its main job.",
        technical: "Entry inferred from highest-importance selected nodes.",
        filePaths: [],
        nodeIds: [],
        edgeIds: [],
        visualHint: "click"
      },
      ...nodeSteps,
      responseStep(nodeSteps.length + 2, "Application Overview", topNodes.at(-1)),
      uiUpdateStep(nodeSteps.length + 3, "Application Overview", topNodes[0])
    ],
    businessMeaning: "This is the best-effort product journey from the available graph.",
    beginnerExplanation: "The app receives a user action, runs through its important screens and code, then shows a result.",
    confidence: 0.45
  };
}

export function synthesizeRuntimeFlows(input: RuntimeFlowInput): RuntimeFlow[] {
  const runtimeFlows = input.flows
    .slice(0, 8)
    .map((scenario) =>
      runtimeFlowFromScenario({
        scenario,
        nodes: input.nodes,
        edges: input.edges,
        parsedFiles: input.parsedFiles,
        clusters: input.clusters
      })
    )
    .filter((flow) => flow.steps.length > 3);

  return runtimeFlows.length ? runtimeFlows : [fallbackRuntimeFlow(input.nodes, input.edges)];
}
