import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budge-it",
  description: "A simple budget tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} h-screen flex flex-col overflow-hidden`}>
          <Navbar />
          <main className="flex-1 overflow-hidden bg-background">
             {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}