# Alchemist — полное дерево UI-элементов

Глубокий разбор интерфейса: каждый контейнер, кнопка, надпись, иконка, поле ввода,
медальон, полоса, график, глиф и анимация. Сгруппировано по: токены → библиотека
компонентов → дерево рендера экранов → оверлеи → анимации.

**Легенда тегов**
`[box]` контейнер/секция · `[btn]` нажимаемый элемент · `[txt]` надпись (в кавычках — точный текст) ·
`[字]` иероглиф/глиф · `[input]` поле ввода · `[svg]` вектор/график · `[gem]` гем-медальон ·
`[icon]` иконка/эмодзи · `[bar]` полоса · `[anim]` анимация · `[state]` состояния · `[data]` источник данных.

---

## 0. Дизайн-токены (атомы) — `src/theme.js`

```
ЦВЕТА
├─ Парчмент: paper #EFE6CB · paperLight #F7F0D9 · paperCell #FBF5E2 · paperWarm #EADFBE · paperDeep #D7C599
├─ Тушь:     ink #553A1E · inkMuted #8A6B43 · inkFaint #AC8E62
├─ Дерево:   wood1 #DDB375 · wood2 #C5944F · wood3 #A2723A · woodLine #6E4A22 · woodEdge #EDD199
├─ Заголовки:title #6A4C93 · titleDeep #4F3675
├─ Нефрит:   jade #3E8C60 · jadeLight #6FBF92 · jadeDeep #235C3E · jadeLine #163E29
├─ Золото:   gold #E0A93C · goldLight #F6D685 · goldDeep #B27C24 · goldLine #835815
├─ Киноварь: red #D9543B · redDeep #A8341F · redLine #6E1D0F
└─ Характеристики: cEnergy #34A18C · cStrength #C66A38 · cFlex #7CB13F · cFocus #4574B5 · cKind #D078A6 · cSex #9559B8

ШРИФТЫ           Fredoka (дисплейный) · Manrope (интерфейс) · Noto Serif SC (иероглифы)
РАДИУСЫ          card 20 · btn 16 · modal 26 · seal 9
ТЕНИ             drop-sm / drop-md / drop-lg (box-shadow)
ИЗИ (easing)     out · soft · overshoot · linear

ТИПОГРАФИКА (T) — стили текста
├─ [txt] display-l  Fredoka 700 / 34
├─ [txt] display-m  Fredoka 700 / 24
├─ [txt] title      Fredoka 700 / 16 UPPERCASE (+ «◆» перед)
├─ [txt] body       Manrope / 15
├─ [txt] label      Manrope 700 / 12
├─ [txt] caption    Manrope 600 / 11
├─ [txt] eyebrow    Manrope 800 / 11 UPPERCASE
└─ [txt] num-xl     Fredoka 700, tabular-nums
```

---

## 1. Библиотека компонентов (переиспользуемые) — `src/ui.js`, `badges.js`, `svg.js`, `PracticeCard.js`

