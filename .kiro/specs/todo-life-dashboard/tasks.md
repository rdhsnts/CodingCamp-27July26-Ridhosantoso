# Implementation Plan: Todo Life Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard as three static files (`index.html`, `css/style.css`, `js/app.js`). Each task builds on the previous, ending with full wiring in `init()`. All state lives in `localStorage`; no build step is required.

---

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - Create `index.html` with `<!DOCTYPE html>`, `<html lang="en">`, and `<head>` containing charset, viewport meta, and a link to `css/style.css`
  - Add `<body data-theme="light">` with a `<header>` containing `<section id="greeting-section">` and `<button id="settings-toggle">⚙</button>`
  - Add `<main>` containing `<section id="timer-section">`, `<section id="todo-section">`, and `<section id="links-section">`
  - Add `<aside id="settings-section">` for the settings panel, and a `<script src="js/app.js">` tag before `</body>`
  - Create empty `css/style.css` and `js/app.js` files to satisfy the script/link references
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2. Implement CSS design tokens and base styles
  - [x] 2.1 Write CSS custom properties for light theme and dark theme override
    - Declare all `--color-*`, `--font-*`, `--space-*`, `--radius-*`, and `--transition-fast` tokens on `:root` using the exact values from the design document
    - Add `[data-theme="dark"]` block overriding all `--color-*` tokens to dark-mode values
    - Add `* { box-sizing: border-box; margin: 0; padding: 0; }` reset and `body { background: var(--color-bg); color: var(--color-text-primary); font-family: var(--font-sans); }` base rule
    - _Requirements: 5.1, 5.2, 5.9_

  - [x] 2.2 Implement responsive grid layout and section card styles
    - Style `header` as a flex row with space-between alignment
    - Style `main` with `display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-lg); padding: var(--space-lg);`
    - Style each `section` as a card: `background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-lg);`
    - Style `#settings-section` (`<aside>`) as a fixed overlay panel, hidden by default (`display: none`), shown with a `.open` class
    - Add a single media query at `max-width: 480px` for the settings panel positioning
    - _Requirements: 5.1, 5.2_

  - [x] 2.3 Style interactive elements: buttons, inputs, checkbox, and error/warning states
    - Style `button` base: padding, border-radius, cursor, background `var(--color-accent)`, color white, with `:hover` using `var(--color-accent-hover)` and `transition: var(--transition-fast)`
    - Style `input[type="text"]` and `input[type="number"]`: full width, border `var(--color-border)`, border-radius `var(--radius-sm)`, padding
    - Style `.error` class as inline red text (`color: var(--color-danger)`) for validation messages
    - Style `.warning-banner` as a dismissable yellow bar at top of page
    - Style `.task-completed` with `text-decoration: line-through; color: var(--color-text-muted)`
    - Style `#timer-display` with `font-family: var(--font-mono); font-size: 3rem`
    - _Requirements: 2.1, 3.7, 3.8_

- [x] 3. Implement app.js skeleton and localStorage error handling
  - [x] 3.1 Create app.js skeleton with `'use strict';`, section comments for each widget, and an empty `init()` function called on `DOMContentLoaded`
    - Define the six `localStorage` key constants: `const KEYS = { tasks: 'tld_tasks', links: 'tld_links', settings: 'tld_settings' }`
    - Add a `showStorageWarning()` helper that inserts a single `.warning-banner` element at the top of `<body>` if one does not already exist
    - _Requirements: 4.8, 5.8_

  - [x] 3.2 Implement try/catch wrappers for all localStorage read and write operations
    - Write a `storageGet(key, fallback)` helper that wraps `JSON.parse(localStorage.getItem(key))` in try/catch, calls `showStorageWarning()` on error, and returns `fallback`
    - Write a `storageSet(key, value)` helper that wraps `localStorage.setItem(key, JSON.stringify(value))` in try/catch (silent failure, keeps in-memory state)
    - _Requirements: 4.8, 5.8, 3.10, 4.6_

