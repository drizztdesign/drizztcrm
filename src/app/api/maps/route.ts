import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GMAPS = "https://maps.googleapis.com/maps/api";

async function gmapsFetch(url: string): Promise<unknown> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`gmaps ${r.status}`);
  return r.json();
}

export async function GET(request: Request) {
  // Auth gate — only signed-in CRM users can hit Google Maps via this proxy
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "geocode") {
      const address = searchParams.get("address") ?? "";
      const data = await gmapsFetch(`${GMAPS}/geocode/json?address=${encodeURIComponent(address)}&key=${key}`);
      return NextResponse.json(data);
    }
    if (action === "nearbysearch") {
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      const radius = searchParams.get("radius") ?? "3000";
      const keyword = searchParams.get("keyword") ?? "";
      const data = await gmapsFetch(
        `${GMAPS}/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${key}`
      );
      return NextResponse.json(data);
    }
    if (action === "pagetoken") {
      const token = searchParams.get("pagetoken") ?? "";
      const data = await gmapsFetch(`${GMAPS}/place/nearbysearch/json?pagetoken=${encodeURIComponent(token)}&key=${key}`);
      return NextResponse.json(data);
    }
    if (action === "placedetails") {
      const placeId = searchParams.get("place_id") ?? "";
      const data = await gmapsFetch(
        `${GMAPS}/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,formatted_phone_number,rating,user_ratings_total,business_status,types,vicinity&key=${key}`
      );
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "unknown" }, { status: 502 });
  }
}
