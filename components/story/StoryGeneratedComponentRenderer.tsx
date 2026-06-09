import { Badge } from "@/components/ui/badge";
import type { StoryAnimationComponentSpec } from "@/lib/types/analysis";

export function StoryGeneratedComponentRenderer({
  spec
}: {
  spec: StoryAnimationComponentSpec;
}) {
  return (
    <article className="rounded-md border border-border bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{spec.componentType}</Badge>
        <Badge>{spec.animation.motion}</Badge>
      </div>
      <h4 className="mt-3 font-black">{spec.name}</h4>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{spec.purpose}</p>
    </article>
  );
}

