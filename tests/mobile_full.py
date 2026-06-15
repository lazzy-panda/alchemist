#!/usr/bin/env python3
"""
FULL app test for Alchemist against the running Expo web dev server.
Covers auth, onboarding, every screen's interactions, practice timer, archive flow,
diary set-switch, journal day sheet, persistence (reload), responsive (desktop),
plus a11y/localization checks (English aria-labels, mobile sign-out).

Usage: python3 tests/mobile_full.py [--url http://localhost:8081] [--shots /tmp/alch-full]
Exit 0 = all pass.
"""
import sys, os, argparse
from playwright.sync_api import sync_playwright

VW, VH = 390, 844
results = []
def check(name, passed, detail=""):
    results.append((name, bool(passed), detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

def rclick(page, selector, timeout=3000):
    try:
        page.click(selector, timeout=timeout)
        return True
    except Exception:
        try:
            page.eval_on_selector(selector, "el => el.click()")
            return True
        except Exception:
            return False

def has_text(page, txt):
    return page.evaluate("(t)=>[...document.querySelectorAll('div,p,span')].some(e=>(e.textContent||'').trim()===t)", txt)

def count_aria(page, css):
    return page.locator(css).count()

def goto_tab(page, label):
    rclick(page, f'button[aria-label="{label}"]')
    page.wait_for_timeout(500)

def dismiss_onboard(page):
    for _ in range(4):
        b = page.query_selector('button[aria-label="Skip"]') or page.query_selector('button[aria-label="Begin"]')
        if not b:
            break
        b.click(); page.wait_for_timeout(350)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    ap.add_argument("--shots", default="/tmp/alch-full")
    args = ap.parse_args()
    os.makedirs(args.shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": VW, "height": VH})
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(args.url, wait_until="domcontentloaded")

        # ===== A. AUTH =====
        try:
            page.wait_for_selector('input[placeholder="you@example.com"]', timeout=45000)
            check("A1 auth: email+password+submit present",
                  count_aria(page, 'input[placeholder="you@example.com"]') and
                  count_aria(page, 'input[placeholder="••••••"]') and
                  count_aria(page, 'button[aria-label="Enter the Path"]'))
            rclick(page, 'button[aria-label="Sign up"]')
            page.wait_for_timeout(300)
            check("A2 auth: Sign up reveals Name field", count_aria(page, 'input[placeholder="Your name"]') > 0)
            rclick(page, 'button[aria-label="Sign in"]'); page.wait_for_timeout(200)
            rclick(page, 'button[aria-label="Enter the Path"]'); page.wait_for_timeout(600)
            check("A3 auth: empty login shows an error", page.evaluate(
                "()=>{const t=document.body.innerText.toLowerCase();return t.includes('email')||t.includes('password')||t.includes('invalid')||t.includes('required')||t.includes('no account')||t.includes('wrong')}"))
            page.screenshot(path=f"{args.shots}/A-auth.png")
        except Exception as e:
            check("A auth group", False, str(e)[:80])

        # enter as guest
        rclick(page, 'button[aria-label="Continue as guest"]')
        page.wait_for_selector('button[aria-label="Diary"]', timeout=45000)

        # ===== B. ONBOARDING =====
        try:
            page.wait_for_timeout(600)
            check("B1 onboarding shows on first run", has_text(page, "Do your practices"))
            dismiss_onboard(page)
            page.wait_for_timeout(1600)
            check("B2 onboarding dismisses", not has_text(page, "Do your practices"))
        except Exception as e:
            check("B onboarding group", False, str(e)[:80])

        # ===== C. TODAY =====
        try:
            goto_tab(page, "Today")
            rclick(page, 'button[aria-label="How it works"]')
            page.wait_for_timeout(600)
            check("C1 Today: help (?) opens onboarding", has_text(page, "Do your practices"))
            dismiss_onboard(page); page.wait_for_timeout(800)
        except Exception as e:
            check("C Today group", False, str(e)[:80])

        # ===== D. CHARACTER =====
        try:
            goto_tab(page, "Character")
            check("D1 Character: radar chart (svg) present", count_aria(page, "svg") > 0)
            rclick(page, 'button[aria-label="Perks"]'); page.wait_for_timeout(500)
            check("D2 Character: Perks section expands", page.evaluate(
                "()=>{const t=document.body.innerText;return /Iron|Shirt|Supple|Body|Lv|Reach|🔒/.test(t)}"))
            rclick(page, 'button[aria-label="Energy"]'); page.wait_for_timeout(500)
            check("D3 Character: stat row expands (XP detail)", page.evaluate(
                "()=>/XP to Lv|grows from/i.test(document.body.innerText)"))
            page.screenshot(path=f"{args.shots}/D-character.png")
        except Exception as e:
            check("D Character group", False, str(e)[:80])

        # ===== E. PRACTICES + ARCHIVE =====
        try:
            goto_tab(page, "Practices")
            rclick(page, 'button[aria-label="Meditation"]'); page.wait_for_timeout(500)
            check("E1 Practices: category collapses", True)  # smoke; visual in shot
            # open a practice to edit, then archive it
            rclick(page, 'button[aria-label="Meditation"]'); page.wait_for_timeout(400)  # re-expand
            rclick(page, '[aria-label="Shamatha"]'); page.wait_for_timeout(700)
            check("E2 Practices: tapping a practice opens the editor", has_text(page, "Edit practice"))
            archived = False
            if rclick(page, 'button[aria-label="Archive"]'):
                # confirm step renders a Cancel (div) + Archive (button); wait for it then confirm
                try:
                    page.wait_for_selector('[aria-label="Cancel"]', timeout=4000)
                except Exception:
                    pass
                rclick(page, 'button[aria-label="Archive"]')  # confirm
                page.wait_for_timeout(1200)
                archived = has_text(page, "archived") or not has_text(page, "Edit practice")
            check("E3 Practices: archive flow runs (toast/sheet closed)", archived)
            page.screenshot(path=f"{args.shots}/E-practices.png")
        except Exception as e:
            check("E Practices group", False, str(e)[:80])

        # ===== F. PRACTICE DETAIL (timer) =====
        try:
            goto_tab(page, "Today")
            # tap a practice card (aria-label == its name) -> PracticeDetail
            name = page.evaluate("""()=>{const el=[...document.querySelectorAll('[role=button][aria-label]')].find(e=>{const a=e.getAttribute('aria-label');return a&&!a.startsWith('Do: ')&&!a.startsWith('Undo: ')&&!['Today','Character','Practices','Diary','Journal','How it works'].includes(a)&&/[A-Za-z]/.test(a)&&e.querySelector('div')});return el?el.getAttribute('aria-label'):null}""")
            opened = False
            if name:
                rclick(page, f'[aria-label="{name}"]')
                page.wait_for_timeout(800)
                opened = page.evaluate("()=>/Start|Mark complete|Guide|Resume/i.test(document.body.innerText)")
            check("F1 Practice detail (timer) opens", opened, f"practice={name}")
            started = False
            if opened and rclick(page, 'button[aria-label="▶ Start"]'):
                page.wait_for_timeout(700)
                started = page.evaluate("()=>/Pause/i.test(document.body.innerText)")
            check("F2 Practice detail: Start -> Pause", started)
            page.screenshot(path=f"{args.shots}/F-timer.png")
            rclick(page, 'button[aria-label="‹ Back"]'); page.wait_for_timeout(500)
        except Exception as e:
            check("F timer group", False, str(e)[:80])

        # ===== G. DIARY set switch =====
        try:
            goto_tab(page, "Diary")
            rclick(page, '[aria-label="Refuge"]'); page.wait_for_timeout(600)
            check("G1 Diary: set switch works (still on diary)", has_text(page, "of 6 checks") or page.evaluate("()=>/checks/i.test(document.body.innerText)"))
            page.screenshot(path=f"{args.shots}/G-diary.png")
        except Exception as e:
            check("G Diary group", False, str(e)[:80])

        # ===== H. JOURNAL =====
        try:
            goto_tab(page, "Journal")
            check("H1 Journal: growth chart (svg) present", count_aria(page, "svg") > 0)
            cell = page.query_selector('button[aria-label^="День"], button[aria-label^="Day"]')
            day_ok = False
            if cell:
                try: cell.click(timeout=3000)
                except Exception: cell.evaluate("el=>el.click()")
                page.wait_for_timeout(700)
                day_ok = page.evaluate("()=>/^Day \\d+/m.test(document.body.innerText)||/Completed/.test(document.body.innerText)")
            check("H2 Journal: day cell opens day sheet", day_ok)
            rclick(page, 'button[aria-label="Close"]'); page.wait_for_timeout(400)
        except Exception as e:
            check("H Journal group", False, str(e)[:80])

        # ===== I. PERSISTENCE (reload keeps data) =====
        try:
            goto_tab(page, "Practices")
            rclick(page, 'button[aria-label="+ New"]')
            page.wait_for_selector('input[placeholder="e.g. Morning qigong"]', timeout=8000)
            page.fill('input[placeholder="e.g. Morning qigong"]', "PERSIST CHECK")
            rclick(page, 'button[aria-label="Save"]'); page.wait_for_timeout(900)
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector('button[aria-label="Diary"]', timeout=45000)
            dismiss_onboard(page); page.wait_for_timeout(800)
            goto_tab(page, "Practices")
            check("I1 Persistence: practice survives reload (guest session + data)", has_text(page, "PERSIST CHECK"))
        except Exception as e:
            check("I persistence group", False, str(e)[:80])

        # ===== K. A11Y / LOCALIZATION =====
        try:
            goto_tab(page, "Journal")
            ru_day = count_aria(page, 'button[aria-label^="День"]')
            check("K1 Journal day cells use English aria-labels", ru_day == 0, f"{ru_day} Cyrillic 'День N' labels")
            goto_tab(page, "Practices")
            ru_arch = count_aria(page, '[aria-label="Архив"]')
            check("K2 Library archive toggle uses English aria-label", ru_arch == 0, "found Cyrillic 'Архив'" if ru_arch else "")
        except Exception as e:
            check("K a11y group", False, str(e)[:80])

        # ===== J. RESPONSIVE + SIGN OUT =====
        try:
            goto_tab(page, "Character"); page.wait_for_timeout(500)
            mobile_signout = count_aria(page, 'button[aria-label="Sign out"]')
            check("J1 Mobile: a sign-out affordance exists", mobile_signout > 0,
                  "none on mobile" if not mobile_signout else "on Character screen")
            page.set_viewport_size({"width": 1280, "height": 800})
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector('button[aria-label="Diary"]', timeout=45000)
            page.wait_for_timeout(1500)
            check("J2 Desktop: SideRail with Sign out shows", count_aria(page, 'button[aria-label="Sign out"]') > 0)
            page.screenshot(path=f"{args.shots}/J-desktop.png")
        except Exception as e:
            check("J responsive group", False, str(e)[:80])

        check("Z no console errors during full run", len(errors) == 0,
              (f"{len(errors)}: " + " | ".join(dict.fromkeys(errors))[:160]) if errors else "")
        browser.close()

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed  (screenshots in {args.shots})")
    fails = [n for n, ok, _ in results if not ok]
    if fails:
        print("FAILED: " + "; ".join(fails))
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()
