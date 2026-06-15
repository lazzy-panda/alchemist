#!/usr/bin/env python3
"""
Mobile FUNCTIONAL flow tests for Alchemist (390px) against the running Expo web dev server.
Exercises real user journeys (not just layout):
  1. Add a practice (Practices -> + New -> fill -> Save -> appears in list)
  2. Complete a practice on Today (tap check -> done count rises)
  3. Diary check (type + Mark check -> shows checked)

Usage: python3 tests/mobile_flows.py [--url http://localhost:8081] [--shots /tmp/alch-flows]
Exit 0 = all pass.
"""
import sys, os, argparse
from playwright.sync_api import sync_playwright

VW, VH = 390, 844
results = []
def check(name, passed, detail=""):
    results.append((name, bool(passed), detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

def rclick(page, selector):
    try:
        page.click(selector, timeout=3000)
    except Exception:
        page.eval_on_selector(selector, "el => el.click()")

def goto_tab(page, label):
    rclick(page, f'button[aria-label="{label}"]')
    page.wait_for_timeout(500)

def setup(page):
    """Reach the app: guest login + dismiss first-run onboarding + let FogVeil clear."""
    try:
        page.wait_for_selector('button[aria-label="Continue as guest"]', timeout=20000)
        page.click('button[aria-label="Continue as guest"]')
    except Exception:
        pass
    page.wait_for_selector('button[aria-label="Diary"]', timeout=45000)
    for _ in range(4):
        b = page.query_selector('button[aria-label="Skip"]') or page.query_selector('button[aria-label="Begin"]')
        if not b:
            break
        b.click(); page.wait_for_timeout(350)
    page.wait_for_timeout(1800)

def count_text(page, txt):
    return page.evaluate("(t)=>[...document.querySelectorAll('div,p,span')].filter(e=>e.children.length===0&&(e.textContent||'').trim()===t).length", txt)

def count_aria_prefix(page, prefix):
    return page.evaluate("(p)=>[...document.querySelectorAll('[aria-label]')].filter(e=>e.getAttribute('aria-label').startsWith(p)).length", prefix)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    ap.add_argument("--shots", default="/tmp/alch-flows")
    args = ap.parse_args()
    os.makedirs(args.shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": VW, "height": VH})
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(args.url, wait_until="domcontentloaded")
        setup(page)

        NAME = "QA Test Practice"

        # ---- FLOW 1: add a practice ----
        goto_tab(page, "Practices")
        before = count_text(page, NAME)
        rclick(page, 'button[aria-label="+ New"]')
        page.wait_for_selector('input[placeholder="e.g. Morning qigong"]', timeout=8000)
        page.fill('input[placeholder="e.g. Morning qigong"]', NAME)
        # pick a reward stat (aria-label unique to the sheet; categories collide with Library headers)
        try:
            rclick(page, '[aria-label="Strength"]')
        except Exception:
            pass
        page.screenshot(path=f"{args.shots}/add-1-form.png")
        rclick(page, 'button[aria-label="Save"]')
        page.wait_for_timeout(900)  # sheet close (290ms) + list update
        after = count_text(page, NAME)
        check("Add practice: appears in library after Save", after > before, f"before={before} after={after}")
        page.screenshot(path=f"{args.shots}/add-2-list.png")

        # ---- FLOW 2: complete a practice on Today ----
        goto_tab(page, "Today")
        done_before = count_aria_prefix(page, "Undo: ")
        todo_before = count_aria_prefix(page, "Do: ")
        if todo_before > 0:
            rclick(page, '[aria-label^="Do: "]')
            page.wait_for_timeout(900)
            done_after = count_aria_prefix(page, "Undo: ")
            check("Complete practice: done count rises", done_after == done_before + 1,
                  f"done {done_before}->{done_after} (todo was {todo_before})")
        else:
            check("Complete practice: a pending practice exists", False, "no 'Do:' checks found")
        page.screenshot(path=f"{args.shots}/complete-today.png")

        # ---- FLOW 3: diary check ----
        goto_tab(page, "Diary")
        checked_before = count_text(page, "✓ checked")
        # first check is open by default; fill its Plus input then mark
        try:
            page.fill('input[placeholder="A real example…"]', "Helped a neighbour")
        except Exception:
            pass
        marked = False
        try:
            rclick(page, '[aria-label="Mark check"]')
            marked = True
        except Exception:
            pass
        page.wait_for_timeout(900)
        checked_after = count_text(page, "✓ checked")
        check("Diary: marking a check shows it as checked", marked and checked_after > checked_before,
              f"checked {checked_before}->{checked_after}")
        page.screenshot(path=f"{args.shots}/diary-check.png")

        check("no console errors during flows", len(errors) == 0,
              (f"{len(errors)}: " + " | ".join(errors[:2])) if errors else "")
        browser.close()

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed  (screenshots in {args.shots})")
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()
