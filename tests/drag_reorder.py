#!/usr/bin/env python3
"""
E2E regression test: drag-to-reorder on «Сегодня».

Guards the invariants that have regressed before:
  1. UPWARD drag — a practice dragged to the top lands at index 0.
  2. DOWNWARD drag — a practice dragged down actually moves down.
  3. NO responder theft — only the dragged practice changes position.
  4. CONSECUTIVE — three drags in ONE session land exactly (RNW onLayout rides
     ResizeObserver and never re-fires on position-only moves, so cached row offsets
     went stale after the first reorder and every next drop missed by a slot).
  5. NOOP — a released-in-place grip changes nothing.
  6. TO_END — a practice dragged below the last row lands last.
  7. AUTOSCROLL — holding a drag at the bottom viewport edge scrolls the list and
     the practice can travel beyond the initially visible rows.
  8. WIDE — an exact one-slot drag works in the desktop (wide) layout too.

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


def grip_centers(pg):
    gs = pg.query_selector_all('[aria-label^="Переместить:"]')
    out = []
    for g in gs:
        b = g.bounding_box()
        out.append((b["x"] + b["width"] / 2, b["y"] + b["height"] / 2))
    return out


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


def swap01(lst):
    out = list(lst)
    out[0], out[1] = out[1], out[0]
    return out


def minus(lst, x):
    return [n for n in lst if n != x]


def scroll_top(pg):
    return pg.evaluate("() => { const s = document.getElementById('screen-today'); return s ? s.scrollTop : null; }")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    args = ap.parse_args()
    fails = []

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)

        def fresh(width=390, height=844):
            ctx = b.new_context(viewport={"width": width, "height": height})
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

        # 3) CONSECUTIVE: three one-slot drags in ONE session, exact order after each
        #    (the stale-onLayout regression: drag #2+ used pre-reorder row offsets and missed)
        ctx, pg = fresh(); cur = order(pg)
        for i in range(3):
            expected = swap01(cur)
            drag(pg, cur[0], 1, frac=0.7)
            cur = order(pg)
            if cur != expected:
                fails.append(f"CONSECUTIVE#{i + 1}: got {cur}, expected {expected}")
                break
        ctx.close()

        # 4) NOOP: press the grip, wiggle a few px, release → order identical
        ctx, pg = fresh(); base = order(pg)
        (sx, sy) = grip_centers(pg)[1]
        pg.mouse.move(sx, sy); pg.mouse.down(); pg.wait_for_timeout(80)
        pg.mouse.move(sx, sy + 3); pg.wait_for_timeout(60)
        pg.mouse.move(sx, sy - 3); pg.wait_for_timeout(60)
        pg.mouse.up(); pg.wait_for_timeout(800)
        aft = order(pg)
        if aft != base:
            fails.append(f"NOOP: order changed. before={base} after={aft}")
        ctx.close()

        # 5) TO_END: scroll to the list bottom, drag the second-to-last practice below the last → lands last
        ctx, pg = fresh(); base = order(pg)
        pg.evaluate("() => { const s = document.getElementById('screen-today'); if (s) s.scrollTop = s.scrollHeight; }")
        pg.wait_for_timeout(400)
        src = base[-2]
        sg = pg.query_selector(f'[aria-label="Переместить: {src}"]')
        sb = sg.bounding_box()
        last = pg.query_selector(f'[aria-label="Переместить: {base[-1]}"]').bounding_box()
        sx, sy = sb["x"] + sb["width"] / 2, sb["y"] + sb["height"] / 2
        ty = last["y"] + last["height"] + 40
        pg.mouse.move(sx, sy); pg.mouse.down(); pg.wait_for_timeout(70)
        for k in range(1, 13):
            pg.mouse.move(sx, sy + (ty - sy) * k / 12); pg.wait_for_timeout(22)
        pg.wait_for_timeout(180); pg.mouse.up(); pg.wait_for_timeout(800)
        aft = order(pg)
        if aft and aft[-1] != src:
            fails.append(f"TO_END: '{src}' landed@{aft.index(src)} (expected last)")
        ctx.close()

        # 6) AUTOSCROLL: hold the top practice at the bottom viewport edge — the list must
        #    scroll under the stationary pointer and the practice must land at the very end
        ctx, pg = fresh(); base = order(pg)
        pg.evaluate("() => { const s = document.getElementById('screen-today'); if (s) s.scrollTop = 0; }")
        pg.wait_for_timeout(300)
        src = base[0]
        st0 = scroll_top(pg)
        (sx, sy) = grip_centers(pg)[0]
        pg.mouse.move(sx, sy); pg.mouse.down(); pg.wait_for_timeout(70)
        vh = pg.viewport_size["height"]
        y = sy
        while y < vh - 40:
            y += 30; pg.mouse.move(sx, y); pg.wait_for_timeout(16)
        pg.wait_for_timeout(2500)  # hold in the edge zone — rAF loop scrolls without pointer moves
        st_mid = scroll_top(pg)
        pg.mouse.up(); pg.wait_for_timeout(900)
        aft = order(pg)
        if st_mid is None or st0 is None or st_mid <= st0:
            fails.append(f"AUTOSCROLL: list did not scroll while holding (scrollTop {st0} → {st_mid})")
        if aft and aft[-1] != src:
            fails.append(f"AUTOSCROLL: '{src}' landed@{aft.index(src)} (expected last)")
        if minus(base, src) != minus(aft, src):
            fails.append(f"AUTOSCROLL: another practice moved. before={minus(base, src)} after={minus(aft, src)}")
        ctx.close()

        # 7) WIDE: exact one-slot swap in the desktop layout
        ctx, pg = fresh(width=1024, height=800); base = order(pg)
        drag(pg, base[0], 1, frac=0.7)
        aft = order(pg)
        if aft != swap01(base):
            fails.append(f"WIDE: got {aft}, expected {swap01(base)}")
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
