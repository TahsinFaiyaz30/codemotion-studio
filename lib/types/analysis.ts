export type AnalysisMode = "fast" | "balanced" | "deep" | "huge";

export type StreamEventType =
  | "stage"
  | "log"
  | "warning"
  | "partial"
  | "ai_activity"
  | "component_generation"
  | "final"
  | "error";

export type AnalysisStage =
  | "validating_github_url"
  | "fetching_repo_metadata"
  | "fetching_repo_tree"
  | "planning_huge_repo_strategy"
  | "selecting_important_files"
  | "fetching_file_contents"
  | "parsing_ast"
  | "detecting_stack"
  | "mapping_imports"
  | "building_file_graph"
  | "detecting_routes"
  | "detecting_flows"
  | "synthesizing_runtime_flows"
  | "extracting_design_dna"
  | "grouping_feature_clusters"
  | "compressing_context"
  | "running_ai_cluster_summaries"
  | "generating_story_mode"
  | "planning_story_components"
  | "generating_story_component_specs"
  | "composing_visualization"
  | "generating_dynamic_components"
  | "generating_prompts"
  | "saving_result"
  | "done";

export interface AnalysisStreamEvent {
  type: StreamEventType;
  stage: AnalysisStage;
  message: string;
  progress: number;
  details?: Record<string, unknown>;
}

export interface RepoFile {
  path: string;
  content?: string;
  size: number;
  extension: string;
  selected: boolean;
  score?: number;
  sha?: string;
  downloadUrl?: string;
  skippedReason?: string;
}

export interface ParsedFileAst {
  path: string;
  language: string;
  imports: string[];
  exports: string[];
  functions: string[];
  components: string[];
  hooks: string[];
  apiHandlers: string[];
  jsxUses: string[];
  calls: string[];
  envVars: string[];
  dbSignals: string[];
  authSignals: string[];
  errors: string[];
}

export interface DesignDNA {
  colors: string[];
  typography: string[];
  spacing: string[];
  radius: string[];
  componentPatterns: string[];
  animationPatterns: string[];
  themeStrategy: string;
  visualTone: string;
  detectedLibraries: string[];
}

export type CodeNodeKind =
  | "repo"
  | "folder"
  | "page"
  | "component"
  | "api"
  | "controller"
  | "service"
  | "model"
  | "database"
  | "config"
  | "hook"
  | "utility"
  | "external";

export interface CodeNode {
  id: string;
  label: string;
  path?: string;
  kind: CodeNodeKind;
  group?: string;
  importance: number;
  summary?: string;
}

export type CodeEdgeType =
  | "imports"
  | "renders"
  | "calls"
  | "api-call"
  | "db-read"
  | "db-write"
  | "uses-config"
  | "feature-link";

export interface CodeEdge {
  id: string;
  source: string;
  target: string;
  type: CodeEdgeType;
  reason: string;
  confidence: number;
}

export interface FlowStep {
  id: string;
  label: string;
  nodeId: string;
  role: string;
  detail: string;
}

export interface FlowScenario {
  id: string;
  name: string;
  summary: string;
  steps: FlowStep[];
}

export type RuntimeFlowActor =
  | "visitor"
  | "user"
  | "admin"
  | "seller"
  | "buyer"
  | "developer"
  | "system"
  | "unknown";

export type RuntimeFlowStepLayer =
  | "user"
  | "screen"
  | "component"
  | "state"
  | "api"
  | "validation"
  | "service"
  | "database"
  | "external"
  | "response"
  | "ui-update";

export type RuntimeFlowVisualHint =
  | "click"
  | "type"
  | "submit"
  | "loading"
  | "request"
  | "database-save"
  | "response"
  | "redirect"
  | "render"
  | "notification";

export interface RuntimeFlowStep {
  order: number;
  layer: RuntimeFlowStepLayer;
  title: string;
  plainEnglish: string;
  technical: string;
  filePaths: string[];
  nodeIds: string[];
  edgeIds: string[];
  visualHint: RuntimeFlowVisualHint;
}

export interface RuntimeFlow {
  id: string;
  name: string;
  plainEnglishName: string;
  purpose: string;
  actor: RuntimeFlowActor;
  trigger: string;
  userGoal: string;
  startsAt: string;
  endsAt: string;
  steps: RuntimeFlowStep[];
  businessMeaning: string;
  beginnerExplanation: string;
  confidence: number;
}

