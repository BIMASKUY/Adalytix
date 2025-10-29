import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snowflake Next.js POC",
  description: "POC for querying Snowflake and visualizing data",
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
