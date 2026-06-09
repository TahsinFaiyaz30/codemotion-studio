"use client";

import { motion } from "framer-motion";
import { Database, MousePointerClick, Server, Sparkles, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CodebaseStoryScene, StoryAnimationComponentSpec } from "@/lib/types/analysis";

function iconForScene(animationType: CodebaseStoryScene["animationType"]) {
  if (animationType === "database-pulse") return Database;
  if (animationType === "api-tunnel") return Server;
  if (animationType === "ui-click") return MousePointerClick;
  if (animationType === "hero-intro") return UserRound;
  return Sparkles;
}

export function StorySceneRenderer({
  scene,
  componentSpecs
}: {
  scene: CodebaseStoryScene;
  componentSpecs: StoryAnimationComponentSpec[];
}) {
  const Icon = iconForScene(scene.animationType);

  return (
    <motion.article
      key={scene.id}
      className="grid gap-4 rounded-lg border border-border bg-background p-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,1.05fr)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge>Scene {scene.sceneNumber}</Badge>
          <Badge>{scene.animationType}</Badge>
        </div>
        <h3 className="text-2xl font-black">{scene.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{scene.narration}</p>

        <div className="mt-5 grid gap-3">
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">What the user sees</p>
            <p className="mt-1 text-sm">{scene.whatUserSees}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">What the user does</p>
            <p className="mt-1 text-sm">{scene.whatUserDoes}</p>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Behind the scenes</p>
            <p className="mt-1 text-sm leading-6">{scene.whatAppDoesBehindScenes}</p>
          </div>
        </div>
      </div>

      <div className="relative min-h-80 overflow-hidden rounded-lg border border-border bg-card p-4">
        <div className="absolute inset-x-4 top-4 flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="ml-2 truncate text-xs text-muted-foreground">{scene.title}</span>
        </div>
        <div className="mt-16 grid place-items-center rounded-lg border border-border bg-background p-8 text-center">
          <motion.div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            animate={{
              scale: scene.animationType === "database-pulse" ? [1, 1.08, 1] : 1,
              x: scene.animationType === "data-travel" || scene.animationType === "api-tunnel" ? [-20, 20, -20] : 0
            }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
          </motion.div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">{scene.whatAppDoesBehindScenes}</p>
        </div>
        {componentSpecs.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {componentSpecs.slice(0, 2).map((spec) => (
              <div key={spec.name} className="rounded-md border border-border bg-background p-3">
                <p className="text-xs font-bold">{spec.componentType}</p>
                <p className="mt-1 text-xs text-muted-foreground">{spec.animation.motion}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

