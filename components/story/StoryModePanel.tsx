"use client";

import { BookOpen, Clapperboard } from "lucide-react";
import { useEffect, useState } from "react";
import { StoryControls } from "@/components/story/StoryControls";
import { StorySceneRenderer } from "@/components/story/StorySceneRenderer";
import { Badge } from "@/components/ui/badge";
import type { CodebaseStory, StoryAnimationComponentSpec } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

export function StoryModePanel({
  story,
  storyComponents
}: {
  story: CodebaseStory;
  storyComponents: StoryAnimationComponentSpec[];
}) {
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const activeScene = story.scenes[activeSceneIndex] ?? story.scenes[0];

  useEffect(() => {
    if (!playing || story.scenes.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveSceneIndex((index) => (index + 1) % story.scenes.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [playing, story.scenes.length]);

  function nextScene() {
    setActiveSceneIndex((index) => (index + 1) % story.scenes.length);
  }

  function previousScene() {
    setActiveSceneIndex((index) => (index - 1 + story.scenes.length) % story.scenes.length);
  }

  function restart() {
    setActiveSceneIndex(0);
    setPlaying(true);
  }

  if (!activeScene) {
    return (
      <section className="panel rounded-lg p-5">
        <h2 className="font-black">Story Mode</h2>
        <p className="mt-2 text-sm text-muted-foreground">No story scenes were generated.</p>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden rounded-lg">
      <div className="border-b border-border bg-card p-4">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge>Story Mode</Badge>
                <Badge>{story.scenes.length} scenes</Badge>
              </div>
              <h2 className="text-2xl font-black">{story.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{story.subtitle}</p>
            </div>
          </div>
          <StoryControls
            playing={playing}
            onToggle={() => setPlaying((value) => !value)}
            onNext={nextScene}
            onPrevious={previousScene}
            onRestart={restart}
          />
        </div>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">What this app is</p>
          <p className="mt-2 text-sm leading-6">{story.normalPersonSummary}</p>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Why it exists</p>
          <p className="mt-2 text-sm leading-6">{story.whyItExists}</p>
        </div>
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Who uses it</p>
          <p className="mt-2 text-sm leading-6">{story.whoUsesThis.join(", ")}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-y border-border bg-background/70 p-4">
        {story.scenes.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            onClick={() => setActiveSceneIndex(index)}
            className={cn(
              "min-w-44 rounded-md border border-border bg-background p-3 text-left text-sm transition hover:border-primary",
              activeScene.id === scene.id && "border-primary bg-primary/10"
            )}
          >
            <span className="block text-xs font-bold text-muted-foreground">Scene {scene.sceneNumber}</span>
            <span className="mt-1 block font-black">{scene.title}</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge>
            <Clapperboard className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Scene Theater
          </Badge>
          {story.world?.hero ? <Badge>Hero: {story.world.hero}</Badge> : null}
          {story.world?.setting ? <Badge>{story.world.setting}</Badge> : null}
        </div>
        <StorySceneRenderer scene={activeScene} worldMotifs={story.world?.visualMotifs ?? []} />
      </div>

      <div className="border-t border-border p-4">
        <div className="rounded-md border border-border bg-background p-4">
          <p className="text-xs font-bold uppercase text-muted-foreground">Story arc</p>
          <div className="mt-3 grid gap-2 text-sm leading-6 md:grid-cols-2">
            <p><strong>Opening:</strong> {story.storyArc.opening}</p>
            <p><strong>Problem:</strong> {story.storyArc.problem}</p>
            <p><strong>Journey:</strong> {story.storyArc.journey}</p>
            <p><strong>Resolution:</strong> {story.storyArc.resolution}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
