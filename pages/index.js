import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Head>
        <title>The Abledge</title>
        <meta property="og:title" content="The Abledge" key="title" />
      </Head>
      <h1 className="text-6xl font-bold block">
        The Abledge
      </h1>
    </div>
  );
}