```
ПРИМИТИВЫ (ui.js)
├─ Gradient            [box] обёртка LinearGradient (угол → start/end)
├─ Gloss               [icon] блик-эллипс на гемах
├─ Txt / Han           [txt]/[字] базовый текст / иероглифический текст
├─ SectionHead         [box] «◆» + [txt] заголовок секции (+ опц. правый [txt])
├─ Card                [box] парчмент-карточка (градиент + рамка + тень)
├─ Btn                 [btn] кнопка-«леденец», [state] default/hover/pressed/disabled
│   ├─ variant=primary   нефрит, текст #fff           («Сохранить», «Войти на Путь», «Старт»…)
│   ├─ variant=gold      золото, тёмный текст         («+ Новая», «✦ Завершить»)
│   ├─ variant=secondary светлый, нефритовый текст    («⏸ Пауза»)
│   ├─ variant=danger    светлый, киноварный текст    («Архивировать»)
│   └─ variant=ghost     прозрачная                   («‹ Назад», «Сброс», «+ Добавить практику»)
├─ IconBtn             [btn] круглая красная иконка-кнопка
├─ Stepper             [box] [btn]«−» + [txt]«{n} мин» + [btn]«+»
├─ SelChip             [btn] выбираемый чип: [gem] глиф + [txt]; [state] on/off
├─ Field               [box] [txt] подпись-метка + контент
├─ Input               [input] текстовое поле; [state] focus (нефритовая рамка + ореол)
├─ DiaryInput          [input] компактное поле дневника (+ multiline)
├─ WoodPlank           [box] деревянная поверхность с вертикальными планками
├─ BrushDivider        [svg] разделитель-мазок кистью
└─ Seal                [字] печать «印» (красный гем, поворот −4°); [anim] sealStamp

ГЕМЫ / БЕЙДЖИ / ПОЛОСЫ (badges.js)
├─ Mh                  [gem] глиф-медальон (круг/скруг.квадрат) + Gloss
├─ StatMedal          [gem] медальон характеристики ([字] из 6: 氣力柔定仁精)
├─ RewardMedal        [gem]+[txt] награда «{字} +N»
├─ MedalPill          [box] пилюля с произвольным контентом
├─ QiTag              [字]«氣» + [txt] «+N»/«−N» (нефрит/киноварь)  [state] gain/cost
├─ Bar                [bar] полоса прогресса (тёмный жёлоб + цветная заливка); [anim] ширина
├─ ResourceBar        [box] [字] глиф + [txt] метка + [txt] «{v}/{max}» + [bar]
│                        + [anim] sheen (блик) · [anim] barGlow (если glow)
├─ StateChip          [box] [icon] + [txt]; 5 типов:
│     🌀 «В потоке» · ✨ «Вдохновлён» · 🥀 «Истощён» · 🔥 «{n} дней» (streak) · 🌙 «Покой»
├─ Avatar             [box] портрет «修»; [anim] spin-кольцо (в потоке) + свечение
└─ Mist               [box]×3 туманные клубы; [anim] mistDrift

SVG-ВИЗУАЛИЗАЦИИ (svg.js)
├─ RadarMandala       [svg] медальон-фон + пунктир + 3 кольца + 6 осей + полигон + 6 вершин
│                        + 6 [字] подписей (氣力柔定仁精); [anim] grow (рост из центра)
├─ CircularTimer      [svg] трек + дуга прогресса (нефритовый градиент) + [txt] «MM:SS»; [anim] breathe
└─ GrowthChart        [svg] 3 линии сетки + 3 кривые (柔/定/氣); [anim] отрисовка штриха

КАРТОЧКА ПРАКТИКИ (PracticeCard.js)  [data] practice
└─ PracticeCard       [box]; [state] default/done/locked/active/shake
    ├─ [gem] категорийный гем ([字] глиф категории) + Gloss
    ├─ [box] тело
    │   ├─ [txt] название практики
    │   └─ [box] мета: [txt] категория · «•» · [txt]«{dur} мин» · [txt]«×{mult}»
    │        + (полный) RewardMedal×до 3  /  (compact) QiTag
    ├─ [btn] чек-кнопка
    │   ├─ не выполнено → пустой круг + [svg] галочка (скрыта)
    │   └─ выполнено    → нефритовый круг + [svg] CheckMark; [anim] brush-draw
    └─ (locked) [txt] «◌ нужно {N} 氣» вместо чек-кнопки

ЭФФЕКТЫ (effects.js)  — слой поверх всего экрана
├─ [anim] qi-burst    16 частиц Ци разлетаются (цвета наград)
└─ [anim] +XP float   всплывающие медальоны «{字} +N»
```

---

## 2. Дерево рендера приложения

### 2.0 Корень — `App.js`
```
App
└─ AuthProvider
   ├─ Gate
   │   ├─ [box] загрузка (шрифты/сессия не готовы) — пустой парчмент
   │   ├─ AuthScreen                      (нет пользователя)
   │   └─ EffectsProvider → MainApp       (пользователь есть)
   └─ StatusBar (dark)
```

### 2.1 Экран авторизации — `AuthScreen.js`
```
[box] фон — тёмно-зелёный градиент  ·  [anim] popIn
└─ ScrollView (центрирование)
   ├─ БРЕНД
   │   ├─ [字] печать «修» (красный гем, −3°)
   │   ├─ [txt] «Alchemist»  (Fredoka 38, золото)
   │   ├─ [字] «修真之路»
   │   └─ [txt] «RPG-трекер практик: медитация, цигун, Чжан Чжуан»
   ├─ КАРТА (парчмент + дерев. рамка)
   │   ├─ [box] табы
   │   │   ├─ [btn] «Вход»        [state] активна/нет
   │   │   └─ [btn] «Регистрация» [state] активна/нет
   │   ├─ Field «Имя» → [input] «Как тебя звать, странник»   (только регистрация)
   │   ├─ Field «Email» → [input] «you@example.com»
   │   ├─ Field «Пароль» → [input] «••••••» (secure)
   │   ├─ [box] ошибка (условно) → [txt] текст ошибки
   │   ├─ [btn primary] «Войти на Путь» / «Начать Путь» (busy → «…»)
   │   └─ [btn] «Продолжить как гость →»
   └─ [txt] «道法自然 — Путь следует естественности»
```

