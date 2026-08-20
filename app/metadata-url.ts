import { headers } from "next/headers";

const productionUrl = "https://travel-in-america.thlookingatyou.chatgpt.site";

export async function requestBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  try {
    return host ? new URL(`${protocol}://${host}`) : new URL(productionUrl);
  } catch {
    return new URL(productionUrl);
  }
}