export type StoryAnimationType =
  | "hero-intro"
  | "ui-click"
  | "data-travel"
  | "api-tunnel"
  | "database-pulse"
  | "stack-reveal"
  | "feature-tour"
  | "before-after"
  | "problem-solution"
  | "ending";

export interface CodebaseStoryScene {
  id: string;
  sceneNumber: number;
  title: string;
  narration: string;
  whatUserSees: string;
  whatUserDoes: string;
  whatAppDoesBehindScenes: string;
  relatedRuntimeFlowId: string;
  relatedFiles: string[];
  animationType: StoryAnimationType;
  componentsNeeded: string[];
  durationHintSeconds: number;
}

export interface CodebaseStory {
  id: string;
  title: string;
  subtitle: string;
  normalPersonSummary: string;
  whoUsesThis: string[];
  whyItExists: string;
  mainProblemSolved: string;
  storyArc: {
    opening: string;
    problem: string;
    journey: string;
    resolution: string;
  };
  scenes: CodebaseStoryScene[];
  ending: string;
  developerTakeaway: string;
  nonTechnicalTakeaway: string;
}

export type StoryComponentType =
  | "animated-card"
  | "phone-mockup"
  | "browser-window"
  | "data-packet"
  | "api-tunnel"
  | "database-orb"
  | "user-avatar"
  | "stack-badge"
  | "timeline-step"
  | "flow-map"
  | "feature-spotlight"
  | "custom";

export type StoryMotionType =
  | "fade"
  | "slide"
  | "scale"
  | "packet-travel"
  | "pulse"
  | "orbit"
  | "morph"
  | "reveal"
  | "typewriter";

export interface StoryAnimationComponentSpec {
  name: string;
  purpose: string;
  sceneId: string;
  matchesDesignDNA: boolean;
  componentType: StoryComponentType;
  props: Record<string, unknown>;
  layout: Record<string, unknown>;
  animation: {
    motion: StoryMotionType;
    duration: number;
    sequenceOrder: number;
  };
  responsiveBehavior: string;
  accessibilityNotes: string[];
}

export interface PromptCard {
  id: string;
  title: string;
  body: string;
}

export interface FeatureCluster {
  id: string;
  name: string;
  summary: string;
  files: string[];
  nodeIds: string[];
}

export interface ComponentSpecProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ComponentSpecElement {
  type:
    | "text"
    | "button"
    | "badge"
    | "icon"
    | "card"
    | "input"
    | "textarea"
    | "tabs"
    | "progress"
    | "list"
    | "image"
    | "divider";
  content: string;
  className: string;
  animation?: string;
}

export interface ComponentSpec {
  name: string;
  purpose: string;
  responsive_behavior: string;
  design_notes: string;
  props: ComponentSpecProp[];
  layout: {
    type:
      | "card"
      | "section"
      | "modal"
      | "form"
      | "dashboard"
      | "navbar"
      | "table"
      | "timeline"
      | "empty-state"
      | "custom";
    className: string;
    children: unknown[];
  };
  elements: ComponentSpecElement[];
  tsx_code?: string;
  tailwind_classes_used: string[];
  accessibility_notes: string[];
}

export interface AnalysisStats {
  totalFiles: number;
  filesScanned: number;
  filesSelected: number;
  filesSkipped: number;
  astParsedFiles: number;
  aiAnalyzedClusters: number;
  estimatedContextSaved: number;
}

export interface AnalysisResult {
  id: string;
  repoName: string;
  repoUrl: string;
  branch: string;
  mode: AnalysisMode;
  createdAt: string;
  summary: string;
  stats: AnalysisStats;
  warnings: string[];
  files: RepoFile[];
  parsedFiles: ParsedFileAst[];
  clusters: FeatureCluster[];
  stack: Array<{
    name: string;
    signal: string;
    confidence: number;
  }>;
  designDNA: DesignDNA;
  nodes: CodeNode[];
  edges: CodeEdge[];
  flows: FlowScenario[];
  runtimeFlows: RuntimeFlow[];
  story: CodebaseStory;
  storyComponents: StoryAnimationComponentSpec[];
  prompts: PromptCard[];
  componentSpec: ComponentSpec;
}
