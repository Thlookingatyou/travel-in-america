import type { Metadata } from "next";
import "./globals.css";
import { FavoritesProvider } from "./favorites";
import { requestBaseUrl } from "./metadata-url";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await requestBaseUrl();
  const title = "Travel in America — an atlas for curious travelers";
  const description = "Explore all 50 states, their capitals, biggest cities, historic places, and ideas for your next trip.";
  const socialImage = new URL("/og.png", baseUrl).toString();
  return {
    metadataBase: baseUrl,
    title,
    description,
    icons: { icon: "/favicon.svg" },
    openGraph: { title, description, type: "website", url: baseUrl, siteName: "Travel in America", images: [{ url: socialImage, width: 1536, height: 1024, alt: "Travel in America — History happened somewhere." }] },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>
    <FavoritesProvider>{children}</FavoritesProvider>
    <a
      className="github-repository-link"
      href="https://github.com/Thlookingatyou/travel-in-america"
      target="_blank"
      rel="noreferrer"
      aria-label="Open the Travel in America GitHub repository"
      title="View this project on GitHub"
    >
      <span aria-hidden="true" />
    </a>
  </body></html>;
}
