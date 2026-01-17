---
name: singapore-property-search
description: Search Singapore properties on 99.co. Use when the user asks to find condos, HDBs, or landed properties for rent or sale in Singapore, filter by MRT, district, price, or size.
---

# 99.co Property Search

Search for properties in Singapore using the 99.co API.

## Important Rules

1. **Always include property URLs** - When presenting results to the user, always include the full 99.co link for each property: `https://www.99.co{listing_url}`
2. **Show key details** - Include price, bedrooms, size, and walking distance to nearest MRT
3. **Summarize first** - Start with a count and highlight the best matches before listing all results

## Prerequisites

- **Bun**: Required to run TypeScript scripts (`brew install oven-sh/bun/bun`)
- **agent-browser skill**: Fallback when Cloudflare blocks direct requests
  ```bash
  npx add-skill agent-browser
  ```
  See `agent-browser-reference.md` for usage guide.

## Quick Start

Run the search script from this skill directory:

```bash
cd ~/.factory/skills/99co-property-search && bun run search.ts
```

Or copy and adapt the search function for custom queries.

## Key Insight: Cloudflare Bypass

**Use minimal headers only!** Adding browser-like headers triggers Cloudflare's JS challenge.

```typescript
// WORKS - minimal headers
const res = await fetch(url, { headers: { Accept: "application/json" } });

// FAILS - browser-like headers trigger 403
const res = await fetch(url, {
  headers: {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0...", // DON'T DO THIS
  },
});
```

## Search Patterns

### By MRT Station

```typescript
const params = new URLSearchParams({
  listing_type: "rent", // or "sale"
  property_segments: "residential",
  main_category: "condo", // or "hdb", "landed"
  query_type: "subway_station",
  query_ids: "sg-mrt-stevens", // MRT ID format: sg-mrt-{name}
  page_size: "50",
});
```

Common MRT IDs: `sg-mrt-orchard`, `sg-mrt-newton`, `sg-mrt-stevens`, `sg-mrt-bugis`, `sg-mrt-city-hall`

### Discovering Location IDs

**Don't hardcode IDs** - use the autocomplete API to discover valid zone IDs, MRT IDs, and coordinates:

```typescript
const res = await fetch(
  "https://www.99.co/api/v2/web/autocomplete/location?" +
    new URLSearchParams({
      input: "bukit panjang", // Search query
      listing_type: "rent",
      property_segments: "residential",
      include_mrts: "true",
    }),
  { headers: { Accept: "application/json" } }
);

const data = await res.json();
// data.data.sections[].locations[] contains:
// - id: "zobukit_panjang" or "sg-mrt-bukit-panjang"
// - type: "zone" or "subway_station"
// - title: "Bukit Panjang"
// - coordinates: { lat: 1.379..., lng: 103.764... }
```

Use these values in your search:
- `id` → `query_ids`
- `type` → `query_type`
- `title` → `query_name`
- `coordinates` → `query_coords` (format: `lat,lng`)

### By Zone/Area

```typescript
const params = new URLSearchParams({
  listing_type: "rent",
  property_segments: "residential",
  main_category: "hdb",
  query_type: "zone",
  query_ids: "zobukit_panjang", // Zone ID format: zo{area_name}
  page_size: "50",
});
```

Zone ID examples: `zoang_mo_kio`, `zobukit_panjang`, `zotampines`, `zobedok`

### By District

```typescript
const params = new URLSearchParams({
  listing_type: "sale",
  property_segments: "residential",
  district_ids: "dtdistrict09", // District ID format: dtdistrict{number}
  page_size: "50",
});
```

## Client-Side Filtering Required

These filters do NOT work server-side - filter results after fetching:

- **Walking distance**: `listing.within_distance_from_query?.closest_mrt?.walking_time_in_mins`
- **Area size**: `listing.attributes?.area_size`
- **PSF**: `listing.attributes?.area_ppsf`

Example:

```typescript
const filtered = listings.filter((l) => {
  const walkTime =
    l.within_distance_from_query?.closest_mrt?.walking_time_in_mins;
  const size = l.attributes?.area_size || 0;
  return walkTime <= 10 && size >= 900;
});
```

## Fallback: Browser Context

If you get 403 errors, Cloudflare protection may have changed. Use `agent-browser` skill:

```bash
# Open 99.co in browser first
agent-browser --session 99co open "https://www.99.co/singapore/rent"

# Then use browser's fetch context via eval
agent-browser --session 99co eval "
  const res = await fetch('/api/v10/web/search/listings?listing_type=rent&property_segments=residential&page_size=10');
  return await res.json();
"
```

## Useful Response Fields

| Field                                                         | Example                 | Description       |
| ------------------------------------------------------------- | ----------------------- | ----------------- |
| `address_line_1`                                              | `"226 Pending Rd"`      | Address           |
| `project_name`                                                | `"The Sail"`            | Development name  |
| `attributes.price`                                            | `3100`                  | Price (number)    |
| `attributes.price_formatted`                                  | `"S$ 3,100"`            | Price (formatted) |
| `attributes.bedrooms`                                         | `3`                     | Bedrooms          |
| `attributes.area_size`                                        | `904`                   | Size in sqft      |
| `within_distance_from_query.closest_mrt.title`                | `"Stevens MRT"`         | Nearest MRT       |
| `within_distance_from_query.closest_mrt.walking_time_in_mins` | `5`                     | Walk time         |
| `listing_url`                                                 | `"/singapore/rent/..."` | Relative URL      |
| `user.name`                                                   | `"Agent Name"`          | Agent             |
| `user.phone`                                                  | `"+6591234567"`         | Agent phone       |

## API Endpoint

```
GET https://www.99.co/api/v10/web/search/listings
```

See `references.md` for full API documentation.