### 2.2 Оболочка — `MainApp.js` (адаптив по ширине)

**Мобильная раскладка (ширина < 900):**
```
[box] фон парчмент
├─ [box] область экрана (flex)  ·  [anim] screenIn  ·  [state] spent → desaturate
│   └─ ⟨активный экран: Today | Character | Library | Diary | Journal⟩
├─ BottomNav  (нижняя дерев. панель)
│   └─ 5×[btn] [state] активна(золото)/нет:
│       日 «Сегодня» · 我 «Персонаж» · 書 «Практики» · 記 «Дневник» · 史 «Журнал»
└─ ⟨оверлеи⟩ (см. §3)
```

**Десктоп-раскладка (ширина ≥ 900):**
```
[box] зелёный фон-подложка
└─ [box] desk-панель (дерев. рамка, скругление)
   ├─ SideRail (боковой рельс)
   │   ├─ БРЕНД: [字] печать «修» + [txt] «Alchemist»
   │   ├─ 5×[btn] нав-пункты (те же 5; [state] активна(нефрит)/hover/нет)
   │   ├─ [box] карточка ступени: [txt]«Ступень» + [txt num] «{lvl}» + [bar] Ци
   │   └─ [btn] «↩ Выйти · {имя}»
   ├─ [box] область экрана (+ [anim] screenIn)
   └─ ⟨оверлеи⟩
```

### 2.3 Экран «Сегодня» — `screens/Today.js`
```
ScreenScroll (парчмент)
├─ HERO (золотисто-парчментный градиент)
│   ├─ Mist×3 (туман)
│   ├─ [box] строка:
│   │   ├─ Avatar «修» ([state] flow-кольцо)
│   │   ├─ [box]: [txt eyebrow]«Ступень {lvl}» + [txt display-m]«Доброе утро,⏎странник»
│   │   └─ DayStateChip (StateChip по dayState: 🌀/✨/🥀/🌙)
│   └─ [box] ресурсы:
│       ├─ ResourceBar  生 «Жизнь»  {hp}/{max}
│       └─ ResourceBar  氣 «Ци»     {qi}/{max}  ([state] glow в потоке)
├─ ЛЕНТА-СВОДКА (тёплый парчмент)
│   ├─ [txt]«{done} из {total}»
│   ├─ «•»
│   ├─ [txt]«+{dayXp} XP» (золото)
│   └─ StateChip 🔥 «{streak} дней»
├─ [состояние: пусто] (условно)
│   └─ Card: [icon]🐉 + [txt]«Начни свой путь сегодня» + [txt] описание + [btn]«Добавить практику»
├─ [состояние: всё выполнено] (условно)
│   └─ Card золотая: Seal「印」+ [txt]«Свиток дня свёрнут» + [txt]«…+{dayXp} XP… 大巧若拙…»
├─ [box] список практик  ·  [anim] fadeUp каскадом
│   └─ PracticeCard×N (+ DoneSeal「印」на выполненных)
└─ [btn ghost] «+ Добавить практику» (пунктир)
```

### 2.4 Экран «Персонаж» — `screens/Character.js`
```
ScreenScroll → PadView
├─ [txt eyebrow]«Свиток мастера»
├─ [txt display-l]«Ступень {lvl}»
├─ RadarMandala (size 250) — 6 осей, полигон, [字]×6 подписи
├─ [box] 2 карточки ресурсов:
│   ├─ Card → ResourceBar 生 «Жизнь»
│   └─ Card → ResourceBar 氣 «Ци»
├─ SectionHead «Характеристики»
├─ Card → 6×StatRow [data] STATS:
│   ├─ StatMedal [字] + [txt] имя + [txt]«ур. {lvl}» + [bar] + [icon]«›» ([state] раскрыт→90°)
│   └─ (раскрыто) [txt]«{xp}/{next} очков · питают практики:» + чипы-фидеры ([gem]+[txt])
├─ SectionHead «Перки» · [txt]«{n} открыто»
├─ [box] сетка 6×Perk [data] PERKS:
│   ├─ open  → [gem][字] + [txt] имя
│   └─ locked→ [icon]🔒 + [txt] имя + [txt] условие («Сила 6» / «Доброта 8» / «Ступень 12»)
├─ SectionHead «Реликвии»
└─ [box] сетка 4×Relic [data] RELICS:
    ├─ got  → [icon] 🪷 / 🫖
    └─ empty→ [icon] «◌»
```

