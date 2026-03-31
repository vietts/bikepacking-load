#!/usr/bin/env python3
"""
Scrape bikepacking bag data from bike24.com using Playwright.
Outputs normalized JSON for the Bike Load Simulator.

Usage:
    pip install playwright
    playwright install chromium
    python scripts/scrape_bike24.py
    python scripts/scrape_bike24.py --category handlebar --max-products 10
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Missing dependency. Install with:")
    print("  pip3 install playwright && playwright install chromium")
    sys.exit(1)

BASE_URL = "https://www.bike24.com"

CATEGORIES = {
    "handlebar": {
        "url": "/cycling/accessories/bike-bags/handlebar-bags",
        "type": "handlebar",
        "position": "front_high",
        "min_volume": 3.0,
    },
    "frame": {
        "url": "/cycling/accessories/bike-bags/frame-bags",
        "type": "frame",
        "position": "center_low",
        "min_volume": 1.0,
    },
    "saddle": {
        "url": "/cycling/accessories/bike-bags/saddle-bags",
        "type": "saddle",
        "position": "rear_mid",
        "min_volume": 3.0,
    },
}


async def get_product_urls(page, category_url: str, max_pages: int = 3) -> list[str]:
    """Get product URLs from category listing pages."""
    all_urls = []
    url = BASE_URL + category_url

    for page_num in range(1, max_pages + 1):
        print(f"  Listing page {page_num}: {url}")
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)

        urls = await page.evaluate("""() => {
            const urls = [];
            document.querySelectorAll('a[href*="/p"]').forEach(a => {
                const m = a.href.match(/\\/p(\\d+)\\.html/);
                if (m && !urls.includes(a.href)) urls.push(a.href);
            });
            return urls;
        }""")
        all_urls.extend(urls)
        print(f"    Found {len(urls)} products")

        # Try to find next page
        next_url = await page.evaluate("""() => {
            const nextBtn = document.querySelector('a[aria-label*="Next"], a[aria-label*="next"], a[rel="next"]');
            if (nextBtn) return nextBtn.href;
            // Try pagination links
            const links = [...document.querySelectorAll('a[href*="page="]')];
            const currentPage = new URL(window.location).searchParams.get('page') || '1';
            const nextPage = parseInt(currentPage) + 1;
            const match = links.find(a => new URL(a.href).searchParams.get('page') == nextPage);
            return match ? match.href : null;
        }""")

        if not next_url:
            break
        url = next_url

    # Deduplicate
    return list(dict.fromkeys(all_urls))


async def scrape_product(page, url: str) -> dict | None:
    """Navigate to a product page and extract specs."""
    try:
        await page.goto(url, wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)

        data = await page.evaluate("""() => {
            const result = {};

            // JSON-LD
            document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
                try {
                    let ld = JSON.parse(s.textContent);
                    if (Array.isArray(ld)) ld = ld.find(i => i['@type'] === 'Product') || ld[0];
                    if (ld && ld['@type'] === 'Product') {
                        result.name = ld.name || '';
                        result.brand = (ld.brand && ld.brand.name) || '';
                        if (ld.offers) {
                            const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
                            result.price = parseFloat(offer.price) || 0;
                            result.currency = offer.priceCurrency || 'EUR';
                        }
                    }
                } catch(e) {}
            });

            // Full page text for spec extraction
            const text = document.body.innerText;

            // Weight (grams)
            const wm = text.match(/(?:Weight|Gewicht)[:\\s]*(\\d+)\\s*g\\b/i);
            if (wm) result.bag_weight = parseInt(wm[1]);

            // Volume
            const vm = text.match(/(?:Volume|Volumen|Capacity)[:\\s]*([\\d.]+)\\s*(?:L|l|liter)/i);
            if (vm) result.volume = parseFloat(vm[1]);
            else {
                // From product name
                const vnm = (result.name || '').match(/(\\d+\\.?\\d*)\\s*L\\b/);
                if (vnm) result.volume = parseFloat(vnm[1]);
            }

            // Max load
            const lm = text.match(/(?:Maximum Load|Max\\.?\\s*Load|Zuladung)[:\\s]*([\\d.]+)\\s*kg/i);
            if (lm) result.max_weight = parseFloat(lm[1]);

            // Dimensions
            const dm = text.match(/(\\d+)\\s*[×xX\\/]\\s*(\\d+)\\s*[×xX\\/]\\s*(\\d+)\\s*mm/);
            if (dm) result.dimensions = { l: parseInt(dm[1]), w: parseInt(dm[2]), h: parseInt(dm[3]) };

            // Waterproof
            const ipm = text.match(/IP(\\d+)/);
            if (ipm) result.waterproof = 'IP' + ipm[1];
            else if (/waterproof|wasserdicht/i.test(text)) result.waterproof = true;

            // Closure
            const cm = text.match(/(rolltop|roll[- ]?top|zipper|magnetic|buckle|velcro)/i);
            if (cm) result.closure = cm[1].toLowerCase().replace(/[- ]/g, '');

            return result;
        }""")

        if data and data.get("name"):
            data["url"] = url
            return data
        return None

    except Exception as e:
        print(f"    Error: {e}")
        return None


def normalize_bag(raw: dict, category: str) -> dict | None:
    """Normalize scraped data into our bag preset format."""
    volume = raw.get("volume")
    if not volume or volume <= 0:
        return None

    cat = CATEGORIES[category]
    if volume < cat["min_volume"]:
        return None

    brand = raw.get("brand", "Unknown")
    name = raw.get("name", "Unknown")

    # Clean label
    label = name
    if brand and label.lower().startswith(brand.lower()):
        label = label[len(brand):].strip(" -")
    label = re.sub(
        r"\s*-\s*(black|white|grey|gray|blue|red|green|orange|yellow|olive|dark|light|matt|matte|neon).*$",
        "", label, flags=re.I,
    ).strip(" -")

    bag_id = re.sub(r"[^a-z0-9]+", "_", f"{cat['type']}_{brand}_{volume}l".lower()).strip("_")

    bag = {
        "id": bag_id,
        "type": cat["type"],
        "label": label,
        "position": cat["position"],
        "volume": volume,
        "maxWeight": raw.get("max_weight", _default_max_weight(category, volume)),
        "brand": brand,
    }

    if "bag_weight" in raw:
        bag["bagWeight"] = raw["bag_weight"]
    if "dimensions" in raw:
        bag["dimensions"] = raw["dimensions"]
    if "price" in raw:
        bag["price"] = {"amount": raw["price"], "currency": raw.get("currency", "EUR")}
    if "waterproof" in raw:
        bag["waterproof"] = raw["waterproof"]
    if "closure" in raw:
        bag["closure"] = raw["closure"]

    return bag


def _default_max_weight(category: str, volume: float) -> float:
    if category == "handlebar":
        return 5.0 if volume >= 10 else 4.0 if volume >= 6 else 3.0
    elif category == "frame":
        return 5.0 if volume >= 6 else 4.0 if volume >= 3 else 3.0
    elif category == "saddle":
        return 5.0 if volume >= 10 else 4.0 if volume >= 6 else 3.0
    return 3.0


async def scrape_category(browser, category: str, max_pages: int, max_products: int) -> list[dict]:
    """Scrape all products from a category."""
    cat = CATEGORIES[category]
    page = await browser.new_page()

    print(f"\n{'='*60}")
    print(f"Scraping: {category} bags")
    print(f"{'='*60}")

    product_urls = await get_product_urls(page, cat["url"], max_pages)
    product_urls = product_urls[:max_products]
    print(f"  Total URLs to scrape: {len(product_urls)}")

    bags = []
    for i, url in enumerate(product_urls):
        print(f"  [{i+1}/{len(product_urls)}] {url.split('/')[-1]}", end=" ")
        raw = await scrape_product(page, url)
        if raw:
            bag = normalize_bag(raw, category)
            if bag:
                bags.append(bag)
                print(f"✓ {bag['brand']} {bag['label']} — {bag['volume']}L, {bag.get('bagWeight', '?')}g")
            else:
                print(f"✗ skipped (vol={raw.get('volume')})")
        else:
            print("✗ no data")

    await page.close()
    return bags


async def main_async(args):
    categories = [args.category] if args.category else list(CATEGORIES.keys())

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        all_bags = []
        for category in categories:
            bags = await scrape_category(browser, category, args.max_pages, args.max_products)
            all_bags.extend(bags)

        await browser.close()

    # Deduplicate by id, keep first occurrence
    seen = set()
    unique = []
    for bag in all_bags:
        if bag["id"] not in seen:
            seen.add(bag["id"])
            unique.append(bag)

    unique.sort(key=lambda b: (b["type"], b["brand"], b["volume"]))

    output = args.output or str(Path(__file__).parent.parent / "src" / "data" / "bags-bike24.json")
    Path(output).parent.mkdir(parents=True, exist_ok=True)

    with open(output, "w") as f:
        json.dump(unique, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"Done! {len(unique)} bags → {output}")
    for cat in categories:
        cat_bags = [b for b in unique if b["type"] == CATEGORIES[cat]["type"]]
        brands = set(b["brand"] for b in cat_bags)
        print(f"  {cat}: {len(cat_bags)} bags, {len(brands)} brands")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(description="Scrape bikepacking bags from bike24.com")
    parser.add_argument("--category", choices=list(CATEGORIES.keys()))
    parser.add_argument("--max-pages", type=int, default=3, help="Max listing pages per category")
    parser.add_argument("--max-products", type=int, default=50, help="Max products per category")
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
