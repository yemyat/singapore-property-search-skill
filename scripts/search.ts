// Singapore Property Search - 99.co + PropertyGuru
// Run with: bun run search.ts

interface SearchParams {
  listingType: "rent" | "sale";
  propertyType: "condo" | "hdb" | "landed" | "all";
  queryType: "subway_station" | "zone" | "district" | "none";
  queryId: string; // e.g., "sg-mrt-orchard", "zobukit_panjang", "dtdistrict09"
  freetext?: string; // For PropertyGuru search
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minSize?: number; // sqft - filtered client-side
  maxWalkMins?: number; // filtered client-side
  pageSize?: number;
}

interface Listing {
  source: "99.co" | "PropertyGuru";
  id: string;
  address: string;
  project?: string;
  price: number;
  priceFormatted: string;
  beds: number;
  bedsFormatted: string;
  baths?: number;
  bathsFormatted?: string;
  size?: number;
  sizeFormatted?: string;
  type?: string;
  posted?: string;
  walkTime?: number;
  nearestMrt?: string;
  agentName?: string;
  agentPhone?: string;
  url: string;
}

// 99.co API - uses Accept: application/json header
async function search99co(params: SearchParams): Promise<Listing[]> {
  const queryParams = new URLSearchParams({
    listing_type: params.listingType,
    property_segments: "residential",
    sort_by: "recency",
    sort_order: "desc",
    page_size: String(params.pageSize || 50),
  });

  if (params.propertyType !== "all") {
    queryParams.set("main_category", params.propertyType);
  }

  if (params.listingType === "rent") {
    queryParams.set("rental_type", "unit");
  }

  if (params.queryType !== "none" && params.queryId) {
    queryParams.set("query_type", params.queryType);
    queryParams.set("query_ids", params.queryId);
  }

  if (params.minPrice) queryParams.set("price_min", String(params.minPrice));
  if (params.maxPrice) queryParams.set("price_max", String(params.maxPrice));
  if (params.minBedrooms) queryParams.set("bedrooms_min", String(params.minBedrooms));
  if (params.maxBedrooms) queryParams.set("bedrooms_max", String(params.maxBedrooms));

  const url = `https://www.99.co/api/v10/web/search/listings?${queryParams}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    console.error(`99.co API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  let listings = data?.data?.sections?.[0]?.listings || [];

  // Client-side filters
  if (params.minSize || params.maxWalkMins) {
    listings = listings.filter((l: any) => {
      const size = l.attributes?.area_size || 0;
      const walkTime = l.within_distance_from_query?.closest_mrt?.walking_time_in_mins;
      if (params.minSize && size < params.minSize) return false;
      if (params.maxWalkMins && (!walkTime || walkTime > params.maxWalkMins)) return false;
      return true;
    });
  }

  return listings.map((l: any) => ({
    source: "99.co" as const,
    id: l.id,
    address: l.address_line_1,
    project: l.project_name,
    price: l.attributes?.price || 0,
    priceFormatted: l.attributes?.price_formatted || "",
    beds: l.attributes?.bedrooms || 0,
    bedsFormatted: l.attributes?.bedrooms_formatted || "",
    baths: l.attributes?.bathrooms,
    bathsFormatted: l.attributes?.bathrooms_formatted,
    size: l.attributes?.area_size,
    sizeFormatted: l.attributes?.area_size_formatted,
    posted: l.date_formatted,
    walkTime: l.within_distance_from_query?.closest_mrt?.walking_time_in_mins,
    nearestMrt: l.within_distance_from_query?.closest_mrt?.title,
    agentName: l.user?.name,
    agentPhone: l.user?.phone,
    url: `https://www.99.co${l.listing_url}`,
  }));
}

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

