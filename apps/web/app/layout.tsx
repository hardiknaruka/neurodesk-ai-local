import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroDesk AI — Knowledge Workspace",
  description: "AI Notebook + Chatbot + Memory + Multi-Agent + Knowledge Graph",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="h-screen w-screen overflow-hidden bg-brand-white text-brand-navy antialiased">
        {children}
      </body>
    </html>
  );
}
