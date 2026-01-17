# 99.co Browser Navigation

Guide for navigating 99.co using agent-browser when direct API fetch fails.

## When to Use

Use browser navigation when:
- Direct fetch returns 403 (Cloudflare blocking)
- Need to access listing detail pages (SSR only, no API)
- Need to scrape data not available via API

## Setup Session

```bash
# Open 99.co and wait for Cloudflare clearance
agent-browser --session 99co open "https://www.99.co/singapore/rent"
agent-browser --session 99co wait --load networkidle
```

## Search via URL

Navigate directly to search URLs with filters:

```bash
# HDB rentals in Bukit Panjang, $3k-$5k
agent-browser --session 99co open "https://www.99.co/singapore/rent/bukit-panjang?main_category=hdb&price_min=3000&price_max=5000"

# Condo sales near Orchard MRT
agent-browser --session 99co open "https://www.99.co/singapore/sale/condos-apartments?mrt_ids=sg-mrt-orchard"

# Landed in District 10
agent-browser --session 99co open "https://www.99.co/singapore/sale/landed-houses?district_ids=dtdistrict10"
```

## URL Parameter Reference

| Parameter       | Values                   | Example                         |
|-----------------|--------------------------|----------------------------------|
| `main_category` | `hdb`, `condo`, `landed` | `main_category=hdb`             |
| `price_min`     | number                   | `price_min=3000`                |
| `price_max`     | number                   | `price_max=5000`                |
| `bedrooms_min`  | number                   | `bedrooms_min=2`                |
| `bedrooms_max`  | number                   | `bedrooms_max=3`                |
| `mrt_ids`       | `sg-mrt-{name}`         | `mrt_ids=sg-mrt-orchard`        |
| `district_ids`  | `dtdistrict{num}`       | `district_ids=dtdistrict09`     |

## Fetch API from Browser Context

Once Cloudflare is cleared, make API calls from browser:

```bash
agent-browser --session 99co eval "
  const params = new URLSearchParams({
    listing_type: 'rent',
    property_segments: 'residential',
    main_category: 'hdb',
    query_type: 'zone',
    query_ids: 'zobukit_panjang',
    price_min: '3000',
    price_max: '5000',
    page_size: '50'
  });
  const res = await fetch('/api/v10/web/search/listings?' + params);
  return await res.json();
"
```

## Navigate Search Results

```bash
# Get interactive elements on search results page
agent-browser --session 99co snapshot -i

# Click on a listing card (find ref from snapshot)
agent-browser --session 99co click @e5

# Wait for listing page to load
agent-browser --session 99co wait --load networkidle
```

## Extract Listing Details

On a listing detail page:

```bash
# Get page content
agent-browser --session 99co eval "
  return {
    title: document.querySelector('h1')?.textContent,
    price: document.querySelector('[data-testid=\"price\"]')?.textContent,
    address: document.querySelector('[data-testid=\"address\"]')?.textContent,
    // Agent info is in the sidebar
    agentName: document.querySelector('[data-testid=\"agent-name\"]')?.textContent,
    agentPhone: document.querySelector('[data-testid=\"agent-phone\"]')?.textContent,
  };
"
```

## Location Autocomplete

Use autocomplete to discover location IDs:

```bash
agent-browser --session 99co eval "
  const res = await fetch('/api/v2/web/autocomplete/location?' + new URLSearchParams({
    input: 'bukit panjang',
    listing_type: 'rent',
    property_segments: 'residential',
    include_mrts: 'true'
  }));
  return await res.json();
"
```

## Cleanup

```bash
agent-browser --session 99co close
```

## Common Issues

### 403 Forbidden
Wait for full page load before API calls:
```bash
agent-browser --session 99co wait --load networkidle
agent-browser --session 99co wait 3000
```

### Element Not Found
Re-snapshot after page changes:
```bash
agent-browser --session 99co snapshot -i
```

### Session Expired
Close and reopen:
```bash
agent-browser --session 99co close
agent-browser --session 99co open "https://www.99.co/singapore/rent"
```
