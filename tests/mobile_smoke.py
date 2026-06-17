#!/usr/bin/env python3
"""
Mobile smoke test for Alchemist (390px) against the running Expo web dev server.

Covers:
  - per-screen render + no horizontal overflow + no console errors
  - Diary fixes (compact set-chips, colored +/- badges, readable inputs)
  - bottom-sheet reachability (EditorSheet + DayDetailSheet) <- the open bug

UI is in Russian (VT323 pixel font), so selectors use Russian aria-labels/text.

Usage:
  python3 tests/mobile_smoke.py [--url http://localhost:8081] [--shots /tmp/alch]
Exit code 0 = all pass, 1 = at least one failure.
"""
import sys, os, argparse
from playwright.sync_api import sync_playwright

VW, VH = 390, 844
NAV = ["Сегодня", "Герой", "Практики", "Дневник"]

results = []  # (name, passed, detail)
def check(name, passed, detail=""):
    results.append((name, bool(passed), detail))
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

def rclick(page, selector):
    """Click, falling back to a DOM click if a transparent layer fails Playwright's strict hit-test."""
    try:
        page.click(selector, timeout=3000)
    except Exception:
        page.eval_on_selector(selector, "el => el.click()")

def goto_tab(page, label):
    rclick(page, f'button[aria-label="{label}"]')
    page.wait_for_timeout(450)  # route swap + entrance anim

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8081")
    ap.add_argument("--shots", default="/tmp/alch-mobile")
    args = ap.parse_args()
    os.makedirs(args.shots, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": VW, "height": VH})
        errors = []
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        page.goto(args.url, wait_until="domcontentloaded")
        # fresh context => auth screen; enter as guest to reach the app
        try:
            page.wait_for_selector('button[aria-label="Войти как гость"]', timeout=20000)
            page.click('button[aria-label="Войти как гость"]')
        except Exception:
            pass  # session may already be active
        page.wait_for_selector('button[aria-label="Дневник"]', timeout=45000)
        # dismiss first-run onboarding overlay (intercepts taps), then let the launch FogVeil clear
        for _ in range(4):
            b = page.query_selector('button[aria-label="Пропустить"]') or page.query_selector('button[aria-label="Начать"]')
            if not b:
                break
            b.click(); page.wait_for_timeout(350)
        page.wait_for_timeout(1800)

        # ---- 1. every screen renders, no h-overflow ----
        for label in NAV:
            goto_tab(page, label)
            over = page.evaluate(
                "(vw)=>{let m=0;document.querySelectorAll('*').forEach(e=>{const w=e.getBoundingClientRect().width;if(w>vw+1&&w<5000)m=Math.max(m,w)});return Math.round(m)}", VW)
            check(f"{label}: no horizontal overflow", over == 0, f"widest={over}px" if over else "")
            page.screenshot(path=f"{args.shots}/{label}.png")

        # ---- 2. Diary fixes ----
        goto_tab(page, "Дневник")
        # 2a set-chips compact (were 60px rpgui-buttons)
        chip_h = page.evaluate("""()=>{
          const el=[...document.querySelectorAll('*')].find(e=>(e.textContent||'').trim()==='Десять' && e.children.length<=1);
          if(!el) return -1; let n=el; for(let i=0;i<4;i++){if(n.getBoundingClientRect().height>=20)break;n=n.parentElement;}
          return Math.round(n.getBoundingClientRect().height);}""")
        check("Diary: set-chip compact (<44px)", 0 < chip_h < 44, f"height={chip_h}px")
        # 2b +/- badges color-coded (plus greenish, minus reddish, not both grey #33302a)
        badge = page.evaluate("""()=>{
          const f=(g)=>{const el=[...document.querySelectorAll('div,span,p')].find(e=>e.children.length===0&&(e.textContent||'').trim()===g);return el?getComputedStyle(el).color:null};
          return {plus:f('＋'),minus:f('－')};}""")
        plus, minus = badge.get("plus"), badge.get("minus")
        check("Diary: +/- badges color-coded", bool(plus and minus and plus != minus), f"plus={plus} minus={minus}")
        # 2c input font not oversized (was 14px) + readable
        inp = page.evaluate("""()=>{const i=document.querySelector('input');return i?{fs:parseInt(getComputedStyle(i).fontSize)}:null}""")
        check("Diary: input font 16-24px (2x scale, no clip)", bool(inp and 16 <= inp["fs"] <= 24), f"fontSize={inp and inp['fs']}px")

        # ---- 3. EditorSheet reachable (THE bug) ----
        goto_tab(page, "Практики")
        rclick(page, 'button[aria-label="+ Новая"]')
        page.wait_for_timeout(700)
        head = page.evaluate("""()=>{const el=[...document.querySelectorAll('div,p,span')].find(e=>e.children.length===0&&['Новая практика','Изменить практику'].includes((e.textContent||'').trim()));
          if(!el)return null;const r=el.getBoundingClientRect();return{top:Math.round(r.top),bottom:Math.round(r.bottom)}}""")
        in_view = bool(head and head["top"] >= 0 and head["top"] < VH - 20)
        check("EditorSheet: heading visible in viewport", in_view, (f"top={head['top']} (vh={VH})" if head else "heading not found"))
        page.screenshot(path=f"{args.shots}/editor-sheet.png")
        # close the editor sheet via its X button before opening the next sheet
        rclick(page, 'button[aria-label="Закрыть"]')
        page.wait_for_timeout(500)

        # ---- 4. DayDetailSheet reachable (same Sheet component) ----
        goto_tab(page, "Герой")  # chronicle/heatmap merged into the Hero tab
        cell = page.query_selector('button[aria-label^="День"]')
        if cell:
            try:
                cell.click(timeout=3000)
            except Exception:
                cell.evaluate("el => el.click()")
            page.wait_for_timeout(700)
            dd = page.evaluate("""()=>{const el=[...document.querySelectorAll('div,p,span')].find(e=>e.children.length===0&&/^День \\d+/.test((e.textContent||'').trim()));
              if(!el)return null;const r=el.getBoundingClientRect();return{top:Math.round(r.top)}}""")
            check("DayDetailSheet: heading visible in viewport", bool(dd and 0 <= dd["top"] < VH - 20), (f"top={dd['top']}" if dd else "heading not found"))
            page.screenshot(path=f"{args.shots}/day-sheet.png")
        else:
            check("DayDetailSheet: day cell found", False, "no day cell")

        check("no console errors", len(errors) == 0, f"{len(errors)} error(s): " + " | ".join(errors[:2]) if errors else "")
        browser.close()

    passed = sum(1 for _, ok, _ in results if ok)
    print(f"\n{passed}/{len(results)} passed  (screenshots in {args.shots})")
    sys.exit(0 if passed == len(results) else 1)

if __name__ == "__main__":
    main()
