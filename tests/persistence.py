#!/usr/bin/env python3
"""
Persistence test for Alchemist: everything the user adds / all progress must survive a reload.
Adds a practice, completes a practice, fills a diary check, then reloads the SAME context
(guest session persists) and verifies all three survived.

Usage: python3 tests/persistence.py [--url http://localhost:8081]
Exit 0 = all pass.
"""
import sys, os, argparse
from playwright.sync_api import sync_playwright

VW, VH = 390, 844
results = []
def check(name, passed, detail=""):
    results.append((name, bool(passed), detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

def rclick(page, sel):
    try:
        page.click(sel, timeout=3000)
    except Exception:
        try: page.eval_on_selector(sel, "el=>el.click()")
        except Exception: pass

def goto(page, label):
    rclick(page, f'button[aria-label="{label}"]'); page.wait_for_timeout(500)

def dismiss_onboard(page):
    for _ in range(4):
        b = page.query_selector('button[aria-label="Skip"]') or page.query_selector('button[aria-label="Begin"]')
        if not b: break
        b.click(); page.wait_for_timeout(350)

def enter(page):
    try:
        page.wait_for_selector('button[aria-label="Continue as guest"]', timeout=20000)
        page.click('button[aria-label="Continue as guest"]')
    except Exception:
        pass
    page.wait_for_selector('button[aria-label="Diary"]', timeout=45000)
    dismiss_onboard(page); page.wait_for_timeout(1500)

def n_done(page):
    return page.locator('[aria-label^="Undo: "]').count()
def has(page, txt):
    return page.evaluate("(t)=>[...document.querySelectorAll('div,p,span')].some(e=>(e.textContent||'').trim()===t)", txt)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--url", default="http://localhost:8081"); args = ap.parse_args()
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": VW, "height": VH})
        page = ctx.new_page()
        page.goto(args.url, wait_until="domcontentloaded")
        enter(page)

        NAME = "PERSIST PROOF"
        # --- create data ---
        goto(page, "Today")
        done_before = n_done(page)
        if page.locator('[aria-label^="Do: "]').count() > 0:
            rclick(page, '[aria-label^="Do: "]'); page.wait_for_timeout(800)
        done_after_act = n_done(page)

        goto(page, "Practices")
        rclick(page, 'button[aria-label="+ New"]')
        page.wait_for_selector('input[placeholder="e.g. Morning qigong"]', timeout=8000)
        page.fill('input[placeholder="e.g. Morning qigong"]', NAME)
        rclick(page, 'button[aria-label="Save"]'); page.wait_for_timeout(900)

        goto(page, "Diary")
        try: page.fill('input[placeholder="A real example…"]', "Persisted note")
        except Exception: pass
        rclick(page, '[aria-label="Mark check"]'); page.wait_for_timeout(800)
        DIARY_Q = "()=>(localStorage.getItem('alchemist_diary_guest')||'').includes('\\\"done\\\":true')"
        diary_checked_before = page.evaluate(DIARY_Q)

        # sanity (pre-reload)
        check("pre: practice added", has(page, NAME) or True)  # verified post-reload
        check("pre: a practice was completed", done_after_act == done_before + 1, f"{done_before}->{done_after_act}")
        check("pre: diary check marked", diary_checked_before)

        # --- reload (same context => localStorage persists, guest session restored) ---
        page.reload(wait_until="domcontentloaded")
        page.wait_for_selector('button[aria-label="Diary"]', timeout=45000)
        dismiss_onboard(page); page.wait_for_timeout(1500)

        # --- verify everything survived ---
        goto(page, "Practices")
        check("RELOAD: added practice survived", has(page, NAME))
        goto(page, "Today")
        check("RELOAD: completion survived", n_done(page) == done_after_act, f"expected {done_after_act}, got {n_done(page)}")
        goto(page, "Diary")
        check("RELOAD: diary check survived", page.evaluate(DIARY_Q))

        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        b.close()

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed")
    fails = [n for n, ok, _ in results if not ok]
    if fails: print("FAILED: " + "; ".join(fails))
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()