- [ ] 4. Implement Settings data layer and theme application
  - [x] 4.1 Implement `loadSettings()`, `saveSettings()`, and `applyTheme()`
    - `loadSettings()`: call `storageGet('tld_settings', {})` and merge with defaults `{ theme: 'light', name: '', duration: 25 }`, return merged object
    - `saveSettings(partial)`: load current settings, merge partial, call `storageSet('tld_settings', merged)`, update in-memory settings variable
    - `applyTheme(theme)`: set `document.body.setAttribute('data-theme', theme)`; theme switch must complete within 100 ms (CSS handles the repaint)
    - _Requirements: 5.3, 5.8, 5.9_

  - [x] 4.2 Implement `validateName()` and `validateDuration()` pure functions
    - `validateName(name)`: return `true` if `name.trim().length >= 1 && name.trim().length <= 50`, else `false`
    - `validateDuration(value)`: convert to number; return `true` if it is an integer and `>= 1 && <= 120`, else `false`
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 2.9, 2.10_

  - [ ]* 4.3 Write property test for `validateName` (Property 16)
    - **Property 16: Name validation accepts 1–50 trimmed characters and rejects all others**
    - **Validates: Requirements 1.8, 5.4, 5.5**
    - Use `fc.string()` generator with at least 100 runs; assert `validateName(s) === (s.trim().length >= 1 && s.trim().length <= 50)`

  - [ ]* 4.4 Write property test for `validateDuration` (Property 17)
    - **Property 17: Duration validation accepts integers 1–120 and rejects all others**
    - **Validates: Requirements 2.9, 2.10, 5.6, 5.7**
    - Use `fc.oneof(fc.integer(), fc.float(), fc.string())` with at least 100 runs; assert the integer-in-range logic

  - [ ]* 4.5 Write property test for settings serialization round-trip (Property 15)
    - **Property 15: Settings serialization round-trip preserves all fields**
    - **Validates: Requirements 5.3, 5.8**
    - Generate arbitrary valid Settings objects; serialize to JSON then deserialize and assert deep equality

