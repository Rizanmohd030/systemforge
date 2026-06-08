import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DBSyncProvider } from "@/components/DBSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SystemForge",
  description: "AI-powered system design workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* DBSyncProvider must be inside AuthProvider to access useSession() */}
          <DBSyncProvider>
            {children}
          </DBSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
