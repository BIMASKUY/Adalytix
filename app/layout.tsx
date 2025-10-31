import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snowflake Chat Assistant",
  description: "Chat with your Snowflake data using natural language queries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
