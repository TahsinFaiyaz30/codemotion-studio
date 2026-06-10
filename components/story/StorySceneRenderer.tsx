"use client";

import { motion } from "framer-motion";
import { StoryThreeStage } from "@/components/story/StoryThreeStage";
import { Badge } from "@/components/ui/badge";
import type { CodebaseStoryScene } from "@/lib/types/analysis";

export function StorySceneRenderer({
  scene,
  worldMotifs = []
}: {
  scene: CodebaseStoryScene;
  worldMotifs?: string[];
}) {
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

      <div>
        <StoryThreeStage scene={scene} worldMotifs={worldMotifs} />
      </div>
    </motion.article>
  );
}
