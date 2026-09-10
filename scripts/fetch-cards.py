"""Fetch Dune Cards Hub API and build a local base-game catalogue.

Source: https://dunecardshub.com/api/cards
Scope: expansionName == "Dune: Imperium" (base game).
Output: data/cards.base.json
Polite use: one request per card with delay, custom UA.
"""
import json
import re
import subprocess
import time
from datetime import datetime, timezone
from html.parser import HTMLParser

BASE = "https://dunecardshub.com"
UA = "Mozilla/5.0 (dune-local-catalogue; contact: local-dev)"
OUT = "data/cards.base.json"

class TextBlocks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.blocks = []
        self.cur = ""
    def handle_starttag(self, tag, attrs):
        if tag in ("div", "br", "p", "li"):
            if self.cur.strip():
                self.blocks.append(self.cur.strip())
                self.cur = ""
    def handle_endtag(self, tag):
        if tag in ("div", "p", "li"):
            if self.cur.strip():
                self.blocks.append(self.cur.strip())
                self.cur = ""
    def handle_data(self, data):
        self.cur += data
    def text(self):
        if self.cur.strip():
            self.blocks.append(self.cur.strip())
        # clean whitespace
        out = []
        for b in self.blocks:
            b = re.sub(r"\s+", " ", b).strip()
            if b:
                out.append(b)
        return out

def curl_json(url):
    out = subprocess.check_output(
        ["curl", "-s", "-A", UA, "--compressed", url], timeout=30
    )
    return json.loads(out)

def html_to_blocks(html):
    if not html:
        return []
    p = TextBlocks()
    p.feed(html)
    return p.text()

def main():
    print("GET card list ...")
    cards = curl_json(f"{BASE}/api/cards")
    print(f"total cards on site: {len(cards)}")
    base = [c for c in cards if c.get("expansionName") == "Dune: Imperium"]
    print(f"base cards: {len(base)}")
    out_cards = []
    for i, c in enumerate(sorted(base, key=lambda x: x["id"])):
        cid = c["id"]
        time.sleep(0.7)
        try:
            det = curl_json(f"{BASE}/api/cards/{cid}")
        except Exception as e:
            print(f"FAIL {cid} {c.get('name')}: {e}")
            out_cards.append({
                "id": cid, "name": c.get("name"), "slug": c.get("slug"),
                "type": c.get("type"), "fetch_error": str(e),
                "list_entry": c,
            })
            continue
        card = det.get("card", {})
        ga = det.get("groupedAttributes", {})
        if isinstance(ga, list):
            ga = {}
        desc_html = card.get("description")
        blocks = html_to_blocks(desc_html)
        # split cost / agent / reveal from blocks
        cost_text = blocks[0] if len(blocks) >= 1 else None
        agent_text = blocks[1] if len(blocks) >= 2 else None
        reveal_text = blocks[2] if len(blocks) >= 3 else None
        # persuasion cost from attributes
        persuasion_cost = None
        for a in ga.get("general", []):
            if a.get("attribute", {}).get("name") == "Persuasion cost":
                persuasion_cost = a.get("value")
        attrs_simple = {}
        for group, items in ga.items():
            attrs_simple[group] = [
                {"name": a["attribute"]["name"], "value": a.get("value")}
                for a in items
            ]
        out_cards.append({
            "id": cid,
            "name": card.get("name"),
            "slug": card.get("slug"),
            "type": card.get("type"),
            "expansion": card.get("expansionName"),
            "physical_copies": card.get("physicalCopies"),
            "persuasion_cost": persuasion_cost,
            "cost_text": cost_text,
            "agent_text": agent_text,
            "reveal_text": reveal_text,
            "description_text_blocks": blocks,
            "description_html": desc_html,
            "attributes": attrs_simple,
            "image": f"{BASE}" + card["fullImagePath"] if card.get("fullImagePath") else None,
            "thumbnail": f"{BASE}" + card["thumbnailImagePath"] if card.get("thumbnailImagePath") else None,
        })
        print(f"[{i+1}/{len(base)}] {cid} {card.get('name')} ({card.get('type')}) cost={persuasion_cost}")
    payload = {
        "source": f"{BASE}/api/cards",
        "scope": "expansionName == 'Dune: Imperium'",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "count": len(out_cards),
        "note": "Agent/Reveal text comes from description_html. Null means API has no text; use image link to read card.",
        "cards": out_cards,
    }
    import os
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"Wrote {OUT}")

if __name__ == "__main__":
    main()
