import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resumint — Tailor your resume with AI",
  description:
    "Role-specific resumes that pass ATS and get you noticed. Built for NSUT students.",
  openGraph: {
    title: "Resumint",
    description: "AI-powered resume tailoring for students.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
      <body className="antialiased bg-surface text-content">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--card)",
                color: "var(--content)",
                border: "1px solid var(--edge)",
                borderRadius: "var(--radius-lg)",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
