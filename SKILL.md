---
name: singapore-property-search
description: Search Singapore properties on 99.co and PropertyGuru. Use when the user asks to find condos, HDBs, or landed properties for rent or sale in Singapore, filter by MRT, district, price, or size.
---

# Singapore Property Search

Search properties in Singapore using both 99.co and PropertyGuru APIs.

## Rules

1. **Always include property URLs** - Full links for each listing
2. **Show source** - Label listings as 99.co or PropertyGuru
3. **Key details** - Price, bedrooms, size, walking distance to MRT
4. **Summarize first** - Count from each source before listing results

## Quick Start

```bash
cd ~/.factory/skills/singapore-property-search/scripts && bun run search.ts
```

Edit search parameters at the bottom of `scripts/search.ts`.

## Prerequisites

Run `scripts/install-prerequisites.sh` or install manually:
- **Bun**: `brew install oven-sh/bun/bun`
- **agent-browser** (fallback): `npx add-skill agent-browser`

## Search Parameters

```typescript
{
  listingType: "rent" | "sale",
  propertyType: "condo" | "hdb" | "landed" | "all",
  queryType: "subway_station" | "zone" | "district" | "none",  // 99.co
  queryId: "sg-mrt-orchard",      // 99.co location ID
  freetext: "orchard",            // PropertyGuru location
  minPrice: 3000,
  maxPrice: 5000,
  minBedrooms: 2,
  maxWalkMins: 5,                 // Client-side filter
}
```

## Location ID Patterns (99.co)

| Type | Format | Example |
|------|--------|---------|
| MRT | `sg-mrt-{name}` | `sg-mrt-orchard`, `sg-mrt-bukit-panjang` |
| Zone | `zo{area}` | `zobukit_panjang`, `zoang_mo_kio` |
| District | `dtdistrict{num}` | `dtdistrict09`, `dtdistrict10` |

For PropertyGuru, use natural names in `freetext`: `"orchard"`, `"bukit panjang"`

## API Summary

| | 99.co | PropertyGuru |
|-|-------|--------------|
| Bypass | `Accept: application/json` | Mobile User-Agent |
| Endpoint | `/api/v10/web/search/listings` | HTML with `__NEXT_DATA__` |
| Location | `query_type` + `query_ids` | `freetext` param |
| Agent Phone | Yes | Detail page only |

## Discover Location IDs

```typescript
// 99.co autocomplete
const res = await fetch(
  "https://www.99.co/api/v2/web/autocomplete/location?" +
  new URLSearchParams({
    input: "bukit panjang",
    listing_type: "rent",
    property_segments: "residential",
    include_mrts: "true",
  }),
  { headers: { Accept: "application/json" } }
);
```

## Fallback: Browser Navigation

If direct fetch fails due to Cloudflare changes, use agent-browser:

```bash
agent-browser --session 99co open "https://www.99.co/singapore/rent"
agent-browser --session 99co eval "
  const res = await fetch('/api/v10/web/search/listings?listing_type=rent&property_segments=residential');
  return await res.json();
"
```

See `references/` folder for detailed browser navigation guides:
- `agent-browser.md` - Command reference
- `99co-browser.md` - 99.co navigation
- `propertyguru-browser.md` - PropertyGuru navigation
