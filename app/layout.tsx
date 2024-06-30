import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import "./globals.scss";

const exo = Exo_2({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Circle9 Solver",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={exo.className}>{children}</body>
    </html>
  );
}
