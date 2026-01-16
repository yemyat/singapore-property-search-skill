// 99.co Property Search Script
// Run with: bun run search.ts
//
// Customize the search parameters below, then run the script.

interface SearchParams {
  listingType: "rent" | "sale";
  propertyType: "condo" | "hdb" | "landed" | "all";
  queryType: "subway_station" | "zone" | "district" | "none";
  queryId: string; // e.g., "sg-mrt-orchard", "zobukit_panjang", "dtdistrict09"
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minSize?: number; // sqft - filtered client-side
  maxWalkMins?: number; // filtered client-side
  pageSize?: number;
}

async function search99co(params: SearchParams) {
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
  if (params.minBedrooms)
    queryParams.set("bedrooms_min", String(params.minBedrooms));
  if (params.maxBedrooms)
    queryParams.set("bedrooms_max", String(params.maxBedrooms));

  const url = `https://www.99.co/api/v10/web/search/listings?${queryParams}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} - ${await res.text()}`);
  }

  const data = await res.json();
  let listings = data?.data?.sections?.[0]?.listings || [];

  // Client-side filters
  if (params.minSize || params.maxWalkMins) {
    listings = listings.filter((l: any) => {
      const size = l.attributes?.area_size || 0;
      const walkTime =
        l.within_distance_from_query?.closest_mrt?.walking_time_in_mins;

      if (params.minSize && size < params.minSize) return false;
      if (params.maxWalkMins && (!walkTime || walkTime > params.maxWalkMins))
        return false;

      return true;
    });
  }

  return listings.map((l: any) => ({
    id: l.id,
    address: l.address_line_1,
    project: l.project_name,
    price: l.attributes?.price,
    priceFormatted: l.attributes?.price_formatted,
    beds: l.attributes?.bedrooms,
    bedsFormatted: l.attributes?.bedrooms_formatted,
    baths: l.attributes?.bathrooms,
    bathsFormatted: l.attributes?.bathrooms_formatted,
    size: l.attributes?.area_size,
    sizeFormatted: l.attributes?.area_size_formatted,
    psf: l.attributes?.area_ppsf,
    psfFormatted: l.attributes?.area_ppsf_formatted,
    posted: l.date_formatted,
    walkTime: l.within_distance_from_query?.closest_mrt?.walking_time_in_mins,
    nearestMrt: l.within_distance_from_query?.closest_mrt?.title,
    agentName: l.user?.name,
    agentPhone: l.user?.phone,
    url: `https://www.99.co${l.listing_url}`,
  }));
}

// ============================================================
// CUSTOMIZE YOUR SEARCH HERE
// ============================================================

const results = await search99co({
  listingType: "rent",
  propertyType: "condo",
  queryType: "subway_station",
  queryId: "sg-mrt-orchard", // Change to your target MRT
  minSize: 800, // Minimum sqft
  maxWalkMins: 10, // Max walking time to MRT
  maxPrice: 6000, // Max monthly rent
  pageSize: 100,
});

// ============================================================
// OUTPUT
// ============================================================

console.log(`Found ${results.length} properties:\n`);

results.slice(0, 20).forEach((r: any, i: number) => {
  console.log(`${i + 1}. ${r.project || r.address}`);
  console.log(
    `   ${r.priceFormatted} | ${r.bedsFormatted} | ${r.sizeFormatted}`
  );
  console.log(`   ${r.walkTime} min to ${r.nearestMrt}`);
  console.log(`   ${r.url}\n`);
});

if (results.length > 20) {
  console.log(`... and ${results.length - 20} more results`);
}
