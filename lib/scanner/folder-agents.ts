import { generateAiTextWithMeta, getAiStatus } from "@/lib/ai/provider";
import type {
  AiProviderChoice,
  CodeNode,
  FeatureCluster,
  FolderAgentReport,
  ParsedFileAst,
  RepoFile
} from "@/lib/types/analysis";

export interface FolderAgentUpdate {
  kind: "started" | "completed";
  folder: string;
  index: number;
  total: number;
  provider: FolderAgentReport["provider"];
  model?: string;
  report?: FolderAgentReport;
}

interface FolderAgentInput {
  files: RepoFile[];
  parsedFiles: ParsedFileAst[];
  nodes: CodeNode[];
  clusters: FeatureCluster[];
  providerChoice?: AiProviderChoice;
}

interface FolderGroup {
  folder: string;
  files: RepoFile[];
  parsedFiles: ParsedFileAst[];
  nodes: CodeNode[];
  clusters: FeatureCluster[];
}

function topFolder(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.length > 1 ? parts[0] : "(root)";
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function limitedParallelAgents() {
  const parsed = Number(process.env.AI_PARALLEL_AGENTS ?? "4");
  if (!Number.isFinite(parsed)) return 4;
  return Math.max(1, Math.min(8, Math.floor(parsed)));
}

function buildFolderGroups(input: FolderAgentInput): FolderGroup[] {
  const groups = new Map<string, RepoFile[]>();

  for (const file of input.files.filter((item) => item.selected)) {
    const folder = topFolder(file.path);
    groups.set(folder, [...(groups.get(folder) ?? []), file]);
  }

  return Array.from(groups.entries())
    .map(([folder, files]) => {
      const paths = new Set(files.map((file) => file.path));
      const nodes = input.nodes.filter((node) => node.path && paths.has(node.path));
      const parsedFiles = input.parsedFiles.filter((file) => paths.has(file.path));
      const clusters = input.clusters.filter((cluster) =>
        cluster.files.some((filePath) => paths.has(filePath))
      );

      return {
        folder,
        files,
        parsedFiles,
        nodes,
        clusters
      };
    })
    .sort((a, b) => scoreFolder(b) - scoreFolder(a));
}

function scoreFolder(group: FolderGroup) {
  return (
    group.nodes.reduce((sum, node) => sum + node.importance, 0) +
    group.parsedFiles.length * 3 +
    group.clusters.length * 4 +
    group.files.length
  );
}

function localReport(group: FolderGroup, provider: FolderAgentReport["provider"], model?: string): FolderAgentReport {
  const pathText = group.files.map((file) => file.path.toLowerCase()).join(" ");
  const componentCount = group.parsedFiles.reduce((sum, file) => sum + file.components.length, 0);
  const apiCount = group.parsedFiles.reduce((sum, file) => sum + file.apiHandlers.length, 0);
  const dbSignals = unique(group.parsedFiles.flatMap((file) => file.dbSignals));
  const authSignals = unique(group.parsedFiles.flatMap((file) => file.authSignals));
  const userFacing = /app|page|screen|component|ui|client|view|route|dashboard/.test(pathText);
  const commerce = /cart|checkout|order|payment|product|shop/.test(pathText);
  const content = /blog|post|article|content|cms|editor/.test(pathText);
  const admin = /admin|dashboard|manage|settings/.test(pathText);
  const chat = /chat|message|conversation|inbox/.test(pathText);
  const auth = /auth|login|register|session|account/.test(pathText) || authSignals.length > 0;
  const roleSignals = [
    commerce ? "commerce journey" : "",
    content ? "content workflow" : "",
    admin ? "management dashboard" : "",
    chat ? "messaging experience" : "",
    auth ? "account access" : ""
  ].filter(Boolean);
  const firstCluster = group.clusters[0];

  return {
    id: `folder-agent-${group.folder.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`,
    folder: group.folder,
    files: group.files.map((file) => file.path),
    provider,
    model,
    appPurpose:
      firstCluster?.summary ??
      (roleSignals.length
        ? `This area supports ${roleSignals.join(", ")}.`
        : "This area supports the main application experience."),
    userFacingRole: userFacing
      ? `People likely interact with this folder through ${componentCount || group.nodes.length} visible UI surface${componentCount === 1 ? "" : "s"}.`
      : "This folder mostly supports behind-the-scenes application behavior.",
    technicalRole: `${group.files.length} selected file${group.files.length === 1 ? "" : "s"}, ${componentCount} component signal${componentCount === 1 ? "" : "s"}, ${apiCount} API handler signal${apiCount === 1 ? "" : "s"}.`,
    realWorldSignals: unique([
      ...roleSignals,
      ...group.clusters.map((cluster) => cluster.name),
      ...group.nodes.map((node) => node.kind)
    ]).slice(0, 8),
    dataSignals: unique([...dbSignals, ...authSignals]).slice(0, 8),
    riskNotes: group.parsedFiles.flatMap((file) => file.errors.map((error) => `${file.path}: ${error}`)).slice(0, 3),
    confidence: Math.min(0.92, Math.max(0.46, 0.44 + group.parsedFiles.length * 0.04 + roleSignals.length * 0.06))
  };
}

function buildFolderPrompt(group: FolderGroup) {
  return JSON.stringify({
    task:
      "Act as a small folder-level product analyst. Return JSON only with appPurpose, userFacingRole, technicalRole, realWorldSignals, dataSignals, riskNotes, confidence.",
    folder: group.folder,
    files: group.files.map((file) => ({
      path: file.path,
      extension: file.extension,
      size: file.size
    })),
    parsedSignals: group.parsedFiles.map((file) => ({
      path: file.path,
      imports: file.imports.slice(0, 8),
      components: file.components.slice(0, 8),
      apiHandlers: file.apiHandlers.slice(0, 8),
      hooks: file.hooks.slice(0, 8),
      dbSignals: file.dbSignals.slice(0, 8),
      authSignals: file.authSignals.slice(0, 8)
    })),
    nodes: group.nodes.map((node) => ({
      label: node.label,
      kind: node.kind,
      summary: node.summary
    })),
    clusters: group.clusters.map((cluster) => ({
      name: cluster.name,
      summary: cluster.summary
    }))
  });
}

function parseFolderJson(value: string) {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as Partial<FolderAgentReport>;
  } catch {
    return null;
  }
}

