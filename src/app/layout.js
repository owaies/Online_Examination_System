import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "E-Examiner | Smart Online Examination System",
  description: "E-Examiner is a modern, secure, and smart online examination and assessment platform. Create timed exams, auto-grade quizzes, and track performance with real-time analytics.",
  keywords: [
    "E-Examiner", "e examiner", "e-examiner", 
    "E-Examiner online examination system", "online examination system", 
    "online exam platform", "digital examination system", 
    "online assessment platform", "exam management system", 
    "secure online examination", "automated exam evaluation", 
    "student examination portal", "AI-powered online examination system"
  ],
  metadataBase: new URL("https://e-examiner.vercel.app"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "E-Examiner | Smart Online Examination System",
    description: "E-Examiner is a modern, secure, and smart online examination and assessment platform. Create timed exams, auto-grade quizzes, and track performance with real-time analytics.",
    url: "https://e-examiner.vercel.app",
    siteName: "E-Examiner",
    images: [
      {
        url: "/hero-bg.png",
        width: 1200,
        height: 630,
        alt: "E-Examiner Online Examination System"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "E-Examiner | Smart Online Examination System",
    description: "E-Examiner is a modern, secure, and smart online examination and assessment platform. Create timed exams, auto-grade quizzes, and track performance with real-time analytics.",
    images: ["/hero-bg.png"],
  },
  verification: {
    google: "4fFGBwEGAk14Q7Gapq_gcGn_9d02NDnBlHYpAwviPqs",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