- [x] 5. Implement Settings panel UI and wiring
  - [x] 5.1 Add settings panel markup inside `#settings-section` in `index.html`
    - Name input `#settings-name`, theme select/toggle `#settings-theme`, duration input `#settings-duration`, Save button `#settings-save`, and close button `#settings-close`
    - Add `<span class="error">` elements adjacent to each input for inline validation messages, hidden initially
    - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7_

  - [x] 5.2 Implement `renderSettings(settings)` and open/close toggle
    - `renderSettings(settings)`: populate `#settings-name`, `#settings-theme`, and `#settings-duration` with values from the settings object; clear any existing error messages
    - Wire `#settings-toggle` click to add `.open` class on `#settings-section`; wire `#settings-close` click to remove `.open` class
    - _Requirements: 5.1, 5.8_

  - [x] 5.3 Implement settings save handler
    - On `#settings-save` click: read input values, run `validateName` and `validateDuration`, show inline error messages for invalid fields, abort if any invalid
    - If all valid: call `saveSettings({ theme, name, duration: Number(duration) })`, call `applyTheme(theme)`, call `renderGreeting()`, call `initTimer()` with new duration, close panel
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 6. Implement Greeting Widget
  - [x] 6.1 Add greeting markup to `#greeting-section` in `index.html`
    - Add `<time id="greeting-time">`, `<p id="greeting-date">`, and `<p id="greeting-text">` inside `#greeting-section`
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 6.2 Implement `formatTime(date)` and `formatDate(date)` pure functions
    - `formatTime(date)`: return `String(date.getHours()).padStart(2,'0') + ':' + String(date.getMinutes()).padStart(2,'0')`
    - `formatDate(date)`: return day name, zero-padded day, month name, and full year joined by space/comma to produce e.g. `"Monday, 28 July 2026"`
    - Guard both functions: if `isNaN(date.getTime())` return the fallback string (`"--:--"` or `"---"`)
    - _Requirements: 1.1, 1.3, 1.10_

  - [ ]* 6.3 Write property test for `formatTime` (Property 2)
    - **Property 2: Time formatting preserves structure**
    - **Validates: Requirements 1.1**
    - Use `fc.date()` with at least 100 runs; assert result matches `/^\d{2}:\d{2}$/` and length is exactly 5

  - [ ]* 6.4 Write property test for `formatDate` (Property 3)
    - **Property 3: Date formatting preserves structure**
    - **Validates: Requirements 1.3**
    - Use `fc.date()` with at least 100 runs; assert first token is a valid English day name, second token is two-digit day, third is a valid month name, fourth is four-digit year

  - [x] 6.5 Implement `getGreetingText(hour)` pure function
    - Map hour 5–11 → `"Good Morning"`, 12–17 → `"Good Afternoon"`, 18–21 → `"Good Evening"`, 22–23 and 0–4 → `"Good Night"`
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

  - [ ]* 6.6 Write property test for `getGreetingText` (Property 1)
    - **Property 1: Greeting time mapping is exhaustive and deterministic**
    - **Validates: Requirements 1.4, 1.5, 1.6, 1.7**
    - Use `fc.integer({ min: 0, max: 23 })` with at least 100 runs; assert result is one of the 4 greeting strings and two calls with same hour return same string

  - [x] 6.7 Implement `renderGreeting()` and `startGreetingClock()`
    - `renderGreeting()`: call `new Date()`, guard for invalid date, write `formatTime` result to `#greeting-time`, `formatDate` result to `#greeting-date`; call `getGreetingText` and compose greeting with name from settings (format `"[Greeting], [Name]"` when name is set), write to `#greeting-text`
    - `startGreetingClock()`: call `renderGreeting()` immediately, then `setInterval(renderGreeting, 60000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.8, 1.9, 1.10_

  - [ ]* 6.8 Write property test for greeting + name format (Property 4)
    - **Property 4: Greeting with name follows "[Greeting], [Name]" format**
    - **Validates: Requirements 1.8**
    - Use `fc.tuple(fc.constantFrom('Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night'), fc.string({ minLength: 1, maxLength: 50 }))` with at least 100 runs; assert composed string starts with greeting, contains `", "`, ends with name

- [x] 7. Checkpoint — Greeting and Settings verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Focus Timer
  - [x] 8.1 Add timer markup to `#timer-section` in `index.html`
    - Add `<div id="timer-display">25:00</div>`, `<button id="timer-start">Start</button>`, `<button id="timer-stop" disabled>Stop</button>`, `<button id="timer-reset">Reset</button>`, and `<div id="timer-notification" hidden></div>`
    - _Requirements: 2.1, 2.2_

  - [x] 8.2 Implement `formatMMSS(seconds)` pure function
    - Convert total seconds to `MM:SS` with zero-padded two-digit MM and SS; e.g. `formatMMSS(90)` → `"01:30"`
    - _Requirements: 2.1_

  - [ ]* 8.3 Write property test for `formatMMSS` (Property 5)
    - **Property 5: Timer MM:SS formatting round-trips through total seconds**
    - **Validates: Requirements 2.1**
    - Use `fc.integer({ min: 0, max: 7199 })` with at least 100 runs; assert result is exactly 5 chars, matches `/^\d{2}:\d{2}$/`, and `parseInt(MM)*60 + parseInt(SS) === S`

  - [x] 8.4 Implement `timerState` object and `initTimer()`
    - Define `const timerState = { remaining: 0, running: false, intervalId: null }`
    - `initTimer()`: load settings, clamp duration to 25 if outside 1–120, set `timerState.remaining` to `duration * 60`, call `renderTimer()`, wire Start/Stop/Reset button click events (removing previous listeners first to avoid duplicates)
    - _Requirements: 2.2, 2.9_

  - [x] 8.5 Implement `startTimer()`, `stopTimer()`, `resetTimer()`, `tickTimer()`, and `renderTimer()`
    - `startTimer()`: guard if `timerState.running`; set `running = true`, set `intervalId = setInterval(tickTimer, 1000)`, disable Start button, enable Stop button
    - `stopTimer()`: clear interval, set `running = false`, disable Stop button, enable Start button
    - `resetTimer()`: call `stopTimer()`, restore remaining from settings duration, call `renderTimer()`
    - `tickTimer()`: decrement `remaining`; call `renderTimer()`; if `remaining <= 0` call `timerExpired()`
    - `renderTimer()`: write `formatMMSS(timerState.remaining)` to `#timer-display`
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.8_

  - [x] 8.6 Implement `timerExpired()` with notification and audio
    - Call `stopTimer()`, show `#timer-notification` with text "Time's up!" for at least 3 seconds (hide after 4 s via `setTimeout`), and call `new Audio('data:audio/wav;base64,...').play()` with a short beep or use `AudioContext` to synthesize a 1-second tone
    - _Requirements: 2.7_