### 2.5 Экран «Практики» (Библиотека) — `screens/Library.js`
```
ScreenScroll → PadView
├─ [box] шапка: [txt eyebrow]«Зал свитков» + [txt display-m]«Библиотека практик» + [btn gold]«+ Новая»
├─ 6×[box] секции категорий [data] CATS (если есть практики):
│   ├─ [btn] заголовок: [gem][字] + [txt] категория + [txt] счётчик + [icon]«›» ([state] свёрнуто)
│   ├─ BrushDivider
│   └─ [box] PracticeCard×N (compact) ·  [anim] fadeUp каскадом
└─ [box] архив: [btn] [icon]«›» + [txt]«Архив»
    └─ (раскрыто) Card → [txt]«Архив пуст. Заархивированные практики можно восстановить отсюда.»
```

### 2.6 Экран «Дневник» — `screens/Diary.js`
```
ScreenScroll → PadView
├─ [txt eyebrow]«Шестиразовый этический дневник»
├─ [box]: [txt display-l]«Дневник» + GoldPill [txt]«{дата}»
├─ [txt body]«Шесть раз в день остановись, проверь один обет и запиши плюс, минус и дело.»
│            (выделено цветом: плюс/минус/дело)
├─ [box] 4×SelChip набора [data] DIARY_SETS:
│        十«Десятка» · 皈«Прибежище» · 解«Свобода» · 世«Мирские»
├─ Card прогресс: [txt]«{done} из 6 проверок» + 6×CheckDot
├─ [box] 6×DiaryCheck [data] DIARY_TIMES + вопросы:
│   ├─ GoldPill [txt] время (08:00/10:30/12:00/15:00/17:00/19:00)
│   ├─ [txt]«{n}. {название обета}»
│   ├─ [txt] статус «нажми, чтобы заполнить» / «✓ проверено»  /  [icon]«›» или CheckDot
│   └─ (раскрыто):
│       ├─ [txt] вопрос-обет (курсив)
│       ├─ PmtRow ＋ «Плюс — что хорошего сделал»   → [input]«Конкретный, реальный случай…»
│       ├─ PmtRow － «Минус — чем навредил себе/другим»→ [input]
│       ├─ PmtRow ✓ «Сделать — на ближайшие часы»    → [input]
│       └─ [btn] «Отметить проверку» / «✓ Обновить проверку»   ·  [anim] qi-burst
├─ SectionHead «Итоги дня»
├─ Card:
│   ├─ [txt label]«Три лучших дела» + 3×PmtRow ＋ [input]«Лучшее №{i}»
│   ├─ [txt label]«Три худших дела» + 3×PmtRow － [input]«Худшее №{i}»
│   └─ [txt label]«🌙 Заметка о медитации» + [input multiline]«Как прошла медитация, что заметил…»
└─ [txt caption]««Проверяй своё сердце шесть раз в день» — Геше Майкл Роуч» (курсив)
```

### 2.7 Экран «Журнал» — `screens/Journal.js`
```
ScreenScroll → PadView
├─ [txt eyebrow]«Летопись пути»
├─ [txt display-m]«Журнал · Июнь»
├─ Card тепловая карта:
│   ├─ [box] заголовки дней недели: Пн Вт Ср Чт Пт Сб Вс
│   ├─ [box] 28×HeatCell [data] HEAT: [txt] число, [state] интенсивность 0–3, today→золотое кольцо
│   │         ·  [anim] fadeUp каскадом  ·  [btn] (открывает деталь дня)
│   └─ [box] легенда: [txt]«меньше» + 4×LegendSwatch + [txt]«больше»
├─ SectionHead «Рост характеристик»
├─ Card: GrowthChart [svg] + [box] легенда: «Энергия» «Концентрация» «Гибкость» (цвет-маркеры)
├─ SectionHead «Сводка периода»
└─ [box] сетка 4×SummaryCard:
    ├─ «412» / «минут практик» / «за 28 дней»
    ├─ «14»  / «лучший стрик»  / «🔥 подряд»
    ├─ «2»   / «реликвии»      / «открыто»
    └─ «6»   / «характеристик» / «растут»
```

---

## 3. Оверлеи — `src/overlays.js`

