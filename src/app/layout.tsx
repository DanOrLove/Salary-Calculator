import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalaryCalculator — личный кабинет сотрудника",
  description:
    "Учёт смен, продаж и автоматический расчёт выплат: график 2/2 или 3/3, процент от продаж и сумма выхода.",
  applicationName: "SalaryCalculator",
};

export const viewport: Viewport = {
  themeColor: "#0b0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const THEME_SCRIPT = [
  "(function(){",
  "try{",
  "var k='salarycalc.theme.v1';",
  "var t=localStorage.getItem(k);",
  "if(t!=='light'&&t!=='dark'){",
  "t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';",
  "}",
  "document.documentElement.dataset.theme=t;",
  "document.documentElement.style.colorScheme=t;",
  "}catch(e){",
  "document.documentElement.dataset.theme='dark';",
  "}",
  "})();",
].join("");

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-ink-950 text-mist-100 antialiased">
        <div aria-hidden className="glow-field pointer-events-none fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
