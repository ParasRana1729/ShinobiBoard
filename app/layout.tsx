import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShinobiBoard — LeetCode accountability board",
  description:
    "LeetCode progress dashboard with friend groups, Trello-style people-cards, streaks, ranks and weekly titles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-7xl px-4 pb-16">{children}</div>
      </body>
    </html>
  );
}
