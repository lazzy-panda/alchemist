#!/usr/bin/env python3
"""
E2E regression test: drag-to-reorder on «Сегодня».

Guards three invariants that have regressed before:
  1. UPWARD drag — a practice dragged to the top lands at index 0.
  2. DOWNWARD drag — a practice dragged down actually moves down.
  3. NO responder theft — only the dragged practice changes position; every other
     practice keeps its relative order (the "a different card in the other end of the
     list opens the gap / moves" bug).

Run with the web dev server up:
    npx expo start --web --port 8081
    python3 tests/drag_reorder.py [--url http://localhost:8081]

Exit 0 = PASS, 1 = FAIL.
"""
import sys
import argparse
from playwright.sync_api import sync_playwright


def login(pg):
    try:
        pg.wait_for_selector('button[aria-label="Войти как гость"]', timeout=25000)
        pg.click('button[aria-label="Войти как гость"]')
    except Exception:
        pass
    pg.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)
    for _ in range(4):
        bt = pg.query_selector('button[aria-label="Пропустить"]') or pg.query_selector('button[aria-label="Начать"]')
        if not bt:
            break
        bt.click(); pg.wait_for_timeout(300)
    pg.wait_for_timeout(1500)


def order(pg):
    gs = pg.query_selector_all('[aria-label^="Переместить:"]')
    return [g.get_attribute("aria-label").replace("Переместить: ", "") for g in gs]


def drag(pg, src, tgt_idx, frac):
    """Drag the grip of practice `src` onto vertical position `frac` of row `tgt_idx`."""
    sg = pg.query_selector(f'[aria-label="Переместить: {src}"]')
    sg.scroll_into_view_if_needed(); pg.wait_for_timeout(300)
    grips = pg.query_selector_all('[aria-label^="Переместить:"]')
    sb = sg.bounding_box(); tb = grips[tgt_idx].bounding_box()
    sx, sy = sb["x"] + sb["width"] / 2, sb["y"] + sb["height"] / 2
    ty = tb["y"] + tb["height"] * frac
    pg.mouse.move(sx, sy); pg.mouse.down(); pg.wait_for_timeout(70)
    for k in range(1, 17):
        pg.mouse.move(sx, sy + (ty - sy) * k / 16); pg.wait_for_timeout(22)
    pg.wait_for_timeout(180); pg.mouse.up(); pg.wait_for_timeout(800)


def minus(lst, x):
    return [n for n in lst if n != x]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    args = ap.parse_args()
    fails = []

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)

        def fresh():
            ctx = b.new_context(viewport={"width": 390, "height": 844})
            pg = ctx.new_page()
            pg.goto(args.url, wait_until="domcontentloaded")
            login(pg)
            return ctx, pg

        # 1) UPWARD: practice at idx3 dragged to the top → lands @0, others keep relative order
        ctx, pg = fresh(); base = order(pg)
        if len(base) < 4:
            print(f"DRAG_REORDER: FAIL — need >=4 practices, got {len(base)}"); b.close(); sys.exit(1)
        src = base[3]
        drag(pg, src, 0, frac=0.3)
        aft = order(pg)
        if aft and aft.index(src) != 0:
            fails.append(f"UP: '{src}' landed@{aft.index(src)} (expected 0)")
        if minus(base, src) != minus(aft, src):
            fails.append(f"UP: another practice moved (theft). before={minus(base, src)} after={minus(aft, src)}")
        ctx.close()

        # 2) DOWNWARD: practice at idx0 dragged down past idx2 → moves down, others keep relative order
        ctx, pg = fresh(); base = order(pg)
        src = base[0]
        drag(pg, src, 2, frac=0.7)
        aft = order(pg)
        if aft and aft.index(src) <= 0:
            fails.append(f"DOWN: '{src}' did not move down (landed@{aft.index(src)})")
        if minus(base, src) != minus(aft, src):
            fails.append(f"DOWN: another practice moved (theft). before={minus(base, src)} after={minus(aft, src)}")
        ctx.close()

        b.close()

    if fails:
        print("DRAG_REORDER: FAIL")
        for f in fails:
            print("  -", f)
        sys.exit(1)
    print("DRAG_REORDER: PASS")


if __name__ == "__main__":
    main()
