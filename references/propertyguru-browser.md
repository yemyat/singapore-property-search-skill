# PropertyGuru Browser Navigation

Guide for navigating PropertyGuru using agent-browser when direct fetch fails.

## Cloudflare Bypass (No Browser)

**Try direct fetch first** - PropertyGuru can be bypassed without a browser:

| Method | How | Browser Needed |
|--------|-----|----------------|
| Mobile User-Agent | iOS/Android Safari UA string | No |
| Autocomplete subdomain | `autocomplete.propertyguru.com` (no protection) | No |
| Browser context | Puppeteer/Playwright, extract `__NEXT_DATA__` | Yes |

```typescript
// PropertyGuru - works without browser
fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15" },
  redirect: "follow"
})
```

**Key insight**: Specific header = bypass. Mobile User-Agent required, minimal headers get blocked.

## When to Use Browser

Use browser navigation when:
- Mobile User-Agent bypass stops working
- Need to access listing detail pages for agent contact info
- Need to interact with filters not available via URL

## Setup Session

```bash
# Open PropertyGuru
agent-browser --session pg open "https://www.propertyguru.com.sg/property-for-rent"
agent-browser --session pg wait --load networkidle
```

## Search via URL

Navigate directly to filtered search URLs:

```bash
# HDB rentals in Bukit Panjang, $3k-$5k
agent-browser --session pg open "https://www.propertyguru.com.sg/hdb-for-rent?freetext=bukit+panjang&minprice=3000&maxprice=5000"

# Condo sales near Orchard
agent-browser --session pg open "https://www.propertyguru.com.sg/condo-for-sale?freetext=orchard"

# Landed in District 10
agent-browser --session pg open "https://www.propertyguru.com.sg/landed-for-sale?freetext=d10"
```

## URL Patterns

| Property Type | Sale URL | Rent URL |
|---------------|----------|----------|
| All | `/property-for-sale` | `/property-for-rent` |
| Condo | `/condo-for-sale` | `/condo-for-rent` |
| HDB | `/hdb-for-sale` | `/hdb-for-rent` |
| Landed | `/landed-for-sale` | `/landed-for-rent` |

## URL Parameters

| Parameter  | Description | Example |
|------------|-------------|---------|
| `freetext` | Location search | `freetext=bukit+panjang` |
| `minprice` | Minimum price | `minprice=3000` |
| `maxprice` | Maximum price | `maxprice=5000` |
| `beds`     | Minimum bedrooms | `beds=2` |
| `district` | District code | `district=D09` |

## Extract Data from __NEXT_DATA__

PropertyGuru uses Next.js SSR. All listing data is in the page:

```bash
agent-browser --session pg eval "
  const el = document.getElementById('__NEXT_DATA__');
  if (!el) return { error: 'No __NEXT_DATA__ found' };
  
  const data = JSON.parse(el.textContent);
  const listings = data?.props?.pageProps?.pageData?.data?.listingsData || [];
  
  return listings.slice(0, 10).map(item => {
    const l = item.listingData;
    return {
      id: l?.id,
      title: l?.localizedTitle,
      address: l?.fullAddress,
      price: l?.price?.pretty,
      beds: l?.listingFeatures?.[0]?.[0]?.text,
      mrt: l?.mrt?.nearbyText,
    };
  });
"
```

## Navigate to Listing Detail

```bash
# Get listing links from search results
agent-browser --session pg eval "
  const cards = document.querySelectorAll('[data-listing-id]');
  return Array.from(cards).slice(0, 5).map(c => ({
    id: c.dataset.listingId,
    url: c.querySelector('a')?.href
  }));
"

# Navigate to a specific listing
agent-browser --session pg open "https://www.propertyguru.com.sg/listing/12345678"
agent-browser --session pg wait --load networkidle
```

## Get Agent Contact (Detail Page Only)

Agent phone numbers are only available on listing detail pages:

```bash
agent-browser --session pg eval "
  const el = document.getElementById('__NEXT_DATA__');
  const data = JSON.parse(el?.textContent || '{}');
  const listing = data?.props?.pageProps?.listingDetailData;
  
  return {
    agentName: listing?.agent?.name,
    agentPhone: listing?.agent?.phone,
    agencyName: listing?.agency?.name,
  };
"
```

## Use Search Filters UI

If URL parameters aren't enough, interact with filter UI:

```bash
# Get filter elements
agent-browser --session pg snapshot -i

# Example: Click price filter dropdown
agent-browser --session pg click @e12

# Wait for dropdown
agent-browser --session pg wait 500
agent-browser --session pg snapshot -i

# Select price range
agent-browser --session pg click @e15
```

## Pagination

```bash
# Go to next page
agent-browser --session pg eval "
  const nextBtn = document.querySelector('[data-testid=\"pagination-next\"]');
  if (nextBtn) nextBtn.click();
"
agent-browser --session pg wait --load networkidle

# Or navigate directly
agent-browser --session pg open "https://www.propertyguru.com.sg/hdb-for-rent/2?freetext=bukit+panjang"
```

## Cleanup

```bash
agent-browser --session pg close
```

## Common Issues

### Cloudflare Challenge
PropertyGuru may show Cloudflare challenge. Wait and retry:
```bash
agent-browser --session pg wait 5000
agent-browser --session pg reload
agent-browser --session pg wait --load networkidle
```

### Mobile vs Desktop View
PropertyGuru serves different content based on viewport. For consistent results:
```bash
agent-browser --session pg eval "
  // Check if mobile view
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
"
```

### Empty __NEXT_DATA__
Page may not have fully hydrated. Wait longer:
```bash
agent-browser --session pg wait 3000
```
