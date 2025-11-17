import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AuthProvider } from "../lib/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Digital Dungeons",
  description:
    "Platform for creating and playing text-based RPG games",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
