#!/usr/bin/env python3
"""
E2E regression test: all-time accumulated practice time survives a fresh session.

Guards the "header med/qi time resets every day" bug: the debounced (600ms) cloud
save dropped the user's LAST action before closing (ticking practices, which bumps
the accumulated time), so the totals reverted each session. The fix flushes the
pending cloud save on visibilitychange(hidden) / pagehide.

The test: complete a meditation practice, fire the flush, DROP the local game cache
(keeping the auth session — i.e. a fresh Mini-App session that can only read cloud),
reload, and assert the time is still there (loaded from cloud).

Run with the web dev server up:  npx expo start --web --port 8081
    python3 tests/time_persist.py [--url http://localhost:8081]
Exit 0 = PASS, 1 = FAIL.
"""
import sys
import argparse
from playwright.sync_api import sync_playwright


def login(pg):
    try:
        pg.wait_for_selector('button[aria-label="Войти как гость"]', timeout=4000)
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


def med_chip(pg):
    el = pg.query_selector('[aria-label="Часы медитации"]')
    return (el.inner_text() or "").strip() if el else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    args = ap.parse_args()

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_context(viewport={"width": 390, "height": 844}).new_page()
        pg.goto(args.url, wait_until="domcontentloaded")
        login(pg)

        # accumulate time: complete the meditation practice (20 min → "0,3ч")
        sel = 'button[aria-label="Выполнить: Даосская медитация"]'
        if not pg.query_selector(sel):
            print("DRAG note: meditation practice not found; using the first practice instead")
            sel = '[aria-label^="Выполнить:"]'
        pg.click(sel); pg.wait_for_timeout(1200)
        t1 = med_chip(pg)

        # flush the debounced cloud save (what the app does on hide/close), then wait for the write
        pg.evaluate("window.dispatchEvent(new Event('pagehide'))")
        pg.wait_for_timeout(2500)

        # fresh Mini-App session: drop the local game cache, keep the auth session
        pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('alchemist_game_')).forEach(k=>localStorage.removeItem(k))")
        pg.reload(wait_until="domcontentloaded")
        login(pg)
        pg.wait_for_timeout(1500)
        t2 = med_chip(pg)

        b.close()

    print(f"after complete: {t1!r} | after fresh session (cloud): {t2!r}")
    if t1 and t1 not in ("0ч", "0м") and t2 == t1:
        print("TIME_PERSIST: PASS")
        sys.exit(0)
    print("TIME_PERSIST: FAIL — accumulated time did not survive the fresh session")
    sys.exit(1)


if __name__ == "__main__":
    main()
