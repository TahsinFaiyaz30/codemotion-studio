"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  ViewportPortal,
  type Edge as FlowEdge,
  type Node as FlowNode,
  useEdgesState,
  useNodesState
} from "@xyflow/react";
import { useEffect, useMemo } from "react";
import type { CodeEdge, CodeNode } from "@/lib/types/analysis";

const kindColumns: Record<CodeNode["kind"], number> = {
  repo: 0,
  folder: 1,
  page: 1,
  component: 2,
  hook: 3,
  utility: 3,
  api: 4,
  controller: 4,
  service: 5,
  model: 6,
  database: 6,
  config: 2,
  external: 7
};

function nodeColor(kind: CodeNode["kind"]) {
  if (kind === "api" || kind === "service") return "var(--accent)";
  if (kind === "model" || kind === "database") return "var(--warning)";
  if (kind === "external") return "var(--primary)";
  return "var(--border)";
}

function flowSafeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "__");
}

export function CodeFlowGraph({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode
}: {
  nodes: CodeNode[];
  edges: CodeEdge[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}) {
  const flowNodes = useMemo<FlowNode[]>(
    () => {
      const rowByColumn = new Map<number, number>();

      return nodes.map((node, index) => {
        const column = kindColumns[node.kind] ?? 1;
        const row = rowByColumn.get(column) ?? 0;
        rowByColumn.set(column, row + 1);

        return {
          id: flowSafeId(node.id),
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          position: {
            x: column * 245,
            y: row * 128 + (index % 2) * 18
          },
          width: 178,
          height: node.path ? 80 : 62,
          measured: {
            width: 178,
            height: node.path ? 80 : 62
          },
          data: {
            originalId: node.id,
            label: (
              <div className="min-w-36 max-w-44">
                <div className="truncate text-[10px] font-black uppercase text-muted-foreground">
                  {node.kind}
                </div>
                <div className="mt-1 truncate text-sm font-black">{node.label}</div>
                {node.path ? (
                  <div className="mt-1 truncate text-[10px] text-muted-foreground">{node.path}</div>
                ) : null}
              </div>
            )
          },
          style: {
            borderRadius: 8,
            border: `1px solid ${selectedNodeId === node.id ? "var(--primary)" : nodeColor(node.kind)}`,
            background: "var(--card)",
            color: "var(--foreground)",
            boxShadow:
              selectedNodeId === node.id
                ? "0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent)"
                : "0 10px 26px color-mix(in oklab, var(--foreground) 10%, transparent)",
            padding: 10
          }
        };
      });
    },
    [nodes, selectedNodeId]
  );
  const nodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);
  const flowEdges = useMemo<FlowEdge[]>(
    () =>
      edges
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map((edge) => ({
          id: flowSafeId(edge.id),
          source: flowSafeId(edge.source),
          target: flowSafeId(edge.target),
          animated: edge.confidence > 0.7,
          style: {
            stroke: edge.type.includes("db") ? "var(--warning)" : "var(--primary)",
            strokeWidth: 2
          }
        })),
    [edges, nodeIds]
  );
  const [renderNodes, setRenderNodes, onNodesChange] = useNodesState(flowNodes);
  const [renderEdges, setRenderEdges, onEdgesChange] = useEdgesState(flowEdges);
  const layoutById = useMemo(
    () =>
      new Map(
        flowNodes.map((node) => [
          node.id,
          {
            x: node.position.x,
            y: node.position.y,
            width: typeof node.width === "number" ? node.width : 178,
            height: typeof node.height === "number" ? node.height : 74
          }
        ])
      ),
    [flowNodes]
  );

  useEffect(() => {
    setRenderNodes(flowNodes);
    setRenderEdges(flowEdges);
  }, [flowEdges, flowNodes, setRenderEdges, setRenderNodes]);

  return (
    <div className="graph-canvas" data-edge-count={flowEdges.length} data-node-count={flowNodes.length}>
      <ReactFlow
        nodes={renderNodes}
        edges={renderEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.15}
        maxZoom={1.6}
        onNodeClick={(_, node) => {
          const originalId = node.data.originalId;
          if (typeof originalId === "string") {
            onSelectNode(originalId);
          }
        }}
      >
        <ViewportPortal>
          <svg
            className="codemotion-flow-edges"
            width="1900"
            height="1400"
            viewBox="0 0 1900 1400"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 0
            }}
            aria-hidden="true"
          >
            {flowEdges.map((edge, index) => {
              const source = layoutById.get(edge.source);
              const target = layoutById.get(edge.target);

              if (!source || !target) {
                return null;
              }

              const x1 = source.x + source.width;
              const y1 = source.y + source.height / 2;
              const x2 = target.x;
              const y2 = target.y + target.height / 2;
              const middle = Math.max(70, Math.abs(x2 - x1) / 2);
              const d = `M ${x1} ${y1} C ${x1 + middle} ${y1}, ${x2 - middle} ${y2}, ${x2} ${y2}`;

              return (
                <path
                  key={edge.id}
                  d={d}
                  fill="none"
                  stroke={index % 3 === 0 ? "var(--accent)" : "var(--primary)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={edge.animated ? "8 6" : undefined}
                  opacity="0.72"
                />
              );
            })}
          </svg>
        </ViewportPortal>
        <Background color="var(--border)" gap={28} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node) =>
            selectedNodeId === node.id ? "var(--primary)" : "var(--muted-foreground)"
          }
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