```
PracticeDetail (полноэкранный)   [data] practice
├─ [btn ghost] «‹ Назад»
├─ [box] шапка: [gem][字] категория + [txt] название + [txt]«{категория} · ×{mult}»
├─ [box] таймер: [btn]«−5м» + CircularTimer (MM:SS) + [btn]«+5м»
├─ [box] управление ([state] зависят от таймера):
│     [btn primary]«▶ Старт» · [btn secondary]«⏸ Пауза» · [btn primary]«▶ Продолжить»
│     · [btn gold]«✦ Завершить» · [btn ghost]«Сброс»
├─ [btn ghost] «Отметить выполненной»
├─ [btn] «› Руководство» → (раскрыто) [txt] инструкция
└─ SectionHead «Награды» → Card: RewardMedal×N + QiTag + MedalPill«Чжан Чжуан ×{mult}»

EditorSheet (нижний свиток)   [data] practice|null  ·  [anim] sheetUp/Down
├─ [box] scrim (затемнение, [btn] закрыть)
├─ [box] grip-полоска + scroll-ends планка
├─ [txt display-m] «Новая практика» / «Изменить практику»
├─ Field «Название» → [input]«Напр. Утренний цигун»
├─ Field «Категория» → 6×SelChip [data] CATS
├─ Field «Длительность» → Stepper «{n} мин»
├─ Field «Привязка характеристик» → 6×SelChip [data] STATS («{имя} +N»)
└─ [box] [btn primary]«Сохранить» + [btn danger]«Архивировать» (только при редактировании)

DayDetailSheet (нижний свиток)   [data] day
├─ [txt display-m]«{day} июня» + StateChip 🌀«В потоке»
├─ [box] медали: «+18 XP» · «生 92%» · «氣 78%»
├─ [txt label]«Выполнено»
└─ [box] 3×PracticeCard (compact, done)

LevelUpOverlay   [data] stage  ·  [anim] popIn + goldBurst, автозакрытие 3.2с
├─ [box] gold-flash
└─ [box] карточка: Seal「印」+ [txt eyebrow]«Новая высота» + [txt display-l]«Ступень {n}»
        + [txt] описание + [box] лента «修真 · Ступень {n}»

FogVeil   [anim] fogClear — туман-вуаль на старте, исчезает за 1.6с
```

---

## 4. Каталог анимаций — `src/anim.js` (+ rAF в svg.js/PracticeCard.js)

```
KEYFRAMES (react-native-web → CSS @keyframes)
├─ screenIn      смена экрана (fade + сдвиг)
├─ fadeUp        каскадное появление карточек/секций
├─ fadeIn        затемнение scrim/оверлеев
├─ popIn         появление модалок/карты входа
├─ goldBurst     золотая вспышка при level-up
├─ spin          кольцо «потока» вокруг аватара
├─ mistDrift     дрейф тумана в hero
├─ barGlow       пульс свечения полосы Ци (в потоке)
├─ breathe       «дыхание» активной карточки
├─ timerBreathe  «дыхание» работающего таймера
├─ shakeNo       тряска заблокированной карточки
├─ sealStamp     «впечатывание» печати 印
├─ fogClear      рассеивание тумана-интро
├─ sheen         блик по ресурс-полосе
└─ sheetUp/Down  выезд/уезд нижнего листа

JS-АНИМАЦИИ (requestAnimationFrame)
├─ RadarMandala grow      рост полигона из центра
├─ GrowthChart draw       прорисовка линий графика
└─ CheckMark brush-draw   отрисовка галочки при выполнении

ИМПЕРАТИВНЫЕ ЭФФЕКТЫ (effects.js)
├─ qi-burst   16 частиц Ци (при отметке практики / проверки дневника)
└─ +XP float  всплывающие медальоны наград
```

---

## 5. Сводные счётчики

```
Экраны: 5            (Сегодня, Персонаж, Практики, Дневник, Журнал)
Оверлеи: 5           (Деталь практики, Редактор, Деталь дня, Повышение ступени, Туман)
Переиспользуемых компонентов: ~30
Варианты кнопок: 5   (primary, gold, secondary, danger, ghost)
Типы StateChip: 5    (поток, вдохновлён, истощён, стрик, покой)
Характеристики: 6    · Категории: 6 · Перки: 6 · Реликвии: 4 · Наборы дневника: 4
Практик (данные): 16 · Обетов: 10/12/10/5 по наборам
Keyframe-анимаций: 16 + 3 rAF + 2 эффекта
Иероглифов в UI: 氣力柔定仁精 / 禅樁體智心 / 修真生印 / 十皈解世 / 日我書記史 / 道法自然 大巧若拙
```