async function analyzeFolder(group: FolderGroup, providerChoice: AiProviderChoice | undefined, index: number) {
  const status = getAiStatus({ providerChoice, task: "folder-agent", taskIndex: index });
  const fallback = localReport(group, status.provider, status.model);

  if (!status.configured) {
    return fallback;
  }

  try {
    const { text } = await generateAiTextWithMeta({
      providerChoice,
      task: "folder-agent",
      taskIndex: index,
      system:
        "You summarize compressed code analysis facts. Do not invent features. Explain the folder's product role, not individual functions.",
      prompt: buildFolderPrompt(group),
      temperature: 0.15
    });
    const parsed = text ? parseFolderJson(text) : null;

    return {
      ...fallback,
      appPurpose: parsed?.appPurpose ?? fallback.appPurpose,
      userFacingRole: parsed?.userFacingRole ?? fallback.userFacingRole,
      technicalRole: parsed?.technicalRole ?? fallback.technicalRole,
      realWorldSignals: Array.isArray(parsed?.realWorldSignals)
        ? parsed.realWorldSignals.filter((item): item is string => typeof item === "string").slice(0, 8)
        : fallback.realWorldSignals,
      dataSignals: Array.isArray(parsed?.dataSignals)
        ? parsed.dataSignals.filter((item): item is string => typeof item === "string").slice(0, 8)
        : fallback.dataSignals,
      riskNotes: Array.isArray(parsed?.riskNotes)
        ? parsed.riskNotes.filter((item): item is string => typeof item === "string").slice(0, 4)
        : fallback.riskNotes,
      confidence:
        typeof parsed?.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : fallback.confidence
    };
  } catch (error) {
    return {
      ...fallback,
      riskNotes: [
        ...fallback.riskNotes,
        error instanceof Error ? error.message : "Folder AI request failed."
      ].slice(0, 4)
    };
  }
}

export async function* runFolderAgentBatch(
  input: FolderAgentInput
): AsyncGenerator<FolderAgentUpdate, FolderAgentReport[]> {
  const groups = buildFolderGroups(input);
  const reports: FolderAgentReport[] = [];
  const maxParallel = limitedParallelAgents();
  let nextIndex = 0;
  const active = new Set<{
    index: number;
    group: FolderGroup;
    provider: FolderAgentReport["provider"];
    model?: string;
    promise: Promise<FolderAgentReport>;
  }>();

  while (active.size || nextIndex < groups.length) {
    while (active.size < maxParallel && nextIndex < groups.length) {
      const group = groups[nextIndex];
      const status = getAiStatus({
        providerChoice: input.providerChoice,
        task: "folder-agent",
        taskIndex: nextIndex
      });
      const task = {
        index: nextIndex,
        group,
        provider: status.provider,
        model: status.model,
        promise: analyzeFolder(group, input.providerChoice, nextIndex)
      };

      active.add(task);
      nextIndex += 1;

      yield {
        kind: "started",
        folder: group.folder,
        index: task.index + 1,
        total: groups.length,
        provider: status.provider,
        model: status.model
      };
    }

    if (!active.size) {
      break;
    }

    const finished = await Promise.race(
      Array.from(active).map((task) =>
        task.promise.then((report) => ({
          task,
          report
        }))
      )
    );

    active.delete(finished.task);
    reports[finished.task.index] = finished.report;

    yield {
      kind: "completed",
      folder: finished.task.group.folder,
      index: finished.task.index + 1,
      total: groups.length,
      provider: finished.report.provider,
      model: finished.report.model,
      report: finished.report
    };
  }

  return reports.filter(Boolean);
}
