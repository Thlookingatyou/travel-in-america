import type { Metadata } from "next";
import { requestBaseUrl } from "../metadata-url";
import HistoryPageClient from "./HistoryPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await requestBaseUrl();
  const title = "These places are very ‘American’ — Travel in America";
  const description = "A scrollable journey through 24 places where American history was made, from Cahokia to the civil rights movement and beyond.";
  const socialImage = new URL("/history/history-cover.jpg", baseUrl).toString();
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: new URL("/history", baseUrl), images: [{ url: socialImage, width: 1280, height: 859, alt: "John Trumbull’s Declaration of Independence painting" }] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export default function HistoryPage() {
  return <HistoryPageClient />;
}
