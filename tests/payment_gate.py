#!/usr/bin/env python3
"""
E2E test: free-tier practice cap gate (paywall) for Alchemist.

A fresh guest user can add up to FREE_PRACTICE_CAP (10) custom practices.
The 11th attempt must show the Paywall overlay with the button «Оформить за Stars».

UI is in Russian. Server must be running at http://localhost:8081.

Usage: python3 tests/payment_gate.py [--url http://localhost:8081]
Exit 0 = PASS, 1 = FAIL.
"""
import sys, os, argparse
from playwright.sync_api import sync_playwright

VW, VH = 390, 844
FREE_CAP = 10  # must match engine.js FREE_PRACTICE_CAP


def rclick(page, sel):
    """Click, falling back to a force DOM click if transparent layer blocks it."""
    try:
        page.click(sel, timeout=3000)
    except Exception:
        try:
            page.eval_on_selector(sel, "el=>el.click()")
        except Exception:
            pass


def enter(page):
    """Guest login + dismiss onboarding + wait for FogVeil to clear."""
    try:
        page.wait_for_selector('button[aria-label="Войти как гость"]', timeout=20000)
        page.click('button[aria-label="Войти как гость"]')
    except Exception:
        pass
    page.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)
    for _ in range(4):
        b = (
            page.query_selector('button[aria-label="Пропустить"]')
            or page.query_selector('button[aria-label="Начать"]')
        )
        if not b:
            break
        b.click()
        page.wait_for_timeout(350)
    page.wait_for_timeout(1800)


def open_editor(page):
    """
    Navigate to the practice library and open the + Новая editor.
    Must be called from the app main screen (after login).
    """
    # Go to the full library via the 'Все практики' button on the Today screen
    rclick(page, 'button[aria-label="Все практики"]')
    page.wait_for_timeout(500)
    # Open the new-practice editor
    rclick(page, 'button[aria-label="+ Новая"]')
    page.wait_for_selector('input[placeholder="напр. Утренний цигун"]', timeout=8000)
    page.wait_for_timeout(300)


def save_in_editor(page):
    """Scroll to and click the Сохранить button inside the editor."""
    # The editor is a full-screen scroll page; Сохранить is below the fold
    page.evaluate(
        'document.querySelector(\'button[aria-label="Сохранить"]\').scrollIntoView({behavior:"instant",block:"center"})'
    )
    page.wait_for_timeout(200)
    rclick(page, 'button[aria-label="Сохранить"]')


def add_practice(page, name):
    """
    Open the editor, fill in a name, save.

    Returns:
      "saved"        — editor closed, practice saved successfully
      "paywall"      — the Paywall appeared (gate triggered)
      "editor_open"  — unexpected: editor still open after save attempt
    """
    open_editor(page)
    page.fill('input[placeholder="напр. Утренний цигун"]', name)
    save_in_editor(page)
    # Give the app up to 2s to either close the editor or show the paywall
    page.wait_for_timeout(1200)

    # Check if paywall appeared
    if page.locator("text=Оформить за Stars").count() > 0:
        return "paywall"

    # Check if editor is still open (save failed for another reason)
    if page.locator('input[placeholder="напр. Утренний цигун"]').count() > 0:
        return "editor_open"

    return "saved"


def test_paywall_at_cap(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # fresh incognito context = clean guest each run (no localStorage bleed-over)
        ctx = browser.new_context(viewport={"width": VW, "height": VH})
        page = ctx.new_page()

        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto(url, wait_until="domcontentloaded")
        enter(page)

        # Simulate the Telegram Mini App context so the practice cap / Paywall is active.
        # On the standalone site the cap is intentionally OFF (spec §5: standalone stays free) —
        # the gate fires only when window.Telegram.WebApp.initData is present. Injected AFTER
        # login so MainApp's mount-time auth bootstrap (already ran, saw no Telegram) is untouched.
        page.evaluate(
            "() => { window.Telegram = { WebApp: { initData: 'cap_test=1', "
            "openInvoice: (l, c) => c && c('paid') } }; }"
        )

        os.makedirs("/tmp/alch-gate", exist_ok=True)

        # ── Add practices #1 through #10, each should succeed ──────────────────
        for i in range(1, FREE_CAP + 1):
            name = f"Тест практика {i}"
            result = add_practice(page, name)

            if result == "paywall":
                page.screenshot(path=f"/tmp/alch-gate/early_paywall_{i}.png")
                # Dismiss paywall before bailing
                try:
                    rclick(page, 'button[aria-label="Закрыть"]')
                    page.wait_for_timeout(400)
                except Exception:
                    pass
                browser.close()
                print(
                    f"FAIL: Paywall appeared early at practice #{i} "
                    f"(expected only after >{FREE_CAP}). "
                    f"Screenshot: /tmp/alch-gate/early_paywall_{i}.png"
                )
                raise AssertionError(
                    f"Paywall fired too early at practice #{i}; "
                    f"expected only after {FREE_CAP} custom practices."
                )

            if result != "saved":
                page.screenshot(path=f"/tmp/alch-gate/add_fail_{i}.png")
                browser.close()
                print(
                    f"FAIL: Practice #{i} did not save (result={result}). "
                    f"Screenshot: /tmp/alch-gate/add_fail_{i}.png"
                )
                raise AssertionError(
                    f"Practice #{i} save failed unexpectedly (result={result})."
                )

            print(f"  [OK] Practice #{i} saved")

        # ── 11th attempt — Paywall must appear ─────────────────────────────────
        print(f"  Attempting practice #{FREE_CAP + 1} (should trigger Paywall)...")
        open_editor(page)
        page.fill('input[placeholder="напр. Утренний цигун"]', f"Тест практика {FREE_CAP + 1}")
        page.screenshot(path="/tmp/alch-gate/before_11th_save.png")
        save_in_editor(page)

        # Wait for the paywall button to appear
        try:
            page.get_by_text("Оформить за Stars", exact=False).first.wait_for(timeout=5000)
        except Exception:
            page.screenshot(path="/tmp/alch-gate/no_paywall.png")
            dom_text = page.evaluate("()=>document.body.innerText.slice(0,800)")
            browser.close()
            print(
                f"FAIL: Paywall did NOT appear after {FREE_CAP + 1}th practice attempt.\n"
                f"DOM text snippet: {dom_text}\n"
                f"Screenshot: /tmp/alch-gate/no_paywall.png"
            )
            raise AssertionError(
                f"Paywall ('Оформить за Stars') not found after {FREE_CAP + 1}th practice attempt."
            )

        paywall_count = page.get_by_text("Оформить за Stars", exact=False).count()
        assert paywall_count >= 1, (
            f"Expected Paywall button count >= 1, got {paywall_count}"
        )

        page.screenshot(path="/tmp/alch-gate/paywall_visible.png")
        browser.close()

        print(f"\nPAYWALL_AT_CAP: PASS")
        print(f"  Paywall appeared correctly after {FREE_CAP} custom practices.")
        print(f"  Screenshot: /tmp/alch-gate/paywall_visible.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    args = ap.parse_args()
    test_paywall_at_cap(args.url)


if __name__ == "__main__":
    main()
