import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Travel in America — an atlas for curious travelers", description:"Explore all 50 states, their capitals, biggest cities, and ideas for your next trip.", icons:{icon:"/favicon.svg"} };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
