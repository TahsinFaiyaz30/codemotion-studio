"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const choices = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
] as const;

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1" aria-label="Theme choice">
      {choices.map((choice) => {
        const Icon = choice.icon;
        const active = mounted && theme === choice.value;

        return (
          <button
            key={choice.value}
            type="button"
            onClick={() => setTheme(choice.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:text-primary-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

