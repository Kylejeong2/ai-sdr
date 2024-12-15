import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google'


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Graham",
  description: "AI phone agents for growing businesses",
  icons: {
    icon:['/favicon.ico'],
    apple:['/apple-touch-icon.png'],
    shortcut:['/apple-touch-icon.png'],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider afterSignOutUrl="/">
          <body className={`${inter.className}`}>
            {children}
          </body>
        </ClerkProvider>
      </body>
    </html>
  );
}