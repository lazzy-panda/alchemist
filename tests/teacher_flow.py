#!/usr/bin/env python3
"""
E2E test: happy-path teacher-ambassador flow (Task 10).

Proves the full loop:
  1. A teacher enables teacher mode and receives a referral code.
  2. A student who arrives with that code as the Telegram start_param is
     attributed to the teacher in the hosted Supabase DB.
  3. After attribution the teacher's dashboard shows the student (empty-state
     text «Пока никто не присоединился» is gone).

Runs against the LOCAL app (http://localhost:8081) talking to the hosted backend.

Usage: python3 tests/teacher_flow.py [--url http://localhost:8081]
Exit 0 = PASS, exit non-zero = FAIL / BLOCKED.
"""
import sys
import os
import argparse
import subprocess
import time
import urllib.request
import urllib.error

from playwright.sync_api import sync_playwright

VW, VH = 390, 844
SCREENSHOT_DIR = "/tmp/teach-flow"
URL = "http://localhost:8081"


# ── helpers ────────────────────────────────────────────────────────────────────

def rclick(page, sel, timeout=5000):
    """Click a selector, falling back to a DOM .click() if an overlay blocks it."""
    try:
        page.click(sel, timeout=timeout)
    except Exception:
        try:
            page.eval_on_selector(sel, "el => el.click()")
        except Exception:
            pass


def enter(page):
    """Guest login + dismiss onboarding + wait for FogVeil to clear."""
    try:
        page.wait_for_selector('button[aria-label="Войти как гость"]', timeout=25000)
        page.click('button[aria-label="Войти как гость"]')
    except Exception:
        pass
    # Wait for main nav to be ready (Дневник tab is always present)
    page.wait_for_selector('button[aria-label="Дневник"]', timeout=60000)
    for _ in range(5):
        b = (
            page.query_selector('button[aria-label="Пропустить"]')
            or page.query_selector('button[aria-label="Начать"]')
        )
        if not b:
            break
        b.click()
        page.wait_for_timeout(400)
    page.wait_for_timeout(1800)


def screenshot(page, name):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    page.screenshot(path=path)
    return path


def dom_snippet(page):
    try:
        return page.evaluate("() => document.body.innerText.slice(0, 1200)")
    except Exception:
        return "<unable to get DOM>"


# ── server lifecycle ────────────────────────────────────────────────────────────

def start_server():
    """Start expo web server in background, return the Popen handle."""
    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env = dict(os.environ)
    env.setdefault("CI", "1")            # suppress interactive prompts
    env["EXPO_NO_TYPESCRIPT_SETUP"] = "1"
    proc = subprocess.Popen(
        ["npx", "expo", "start", "--web", "--port", "8081"],
        cwd=repo,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env,
    )
    return proc


