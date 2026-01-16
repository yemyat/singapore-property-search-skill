# 99.co API Reference

## Original Source

Full API discovery documentation with sample responses and detailed notes:
- **99.co Website**: https://www.99.co
- **Discovery Doc**: See `99co-api-discovery.md` in project `/Users/yemyat/src/tries/2026-01-16-99co-api/`

## Main Search Endpoint

```
GET https://www.99.co/api/v10/web/search/listings
```

### Required Parameters

| Parameter           | Values                      | Description             |
| ------------------- | --------------------------- | ----------------------- |
| `listing_type`      | `sale`, `rent`              | Sale or rental listings |
| `property_segments` | `residential`, `commercial` | Property segment        |

### Location Filters

| Parameter      | Example                              | Description            |
| -------------- | ------------------------------------ | ---------------------- |
| `query_type`   | `subway_station`, `zone`, `district` | Location type          |
| `query_ids`    | `sg-mrt-orchard`                     | Location identifier    |
| `query_coords` | `1.32,103.82`                        | Coordinates (optional) |
| `district_ids` | `dtdistrict09`                       | Filter by district     |
| `mrt_ids`      | `sg-mrt-orchard`                     | Filter by MRT          |

### Property Filters

| Parameter       | Values                   | Description      |
| --------------- | ------------------------ | ---------------- |
| `main_category` | `condo`, `hdb`, `landed` | Property type    |
| `rental_type`   | `unit`, `room`, `all`    | For rentals only |
| `price_min`     | `2000`                   | Minimum price    |
| `price_max`     | `5000`                   | Maximum price    |
| `bedrooms_min`  | `2`                      | Minimum bedrooms |
| `bedrooms_max`  | `3`                      | Maximum bedrooms |

### Pagination & Sorting

| Parameter    | Values             | Description                |
| ------------ | ------------------ | -------------------------- |
| `page_num`   | `1`                | Page number                |
| `page_size`  | `50`               | Results per page (max 100) |
| `sort_by`    | `recency`, `price` | Sort field                 |
| `sort_order` | `asc`, `desc`      | Sort direction             |

## Other Useful Endpoints

### Location Autocomplete

```
GET https://www.99.co/api/v2/web/autocomplete/location
  ?input=orchard
  &listing_type=rent
  &property_segments=residential
  &include_mrts=true
```

### Listings Count

```
GET https://www.99.co/api/v10/web/search/filtered-listings-count
  ?listing_type=rent
  &property_segments=residential
```

### Transaction History (for a condo/project)

```
GET https://www.99.co/api/v10/web/clusters/{cluster_id}/transactions/table/history
  ?transaction_type=sale
  &page_size=20
```

## Common MRT Station IDs

| Station       | ID                     |
| ------------- | ---------------------- |
| Orchard       | `sg-mrt-orchard`       |
| Newton        | `sg-mrt-newton`        |
| Stevens       | `sg-mrt-stevens`       |
| Bugis         | `sg-mrt-bugis`         |
| City Hall     | `sg-mrt-city-hall`     |
| Raffles Place | `sg-mrt-raffles-place` |
| Marina Bay    | `sg-mrt-marina-bay`    |
| Tanjong Pagar | `sg-mrt-tanjong-pagar` |
| Tiong Bahru   | `sg-mrt-tiong-bahru`   |
| Novena        | `sg-mrt-novena`        |

## Common Zone IDs

| Area          | ID                |
| ------------- | ----------------- |
| Ang Mo Kio    | `zoang_mo_kio`    |
| Bedok         | `zobedok`         |
| Bishan        | `zobishan`        |
| Bukit Panjang | `zobukit_panjang` |
| Clementi      | `zoclementi`      |
| Jurong East   | `zojurong_east`   |
| Pasir Ris     | `zopasir_ris`     |
| Punggol       | `zopunggol`       |
| Sengkang      | `zosengkang`      |
| Tampines      | `zotampines`      |
| Woodlands     | `zowoodlands`     |
| Yishun        | `zoyishun`        |

## District Numbers

Singapore is divided into 28 districts (D01-D28). Use format: `dtdistrict{number}`

- D09, D10, D11: Orchard, Newton, Novena (prime)
- D01, D02, D06: CBD, Raffles Place, City Hall
- D15: East Coast, Katong
- D21: Upper Bukit Timah, Clementi
