# UI element ids — reference catalog

Every interactive and structural UI element carries a stable **DOM `id`** so you can point
at a specific element (e.g. "fix `today-chip-med`", "the `editor-save` button is off").

**How it works:** components take a `nativeID` prop; react-native-web renders it as the DOM
`id`. The shared primitives (`Btn`, `Card`, `SectionHead`, `MetricChip`, `WillBar`, `Avatar`,
`KitButton`, `KitPanel`, `KitClose`, `KitCheckbox`, `KitBar`, `KitGem`, `Input`/`DiaryInput`,
`SelChip`, `Stepper`, `ScreenScroll`, `PadView`) forward `nativeID` to their root, so any of
them — or a plain `View`/`Text`/`Pressable` — gets an id by adding `nativeID="..."`.

**Naming:** kebab-case `<area>-<element>`. Repeated items embed their stable key/id
(e.g. `practice-card-<practiceId>`, `character-stat-<statKey>`, `teacher-student-<studentId>`).

**In the browser:** inspect any element to see its `id`, or select it as `#the-id`. The ids
are also clickable selectors (verified: `#nav-tab-character`, `#today-add-practice`, etc.).

---

## App shell & navigation
- `app-root` — outermost container
- `app-screen-<route>` — active screen wrapper (`app-screen-today`, `app-screen-character`, …)
- `app-overlays` — overlay layer (box-none; doesn't block touches)
- `nav-tab-<key>` — footer / side-rail tab: `nav-tab-today`, `nav-tab-character`, `nav-tab-diary` (and `nav-tab-teacher` once teacher mode is on)

## Today (`screen-today`)
- `today-hero` · `today-avatar` · `today-menu` (☰) · `today-help` (?)
- `today-chip-med` · `today-chip-qi` · `today-chip-know` · `today-chip-body` · `today-chip-streak` — the five header metric chips
- `today-will` — the «Воля» bar · `today-summary` — the «N из M / +XP» ribbon
- `today-complete-all` — «Выполнить всё» · `today-add-practice` — «+ Добавить практику»
- `practice-card-<practiceId>` — a practice row · `practice-check-<practiceId>` — its checkbox
- `today-grip-<practiceId>` — the drag grip of a practice row (aria-label `Переместить: <name>`)

## Character (`screen-character`)
- `character-overview` (mastery card) · `character-overview-stat-<statKey>` · `character-help`
- `character-hp` · `character-qi` (resource cards)
- `character-section-stats` / `character-section-perks` / `character-section-relics` — collapsible section headers
- `character-stats` (card) · `character-stat-<statKey>` — each stat row (e.g. `character-stat-energy`)
- `character-perks` · `character-perk-<i>` · `character-relics` · `character-relic-<i>`
- `character-chronicle-divider` · `character-signout`

## Journal (`screen-journal`)
- `journal-hero` · `journal-heatmap-head` · `journal-heatmap` · `journal-day-<idx>` (heat cell)
- `journal-growth-head` · `journal-growth` · `journal-growth-<statKey>`
- `journal-deeds-head` · `journal-deeds`

## Diary (`screen-diary`)
- `diary-set-chooser` · `diary-set-<key>` — the diary-set chips
- `diary-progress` · `diary-checks` · `diary-check-<i>` (0–5) + `diary-check-<i>-header` / `diary-check-<i>-complete`
- `diary-totals` · `diary-totals-card` · `diary-note` (meditation note input)

## Teacher (`screen-teacher`)
- enable mode: `teacher-enable-head` · `teacher-enable-card` · `teacher-enable`
- link: `teacher-link-head` · `teacher-link-card` · `teacher-link` · `teacher-copy`
- students: `teacher-students` (head) · `teacher-refresh` (⟳) · `teacher-students-card` · `teacher-student-<studentId>`
- income: `teacher-income` · `teacher-revshare`

---

## Overlays (each has a `*-root`)
- **Editor** `editor-root`: `editor-name-input` · `editor-name-field` · `editor-cat-field` · `editor-cat-<catKey>` · `editor-icon-field` · `editor-icon-<iconName>` · `editor-unit-field` · `editor-unit-min` · `editor-unit-reps` · `editor-dur-stepper` · `editor-rewards-field` · `editor-reward-<statKey>` · `editor-save` · `editor-archive` · `editor-delete` · `editor-confirm-panel` / `editor-confirm-cancel` / `editor-confirm-ok`
- **Practice detail** `detail-root`: `detail-edit` · `detail-complete` · `detail-start` · `detail-pause` · `detail-resume` · `detail-reset` · `detail-mark-done` · `detail-timer-minus` · `detail-timer-plus` · `detail-instr-toggle` · `detail-rewards-head` · `detail-rewards-card`
- **Paywall** `paywall-root`: `paywall-panel` · `paywall-close` · `paywall-subscribe`
- **Hamburger menu** `menu-root`: `menu-panel` · `menu-item-<key>` (e.g. `menu-item-teacher`)
- **Metric editor** `metric-edit-root`: `metric-edit-panel` · `metric-edit-close` · `metric-edit-stepper` · `metric-edit-save`
- **Avatar picker** `avatar-picker-root`: `avatar-picker-panel` · `avatar-picker-close` · `avatar-<avatarId>`
- **Onboarding** `onboarding-root`: `onboarding-card` · `onboarding-next` · `onboarding-skip`
- **Level-up** `levelup-root` (`levelup-card`) · **Toast** `toast-root` (`toast-action`) · **Day sheet** `day-sheet-root` · **Launch veil** `fog-root`

---

*To add an id to a new element: pass `nativeID="my-id"` to it (works on the listed primitives and
any plain `View`/`Text`/`Pressable`). Keep ids unique within a rendered screen.*
