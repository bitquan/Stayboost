import { json } from "@remix-run/node";
import { getPopupSettings } from "../models/popupSettings.server";

// Public endpoint: returns settings for a given shop
export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400, headers: corsHeaders(request) });
  }

  try {
    const settings = await getPopupSettings(shop);
    return json({ shop, settings }, { headers: corsHeaders(request) });
  } catch (e) {
    return json({ error: "Failed to load settings" }, { status: 500, headers: corsHeaders(request) });
  }
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
  };
}

export function headers() {
  return {
    "Cache-Control": "max-age=60, s-maxage=300, stale-while-revalidate=600",
  };
}

export function action() {
  return json({ error: "Method not allowed" }, { status: 405 });
}

export function unstable_shouldReload() {
  return false;
}
