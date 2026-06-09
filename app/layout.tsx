import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeMotion Studio",
  description: "Animated AI codebase visualizer with streaming repository analysis."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <main className="studio-shell">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