- [x] 9. Implement To-Do List
  - [x] 9.1 Add todo markup to `#todo-section` in `index.html`
    - Add `<input type="text" id="todo-input" placeholder="Add a task…">`, `<button id="todo-add">Add</button>`, `<span id="todo-error" class="error" hidden></span>`, and `<ul id="task-list"></ul>`
    - _Requirements: 3.1, 3.2_

  - [x] 9.2 Implement `generateId()`, `loadTasks()`, and `saveTasks()`
    - `generateId()`: return `Date.now().toString(36) + Math.random().toString(36).slice(2)`
    - `loadTasks()`: call `storageGet('tld_tasks', [])`, return array (guard against non-array with `Array.isArray` check, return `[]` otherwise)
    - `saveTasks(tasks)`: call `storageSet('tld_tasks', tasks)`
    - _Requirements: 3.10, 3.11_

  - [ ]* 9.3 Write property test for task serialization round-trip (Property 6)
    - **Property 6: Task serialization round-trip preserves data**
    - **Validates: Requirements 3.10, 3.11**
    - Generate arbitrary `Task[]` arrays with `fc.array(fc.record({ id: fc.string(), title: fc.string(), completed: fc.boolean() }))`; serialize then deserialize and assert deep equality

  - [x] 9.4 Implement `addTask(title)` and `renderTasks(tasks)`
    - `addTask(title)`: trim title; if empty/whitespace show `#todo-error` and return; hide error; create `{ id: generateId(), title: trimmed, completed: false }`, push to in-memory task array, call `saveTasks`, call `renderTasks`, clear input
    - `renderTasks(tasks)`: clear `#task-list`; for each task append an `<li>` with a checkbox, `<span>` for title (with `.task-completed` class if done), Edit button, and Delete button; set `data-id` on the `<li>`
    - _Requirements: 3.1, 3.2, 3.7, 3.8, 3.11_

  - [ ]* 9.5 Write property test for `addTask` grows list by one (Property 7)
    - **Property 7: Adding a valid task grows the list by exactly one**
    - **Validates: Requirements 3.1**
    - Use `fc.tuple(fc.array(fc.record({...})), fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0))` with 100 runs; assert list length is `|L| + 1` and last item has trimmed title and `completed === false`

  - [ ]* 9.6 Write property test for whitespace title rejection (Property 8)
    - **Property 8: Whitespace-only task titles are always rejected**
    - **Validates: Requirements 3.2**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` with at least 100 runs; assert task list is unchanged after `addTask` call

  - [x] 9.7 Implement `toggleTask(id)` and `deleteTask(id)`
    - `toggleTask(id)`: find task by id, flip `completed`, call `saveTasks`, call `renderTasks`
    - `deleteTask(id)`: filter out task with matching id, call `saveTasks`, call `renderTasks`
    - Wire checkbox `change` and Delete button `click` events inside `renderTasks` using event delegation or per-element listeners
    - _Requirements: 3.7, 3.8, 3.9, 3.10_

  - [ ]* 9.8 Write property test for toggle is its own inverse (Property 9)
    - **Property 9: Toggling completion is its own inverse**
    - **Validates: Requirements 3.7, 3.8**
    - Use `fc.record({ id: fc.string(), title: fc.string(), completed: fc.boolean() })` with 100 runs; assert double toggle leaves `completed` equal to original value

  - [ ]* 9.9 Write property test for delete removes exactly one task (Property 10)
    - **Property 10: Deleting a task removes exactly that task**
    - **Validates: Requirements 3.9**
    - Use `fc.array(fc.record({...}), { minLength: 1 })` with 100 runs; assert list length is `|L| - 1`, target id absent, remaining tasks in original order

  - [x] 9.10 Implement `editTask(id, newTitle)` with inline editing and Escape cancel
    - Wire Edit button click in `renderTasks`: replace the title `<span>` with an `<input>` pre-populated with the current title and a `data-original-title` attribute
    - On input `blur` or Enter key: if trimmed value is non-empty call `editTask(id, newValue)` else restore original title display
    - On Escape key: restore original title display without calling `editTask`
    - `editTask(id, newTitle)`: trim newTitle; if empty return (edit cancel); update task title in array, call `saveTasks`, call `renderTasks`
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.10_

- [-] 10. Checkpoint — To-Do List verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Quick Links
  - [x] 11.1 Add quick links markup to `#links-section` in `index.html`
    - Add `<input type="text" id="link-label" placeholder="Label">`, `<input type="text" id="link-url" placeholder="https://…">`, `<button id="link-add">Add Link</button>`, `<span id="link-error" class="error" hidden></span>`, and `<div id="link-list"></div>`
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 11.2 Implement `isValidUrl(url)` pure function
    - Return `url.startsWith('http://') || url.startsWith('https://')` — no other validation
    - _Requirements: 4.3_

  - [ ]* 11.3 Write property test for URL validation (Property 11)
    - **Property 11: URL validation accepts only http/https and rejects everything else**
    - **Validates: Requirements 4.3**
    - Use `fc.string()` with at least 100 runs; assert `isValidUrl(u) === (u.startsWith('http://') || u.startsWith('https://'))`

  - [x] 11.4 Implement `loadLinks()`, `saveLinks()`, `addLink()`, `deleteLink()`, and `renderLinks()`
    - `loadLinks()`: call `storageGet('tld_links', [])`, guard with `Array.isArray`
    - `saveLinks(links)`: call `storageSet('tld_links', links)`
    - `addLink(label, url)`: trim label; validate label length (1–100) and `isValidUrl(url)`; show `#link-error` with appropriate message if invalid; on valid: push `{ id: generateId(), label: trimmed, url }`, call `saveLinks`, call `renderLinks`, clear inputs
    - `deleteLink(id)`: filter out by id, call `saveLinks`, call `renderLinks`
    - `renderLinks(links)`: clear `#link-list`; for each link append a `<button>` that opens `window.open(link.url, '_blank')` on click, and a Delete button
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 11.5 Write property test for link serialization round-trip (Property 12)
    - **Property 12: Link serialization round-trip preserves data**
    - **Validates: Requirements 4.6, 4.7**
    - Generate `fc.array(fc.record({ id: fc.string(), label: fc.string(), url: fc.string() }))` with 100 runs; serialize and deserialize, assert deep equality

  - [ ]* 11.6 Write property test for `addLink` grows list by one (Property 13)
    - **Property 13: Adding a valid link grows the list by exactly one**
    - **Validates: Requirements 4.1**
    - Use valid label (1–100 chars) and valid URL (http/https prefix) with 100 runs; assert list length is `|L| + 1` and last entry has trimmed label and original URL

  - [ ]* 11.7 Write property test for `deleteLink` removes exactly one (Property 14)
    - **Property 14: Deleting a link removes exactly that link**
    - **Validates: Requirements 4.5**
    - Use `fc.array(linkArb, { minLength: 1 })` with 100 runs; assert list length is `|L| - 1`, target id absent, remaining links in original order