// PropertyGuru - uses mobile User-Agent to bypass Cloudflare
async function searchPropertyGuru(params: SearchParams): Promise<Listing[]> {
  // Build URL based on property type and listing type
  let urlPath = "property";
  if (params.propertyType !== "all") {
    urlPath = params.propertyType;
  }
  
  const url = new URL(`https://www.propertyguru.com.sg/${urlPath}-for-${params.listingType}`);
  
  // Use freetext for location search (PropertyGuru doesn't support query_ids)
  if (params.freetext) {
    url.searchParams.set("freetext", params.freetext);
  }
  if (params.minPrice) url.searchParams.set("minprice", String(params.minPrice));
  if (params.maxPrice) url.searchParams.set("maxprice", String(params.maxPrice));
  if (params.minBedrooms) url.searchParams.set("beds", String(params.minBedrooms));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": MOBILE_UA },
    redirect: "follow",
  });

  if (!res.ok) {
    console.error(`PropertyGuru error: ${res.status}`);
    return [];
  }

  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (!match) {
    console.error("PropertyGuru: Could not find __NEXT_DATA__");
    return [];
  }

  const nextData = JSON.parse(match[1]);
  let listingsData = nextData?.props?.pageProps?.pageData?.data?.listingsData || [];

  // Client-side filters
  listingsData = listingsData.filter((item: any) => {
    const l = item.listingData;
    const mrtText = l?.mrt?.nearbyText || "";
    const minMatch = mrtText.match(/(\d+)\s*min/);
    const walkTime = minMatch ? parseInt(minMatch[1], 10) : null;
    
    if (params.maxWalkMins && (!walkTime || walkTime > params.maxWalkMins)) return false;
    return true;
  });

  return listingsData.map((item: any) => {
    const l = item.listingData;
    const mrtText = l?.mrt?.nearbyText || "";
    const minMatch = mrtText.match(/(\d+)\s*min/);
    const walkTime = minMatch ? parseInt(minMatch[1], 10) : null;
    const priceValue = l?.price?.value || 0;
    const priceText = l?.price?.pretty || l?.headline?.priceText || "";
    const bedsText = l?.listingFeatures?.[0]?.[0]?.text || "";
    const bathsText = l?.listingFeatures?.[0]?.[1]?.text || "";
    const sizeText = l?.listingFeatures?.[1]?.text || "";
    const typeText = l?.listingFeatures?.[2]?.text || "";

    return {
      source: "PropertyGuru" as const,
      id: String(l?.id || ""),
      address: l?.fullAddress || "",
      project: l?.localizedTitle || "",
      price: priceValue,
      priceFormatted: priceText,
      beds: parseInt(bedsText) || 0,
      bedsFormatted: bedsText ? `${bedsText} Beds` : "",
      baths: parseInt(bathsText) || undefined,
      bathsFormatted: bathsText ? `${bathsText} Baths` : undefined,
      size: parseInt(sizeText) || undefined,
      sizeFormatted: sizeText,
      type: typeText,
      walkTime: walkTime || undefined,
      nearestMrt: mrtText,
      url: `https://www.propertyguru.com.sg/listing/${l?.id}`,
    };
  });
}

// Combined search - queries both sources
async function searchProperties(params: SearchParams): Promise<Listing[]> {
  console.log("Searching 99.co and PropertyGuru...\n");

  const [results99co, resultsPG] = await Promise.all([
    search99co(params),
    searchPropertyGuru(params),
  ]);

  console.log(`  99.co: ${results99co.length} listings`);
  console.log(`  PropertyGuru: ${resultsPG.length} listings\n`);

  // Combine and sort by price
  const combined = [...results99co, ...resultsPG];
  combined.sort((a, b) => a.price - b.price);

  return combined;
}

// ============================================================
// CUSTOMIZE YOUR SEARCH HERE
// ============================================================

const results = await searchProperties({
  listingType: "rent",
  propertyType: "hdb",
  queryType: "zone",
  queryId: "zobukit_panjang", // For 99.co
  freetext: "bukit panjang", // For PropertyGuru
  minPrice: 3000,
  maxPrice: 5000,
  maxWalkMins: 5,
  pageSize: 50,
});

// ============================================================
// OUTPUT
// ============================================================

console.log(`Found ${results.length} properties total:\n`);
console.log("=".repeat(80));

results.forEach((r, i) => {
  console.log(`\n${i + 1}. [${r.source}] ${r.project || r.address}`);
  console.log(`   ${r.priceFormatted} | ${r.bedsFormatted} | ${r.sizeFormatted || "N/A"}`);
  if (r.walkTime) {
    console.log(`   ${r.walkTime} min walk - ${r.nearestMrt}`);
  }
  if (r.agentPhone) {
    console.log(`   Agent: ${r.agentName} ${r.agentPhone}`);
  }
  console.log(`   ${r.url}`);
});

console.log("\n" + "=".repeat(80));
