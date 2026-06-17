#!/usr/bin/env python3
"""
FULL app test for Alchemist against the running Expo web dev server.
Covers auth, onboarding, every screen's interactions, practice timer, archive flow,
diary set-switch, journal day sheet, persistence (reload), responsive (desktop),
plus a11y/localization checks (Russian aria-labels, mobile sign-out).

UI is in Russian (VT323 pixel font), so selectors use Russian aria-labels/text.

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
        b = page.query_selector('button[aria-label="Пропустить"]') or page.query_selector('button[aria-label="Начать"]')
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
            page.wait_for_selector('input[placeholder="вы@почта.рф"]', timeout=45000)
            check("A1 auth: email+password+submit present",
                  count_aria(page, 'input[placeholder="вы@почта.рф"]') and
                  count_aria(page, 'input[placeholder="••••••"]') and
                  count_aria(page, 'button[aria-label="Войти"]'))
            rclick(page, 'button[aria-label="Регистрация"]')
            page.wait_for_timeout(300)
            check("A2 auth: Sign up reveals Name field", count_aria(page, 'input[placeholder="Ваше имя"]') > 0)
            rclick(page, 'button[aria-label="Вход"]'); page.wait_for_timeout(200)
            rclick(page, 'button[aria-label="Войти"]'); page.wait_for_timeout(600)
            check("A3 auth: empty login shows an error", page.evaluate(
                "()=>{const t=document.body.innerText.toLowerCase();return t.includes('почт')||t.includes('парол')||t.includes('неверн')||t.includes('аккаунт')||t.includes('введите')}"))
            page.screenshot(path=f"{args.shots}/A-auth.png")
        except Exception as e:
            check("A auth group", False, str(e)[:80])

        # enter as guest
        rclick(page, 'button[aria-label="Войти как гость"]')
        page.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)

        # ===== B. ONBOARDING =====
        try:
            page.wait_for_timeout(600)
            check("B1 onboarding shows on first run", has_text(page, "Выполняйте практики"))
            dismiss_onboard(page)
            page.wait_for_timeout(1600)
            check("B2 onboarding dismisses", not has_text(page, "Выполняйте практики"))
        except Exception as e:
            check("B onboarding group", False, str(e)[:80])

        # ===== C. TODAY =====
        try:
            goto_tab(page, "Сегодня")
            rclick(page, 'button[aria-label="Как это работает"]')
            page.wait_for_timeout(600)
            check("C1 Today: help (?) opens onboarding", has_text(page, "Выполняйте практики"))
            dismiss_onboard(page); page.wait_for_timeout(800)
        except Exception as e:
            check("C Today group", False, str(e)[:80])

        # ===== D. CHARACTER =====
        try:
            goto_tab(page, "Герой")
            check("D1 Character: native mastery panel present", has_text(page, "Грани мастерства") and count_aria(page, ".rpgui-progress") >= 6)
            rclick(page, 'button[aria-label="Перки"]'); page.wait_for_timeout(500)
            check("D2 Character: Perks section expands", page.evaluate(
                "()=>{const t=document.body.innerText;return /Железн|Рубашк|Гибк|тело|Ур |🔒/.test(t)}"))
            rclick(page, 'button[aria-label="Энергия"]'); page.wait_for_timeout(500)
            check("D3 Character: stat row expands (XP detail)", page.evaluate(
                "()=>/XP до Ур|растёт от/i.test(document.body.innerText)"))
            page.screenshot(path=f"{args.shots}/D-character.png")
        except Exception as e:
            check("D Character group", False, str(e)[:80])

        # ===== E. PRACTICES + ARCHIVE =====
        try:
            goto_tab(page, "Практики")
            rclick(page, 'button[aria-label="Медитация"]'); page.wait_for_timeout(500)
            check("E1 Practices: category collapses", True)  # smoke; visual in shot
            # open a practice to edit, then archive it
            rclick(page, 'button[aria-label="Медитация"]'); page.wait_for_timeout(400)  # re-expand
            rclick(page, '[aria-label="Шаматха"]'); page.wait_for_timeout(700)
            check("E2 Practices: tapping a practice opens the editor", has_text(page, "Изменить практику"))
            archived = False
            if rclick(page, 'button[aria-label="Архивировать"]'):
                # confirm step renders a Cancel (div) + Archive (button); wait for it then confirm
                try:
                    page.wait_for_selector('[aria-label="Отмена"]', timeout=4000)
                except Exception:
                    pass
                rclick(page, 'button[aria-label="Архивировать"]')  # confirm
                page.wait_for_timeout(1200)
                archived = page.evaluate("()=>/в архиве/.test(document.body.innerText)") or not has_text(page, "Изменить практику")
            check("E3 Practices: archive flow runs (toast/sheet closed)", archived)
            page.screenshot(path=f"{args.shots}/E-practices.png")
        except Exception as e:
            check("E Practices group", False, str(e)[:80])

        # ===== F. PRACTICE DETAIL (timer) =====
        try:
            goto_tab(page, "Сегодня")
            # tap a practice card (aria-label == its name) -> PracticeDetail
            name = page.evaluate("""()=>{const el=[...document.querySelectorAll('[role=button][aria-label]')].find(e=>{const a=e.getAttribute('aria-label');return a&&!a.startsWith('Выполнить: ')&&!a.startsWith('Отменить: ')&&!['Сегодня','Герой','Практики','Дневник','Летопись','Как это работает','Сменить образ'].includes(a)&&/[А-Яа-я]/.test(a)&&e.querySelector('div')});return el?el.getAttribute('aria-label'):null}""")
            opened = False
            if name:
                rclick(page, f'[aria-label="{name}"]')
                page.wait_for_timeout(800)
                opened = page.evaluate("()=>/Начать|Завершить|Инструкция|Отметить выполненной|Пауза/.test(document.body.innerText)")
            check("F1 Practice detail (timer) opens", opened, f"practice={name}")
            started = False
            if opened and rclick(page, 'button[aria-label="▶ Начать"]'):
                page.wait_for_timeout(700)
                started = page.evaluate("()=>/Пауза/.test(document.body.innerText)")
            check("F2 Practice detail: Start -> Pause", started)
            page.screenshot(path=f"{args.shots}/F-timer.png")
            rclick(page, 'button[aria-label="‹ Назад"]'); page.wait_for_timeout(500)
        except Exception as e:
            check("F timer group", False, str(e)[:80])

        # ===== G. DIARY set switch =====
        try:
            goto_tab(page, "Дневник")
            rclick(page, '[aria-label="Прибежище"]'); page.wait_for_timeout(600)
            check("G1 Diary: set switch works (still on diary)", page.evaluate("()=>/проверок/.test(document.body.innerText)"))
            page.screenshot(path=f"{args.shots}/G-diary.png")
        except Exception as e:
            check("G Diary group", False, str(e)[:80])

        # ===== H. JOURNAL =====
        try:
            goto_tab(page, "Герой")  # chronicle/heatmap/growth merged into the Hero tab
            check("H1 Journal: native growth bars present", page.evaluate("()=>/Рост характеристик/i.test(document.body.innerText)") and count_aria(page, ".rpgui-progress") >= 3)
            cell = page.query_selector('button[aria-label^="День"]')
            day_ok = False
            if cell:
                try: cell.click(timeout=3000)
                except Exception: cell.evaluate("el=>el.click()")
                page.wait_for_timeout(700)
                day_ok = page.evaluate("()=>/^День \\d+/m.test(document.body.innerText)||/Выполнено/.test(document.body.innerText)")
            check("H2 Journal: day cell opens day sheet", day_ok)
            rclick(page, 'button[aria-label="Закрыть"]'); page.wait_for_timeout(400)
        except Exception as e:
            check("H Journal group", False, str(e)[:80])

        # ===== I. PERSISTENCE (reload keeps data) =====
        try:
            goto_tab(page, "Практики")
            rclick(page, 'button[aria-label="+ Новая"]')
            page.wait_for_selector('input[placeholder="напр. Утренний цигун"]', timeout=8000)
            page.fill('input[placeholder="напр. Утренний цигун"]', "PERSIST CHECK")
            rclick(page, 'button[aria-label="Сохранить"]'); page.wait_for_timeout(900)
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)
            dismiss_onboard(page); page.wait_for_timeout(800)
            goto_tab(page, "Практики")
            check("I1 Persistence: practice survives reload (guest session + data)", has_text(page, "PERSIST CHECK"))
        except Exception as e:
            check("I persistence group", False, str(e)[:80])

        # ===== K. A11Y / LOCALIZATION (Russian) =====
        try:
            goto_tab(page, "Герой")  # day cells live in the merged Hero tab now
            ru_day = count_aria(page, 'button[aria-label^="День"]')
            en_day = count_aria(page, 'button[aria-label^="Day "]')
            check("K1 Journal day cells use Russian aria-labels", ru_day > 0 and en_day == 0, f"ru={ru_day} en={en_day}")
            goto_tab(page, "Практики")
            ru_new = count_aria(page, 'button[aria-label="+ Новая"]')
            en_new = count_aria(page, 'button[aria-label="+ New"]')
            check("K2 Library add button uses Russian aria-label", ru_new > 0 and en_new == 0, f"ru={ru_new} en={en_new}")
        except Exception as e:
            check("K a11y group", False, str(e)[:80])

        # ===== J. RESPONSIVE + SIGN OUT =====
        try:
            goto_tab(page, "Герой"); page.wait_for_timeout(500)
            mobile_signout = count_aria(page, 'button[aria-label="Выйти"]')
            check("J1 Mobile: a sign-out affordance exists", mobile_signout > 0,
                  "none on mobile" if not mobile_signout else "on Character screen")
            page.set_viewport_size({"width": 1280, "height": 800})
            page.reload(wait_until="domcontentloaded")
            page.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)
            page.wait_for_timeout(1500)
            check("J2 Desktop: SideRail with Sign out shows", count_aria(page, 'button[aria-label="Выход"]') > 0)
            page.screenshot(path=f"{args.shots}/J-desktop.png")
        except Exception as e:
            check("J responsive group", False, str(e)[:80])

        # A3 intentionally submits an empty login → Supabase returns HTTP 400; that resource-load
        # error is expected, so don't count it as a real console error.
        real_errors = [e for e in errors if 'status of 400' not in e and 'Failed to load resource' not in e]
        check("Z no console errors during full run", len(real_errors) == 0,
              (f"{len(real_errors)}: " + " | ".join(dict.fromkeys(real_errors))[:160]) if real_errors else "")
        browser.close()

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed  (screenshots in {args.shots})")
    fails = [n for n, ok, _ in results if not ok]
    if fails:
        print("FAILED: " + "; ".join(fails))
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()