- [ ] 12. Implement `init()` and wire all widgets together
  - [-] 12.1 Implement the `init()` function in app.js
    - Call `loadSettings()` and store result in a module-level `settings` variable
    - Call `applyTheme(settings.theme)`
    - Call `renderSettings(settings)`
    - Call `startGreetingClock()` (which calls `renderGreeting()` immediately)
    - Call `initTimer()` (reads duration from `settings`)
    - Load tasks with `loadTasks()` and call `renderTasks(tasks)`
    - Load links with `loadLinks()` and call `renderLinks(links)`
    - Wire `#todo-add` click and Enter key on `#todo-input` to `addTask`
    - Wire `#link-add` click to `addLink`
    - Register the `DOMContentLoaded` listener that calls `init()`
    - _Requirements: 1.1, 2.2, 3.11, 4.7, 5.8_

  - [~] 12.2 Verify localStorage unavailability shows warning banner
    - Confirm `storageGet` calls `showStorageWarning()` on any thrown error
    - Confirm `showStorageWarning()` inserts only one `.warning-banner` element even if called multiple times
    - Confirm the banner has a dismiss button that removes it from the DOM
    - _Requirements: 4.8, 5.8_

- [~] 13. Final Checkpoint — Full integration verified
  - Ensure all tests pass and manually verify: greeting renders on load, timer counts down and expires with notification, tasks and links persist across page reload, theme toggle applies instantly, settings save updates greeting and timer, localStorage warning banner appears when storage is blocked.

---

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) loaded via CDN in a separate `tests/` HTML file or run in Node with a test runner
- Each task references specific requirements for traceability
- No build step: all code is written directly into the three project files
- `generateId()` is shared between tasks and links — define it once near the top of app.js
- Timer `timerState` is in-memory only and never persisted to localStorage
- The `settings` variable at module scope is the single source of truth read by `renderGreeting()` and `initTimer()` after each save

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 2, "tasks": ["4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "4.5", "5.1", "6.2", "8.2", "9.2"] },
    { "id": 4, "tasks": ["5.2", "6.3", "6.4", "6.5", "8.3", "9.3"] },
    { "id": 5, "tasks": ["5.3", "6.6", "6.7", "8.4", "9.4"] },
    { "id": 6, "tasks": ["6.8", "8.5", "9.5", "9.6"] },
    { "id": 7, "tasks": ["8.6", "9.7", "11.2"] },
    { "id": 8, "tasks": ["8.3", "9.8", "9.9", "11.3", "11.4"] },
    { "id": 9, "tasks": ["9.10", "11.5", "11.6", "11.7"] },
    { "id": 10, "tasks": ["12.1"] },
    { "id": 11, "tasks": ["12.2"] }
  ]
}
```
