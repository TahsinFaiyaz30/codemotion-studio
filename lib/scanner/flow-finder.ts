import type { CodeNode, FlowScenario } from "@/lib/types/analysis";

const flowDefinitions = [
  {
    id: "auth",
    name: "Authentication",
    keywords: ["auth", "login", "signin", "signup", "session", "jwt"]
  },
  {
    id: "checkout",
    name: "Checkout",
    keywords: ["checkout", "cart", "payment", "stripe", "order"]
  },
  {
    id: "upload",
    name: "Upload",
    keywords: ["upload", "media", "storage", "file"]
  },
  {
    id: "admin",
    name: "Admin Approval",
    keywords: ["admin", "dashboard", "moderation", "approve"]
  },
  {
    id: "content",
    name: "Content Publishing",
    keywords: ["post", "blog", "article", "content", "cms"]
  },
  {
    id: "chat",
    name: "Chat",
    keywords: ["chat", "message", "conversation"]
  }
];

const kindOrder = ["page", "component", "hook", "api", "service", "model", "database", "external"];

function nodeMatches(node: CodeNode, keywords: string[]) {
  const haystack = `${node.label} ${node.path ?? ""} ${node.summary ?? ""} ${node.group ?? ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function roleFor(node: CodeNode) {
  if (node.kind === "page") return "UI route";
  if (node.kind === "component") return "Component";
  if (node.kind === "hook") return "State hook";
  if (node.kind === "api") return "API route";
  if (node.kind === "service") return "Service";
  if (node.kind === "model") return "Data model";
  if (node.kind === "database") return "Database";
  if (node.kind === "external") return "External tool";
  return "Code file";
}

export function findFlows(nodes: CodeNode[]): FlowScenario[] {
  const flows: FlowScenario[] = [];

  for (const definition of flowDefinitions) {
    const matchedNodes = nodes
      .filter((node) => node.kind !== "repo" && nodeMatches(node, definition.keywords))
      .sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind))
      .slice(0, 8);

    if (matchedNodes.length < 2) {
      continue;
    }

    flows.push({
      id: definition.id,
      name: definition.name,
      summary: `${definition.name} flow inferred from matched files and graph nodes.`,
      steps: matchedNodes.map((node, index) => ({
        id: `${definition.id}-${index}`,
        label: node.label,
        nodeId: node.id,
        role: roleFor(node),
        detail: node.summary ?? node.path ?? node.kind
      }))
    });
  }

  if (flows.length) {
    return flows;
  }

  const fallbackNodes = nodes.filter((node) => node.kind !== "repo").slice(0, 6);

  return [
    {
      id: "overview",
      name: "Application Overview",
      summary: "Primary app path inferred from the highest-importance selected files.",
      steps: fallbackNodes.map((node, index) => ({
        id: `overview-${index}`,
        label: node.label,
        nodeId: node.id,
        role: roleFor(node),
        detail: node.summary ?? node.path ?? node.kind
      }))
    }
  ];
}

