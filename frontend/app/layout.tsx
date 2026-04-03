import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/navbar";
import { Toaster } from "@/components/ui/sonner"
import { Inter } from '@next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Moffitt Status",
  description: "Berkeley's trusted library status platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "bg-white border-4 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] p-4 gap-4",
              title: "text-slate-900 font-black text-sm tracking-wide",
              description: "text-slate-500 text-xs font-bold",
              actionButton: "bg-indigo-500 text-white border-2 border-slate-900 rounded-xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[2px] hover:shadow-none transition-all",
              cancelButton: "bg-white text-slate-700 border-2 border-slate-200 rounded-xl font-black hover:border-slate-900 hover:text-slate-900 transition-colors",
              success: "!border-green-400 !text-green-600 bg-white",
              error: "!border-rose-400 !text-rose-600 bg-white",
              info: "!border-sky-400 !text-sky-600 bg-white",
              loading: "!border-indigo-200 !text-indigo-600 bg-white",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