def wait_for_server(url=URL, timeout=120):
    """Poll the server until it responds (≤ timeout seconds)."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=3)
            return True
        except Exception:
            time.sleep(2)
    return False


def kill_server(proc):
    """Kill the bundler process and any leftover expo start --web --port 8081."""
    try:
        proc.terminate()
        proc.wait(timeout=8)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass
    # belt-and-suspenders: kill any stray expo that kept the port
    try:
        subprocess.run(
            ["pkill", "-f", "expo start --web --port 8081"],
            check=False,
            timeout=5,
        )
    except Exception:
        pass


# ── main test ──────────────────────────────────────────────────────────────────

def test_teacher_flow(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ── 1. TEACHER CONTEXT ─────────────────────────────────────────────────
        print("[1] Teacher context: guest login + enable teacher mode…")
        teacher_ctx = browser.new_context(viewport={"width": VW, "height": VH})
        teacher_page = teacher_ctx.new_page()

        teacher_page.goto(url, wait_until="domcontentloaded")
        enter(teacher_page)

        # Navigate to Hero/Character screen
        try:
            teacher_page.click('button[aria-label="Герой"]', timeout=8000)
        except Exception:
            path = screenshot(teacher_page, "t1_no_hero_tab")
            dom = dom_snippet(teacher_page)
            browser.close()
            print(f"FAIL: Could not click «Герой» nav tab.\nScreenshot: {path}\nDOM: {dom}")
            raise AssertionError("«Герой» nav tab not found")

        teacher_page.wait_for_timeout(800)

        # Click the «Кабинет учителя» entry link on the Character screen
        try:
            teacher_page.click('button[aria-label="Кабинет учителя"]', timeout=8000)
        except Exception:
            # Fallback: scroll down to find it, then try get_by_text
            teacher_page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            teacher_page.wait_for_timeout(600)
            try:
                teacher_page.get_by_text("Кабинет учителя", exact=False).first.click(timeout=5000)
            except Exception:
                path = screenshot(teacher_page, "t1_no_teacher_btn")
                dom = dom_snippet(teacher_page)
                browser.close()
                print(f"FAIL: «Кабинет учителя» button not found on Hero screen.\nScreenshot: {path}\nDOM: {dom}")
                raise AssertionError("«Кабинет учителя» button not found on Hero screen")

        teacher_page.wait_for_timeout(1000)

        # Enable teacher mode
        try:
            teacher_page.get_by_text("Включить режим учителя", exact=False).first.click(timeout=8000)
        except Exception:
            path = screenshot(teacher_page, "t1_no_enable_btn")
            dom = dom_snippet(teacher_page)
            browser.close()
            print(f"FAIL: «Включить режим учителя» button not found.\nScreenshot: {path}\nDOM: {dom}")
            raise AssertionError("«Включить режим учителя» not found")

        # Wait for the referral link card to appear
        try:
            teacher_page.wait_for_function(
                "() => document.body.innerText.includes('startapp=')",
                timeout=15000,
            )
        except Exception:
            path = screenshot(teacher_page, "t1_no_referral_link")
            dom = dom_snippet(teacher_page)
            browser.close()
            print(f"FAIL: Referral link with 'startapp=' did not appear after enabling teacher mode.\nScreenshot: {path}\nDOM: {dom}")
            raise AssertionError("Referral link not found after enabling teacher mode")

        # Extract the referral code from the page text
        page_text = teacher_page.evaluate("() => document.body.innerText")
        # Find the line/segment containing startapp=
        code = None
        for segment in page_text.split():
            if "startapp=" in segment:
                code = segment.split("startapp=")[1].strip().strip('"').strip("'")
                break
        if not code:
            path = screenshot(teacher_page, "t1_code_parse_fail")
            browser.close()
            print(f"FAIL: Could not parse referral code from page text.\nPage text snippet: {page_text[:600]}\nScreenshot: {path}")
            raise AssertionError("Could not parse referral code from page text")

        print(f"  Referral code extracted: {code!r}")
        assert code, "Referral code must be non-empty"

        screenshot(teacher_page, "t1_teacher_enabled")
        print("  Teacher mode enabled. ✓")

        # ── 2. STUDENT CONTEXT ────────────────────────────────────────────────
        print(f"[2] Student context: arrive with start_param={code!r}…")
        student_ctx = browser.new_context(viewport={"width": VW, "height": VH})
        student_page = student_ctx.new_page()

        # Inject Telegram WebApp stub BEFORE any navigation so the app sees it on mount
        tg_stub = (
            "window.Telegram = {"
            "  WebApp: {"
            "    initData: 'x',"
            f"   initDataUnsafe: {{ start_param: '{code}' }},"
            "    openInvoice: (l, c) => c && c('paid')"
            "  }"
            "};"
        )
        student_page.add_init_script(tg_stub)

        student_page.goto(url, wait_until="domcontentloaded")
        enter(student_page)

        # Give the attribution effect time to call attribute_to_teacher against the hosted DB
        student_page.wait_for_timeout(4000)

        screenshot(student_page, "t2_student_landed")
        print("  Student arrived and waited for attribution. ✓")

        # ── 3. TEACHER DASHBOARD REFRESH + ASSERT ────────────────────────────
        print("[3] Teacher: refresh dashboard and verify student appeared…")

        def _refresh_and_check(teacher_page):
            """Navigate away and back to the teacher screen to reload dashboard."""
            # Go to Today tab, then back to Teacher tab (added after enabling mode)
            try:
                teacher_page.click('button[aria-label="Сегодня"]', timeout=5000)
                teacher_page.wait_for_timeout(600)
                teacher_page.click('button[aria-label="Учитель"]', timeout=5000)
                teacher_page.wait_for_timeout(1500)
                return True
            except Exception:
                pass
            # Fallback: click «Кабинет учителя» link on the Hero screen
            try:
                teacher_page.click('button[aria-label="Герой"]', timeout=4000)
                teacher_page.wait_for_timeout(600)
                teacher_page.click('button[aria-label="Кабинет учителя"]', timeout=5000)
                teacher_page.wait_for_timeout(1500)
                return True
            except Exception:
                return False

        _refresh_and_check(teacher_page)

        empty_state_gone = teacher_page.get_by_text("Пока никто не присоединился", exact=False).count() == 0

        if not empty_state_gone:
            # Retry once after another pause
            print("  Empty-state still visible — waiting 2.5s and retrying…")
            teacher_page.wait_for_timeout(2500)
            _refresh_and_check(teacher_page)
            empty_state_gone = teacher_page.get_by_text("Пока никто не присоединился", exact=False).count() == 0

        path_dash = screenshot(teacher_page, "t3_teacher_dashboard")

        if not empty_state_gone:
            dom = dom_snippet(teacher_page)
            browser.close()
            print(
                f"FAIL: Teacher dashboard still shows «Пока никто не присоединился» after student attribution.\n"
                f"Screenshot: {path_dash}\n"
                f"DOM snippet: {dom}"
            )
            raise AssertionError(
                "Teacher dashboard empty-state persists after student attributed via start_param."
            )

        browser.close()
        print("\nTEACHER_FLOW: PASS")
        print(f"  Referral code: {code!r}")
        print(f"  Dashboard screenshot: {path_dash}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default=URL)
    ap.add_argument("--no-server", action="store_true", help="Skip launching the dev server (assume it's already running)")
    args = ap.parse_args()

    target_url = args.url

    if args.no_server:
        test_teacher_flow(target_url)
        return

    # Start the server
    print("Starting expo web server on port 8081…")
    proc = start_server()

    try:
        print("Waiting for server to be ready (up to 120s)…")
        if not wait_for_server(target_url):
            proc.terminate()
            print("FAIL: Server did not start within 120s.")
            sys.exit(1)
        print("Server ready.\n")

        test_teacher_flow(target_url)
    finally:
        print("\nStopping server…")
        kill_server(proc)


if __name__ == "__main__":
    main()
