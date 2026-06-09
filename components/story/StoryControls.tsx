"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StoryControls({
  playing,
  onToggle,
  onNext,
  onPrevious,
  onRestart
}: {
  playing: boolean;
  onToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={onPrevious}>
        <SkipBack className="h-4 w-4" aria-hidden="true" />
        Previous
      </Button>
      <Button variant="primary" size="sm" onClick={onToggle}>
        {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        {playing ? "Pause" : "Play"}
      </Button>
      <Button variant="outline" size="sm" onClick={onNext}>
        <SkipForward className="h-4 w-4" aria-hidden="true" />
        Next
      </Button>
      <Button variant="secondary" size="sm" onClick={onRestart}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Restart
      </Button>
    </div>
  );
}

