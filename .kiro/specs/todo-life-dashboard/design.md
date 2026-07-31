# Design Document — Todo Life Dashboard

## Overview

Todo Life Dashboard is a single-page, zero-dependency personal productivity application delivered as three static files:

- `index.html` — markup and widget structure
- `css/style.css` — all visual styling, CSS custom properties for theming
- `js/app.js` — all application logic, event handling, and localStorage I/O

There is no build step, no bundler, no framework. The app runs directly from `file://` or any static host. All state lives in `localStorage`; the page is the only runtime surface.

### Design Rationale

Keeping to three files with no module bundler means every concern must be separated at the function/section level inside `app.js` rather than at the file level. The design compensates for this by imposing strict internal conventions: each widget owns a clearly named namespace of functions, a dedicated `localStorage` key, and a single `render*` entry point. Cross-widget communication happens through a small set of well-defined save/load helpers rather than shared mutable globals.

---

## Architecture

### High-Level Component Overview

```
┌─────────────────────────────────────────────────────┐
│                   index.html (DOM)                   │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Greeting   │  │ Focus Timer  │  │  Todo List  │ │
│  │  Widget     │  │              │  │             │ │
│  └─────────────┘  └──────────────┘  └─────────────┘ │
│  ┌─────────────┐  ┌──────────────────────────────┐   │
│  │ Quick Links │  │     Settings Panel            │   │
│  │             │  │                               │   │
│  └─────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
   ┌────────────┐          ┌────────────────┐
   │  app.js    │◄────────►│  localStorage  │
   │  (logic)   │          │  (persistence) │
   └────────────┘          └────────────────┘
          │
          ▼
   ┌────────────┐
   │  style.css │
   │  (theme)   │
   └────────────┘
```

### Data Flow

1. **Page load**: `init()` reads all keys from `localStorage`, applies theme to `<body>`, then calls each widget's `render*` function with the loaded data.
2. **User interaction**: An event listener on the relevant DOM element calls a handler function. The handler mutates in-memory state, writes to `localStorage`, and calls `render*` to update the DOM.
3. **Timer tick**: A `setInterval` callback decrements the timer state, updates the display, and on expiry fires the notification + audio sequence.
4. **Time update**: A `setInterval` callback fires every 60 s to refresh the greeting clock display.

No event bus or pub/sub is needed. The greeting widget re-reads the saved name directly from memory when `renderGreeting()` is called after a settings save.

---

## Components and Interfaces

### Greeting Widget

**DOM element**: `#greeting-section`

| Function | Signature | Responsibility |
|---|---|---|
| `renderGreeting()` | `() → void` | Compute current time/date, pick greeting string, compose display with optional name, write to DOM |
| `startGreetingClock()` | `() → void` | Start 60-second `setInterval` that calls `renderGreeting()` |
| `getGreetingText(hour)` | `(number) → string` | Pure function: map hour (0–23) to greeting string |
| `formatTime(date)` | `(Date) → string` | Pure function: return `"HH:MM"` in 24-hour format |
| `formatDate(date)` | `(Date) → string` | Pure function: return `"DayName, DD MonthName YYYY"` |

### Focus Timer

**DOM element**: `#timer-section`

| Function | Signature | Responsibility |
|---|---|---|
| `initTimer()` | `() → void` | Set `timerState` from settings, render initial display, wire button events |
| `startTimer()` | `() → void` | Guard if already running; set `setInterval`, update button states |
| `stopTimer()` | `() → void` | Clear interval, update button states |
| `resetTimer()` | `() → void` | Stop, restore duration, render |
| `tickTimer()` | `() → void` | Decrement remaining seconds, render; on zero call `timerExpired()` |
| `timerExpired()` | `() → void` | Stop, show notification, play audio |
| `renderTimer()` | `() → void` | Format `timerState.remaining` as `MM:SS`, write to DOM |
| `formatMMSS(seconds)` | `(number) → string` | Pure function: convert total seconds to `"MM:SS"` |

**Timer state** (in-memory only, not persisted):

```js
const timerState = {
  remaining: 0,    // seconds remaining
  running: false,
  intervalId: null
};
```

### To-Do List

**DOM element**: `#todo-section`

| Function | Signature | Responsibility |
|---|---|---|
| `loadTasks()` | `() → Task[]` | Read and parse tasks from localStorage |
| `saveTasks(tasks)` | `(Task[]) → void` | Serialize and write tasks to localStorage |
| `addTask(title)` | `(string) → void` | Validate, create Task, append, save, render |
| `editTask(id, newTitle)` | `(string, string) → void` | Validate, update task by id, save, render |
| `toggleTask(id)` | `(string) → void` | Flip `completed` flag, save, render |
| `deleteTask(id)` | `(string) → void` | Filter out task by id, save, render |
| `renderTasks(tasks)` | `(Task[]) → void` | Rebuild `#task-list` DOM from task array |
| `generateId()` | `() → string` | Return a unique string id (timestamp + random suffix) |

### Quick Links

**DOM element**: `#links-section`

| Function | Signature | Responsibility |
|---|---|---|
| `loadLinks()` | `() → Link[]` | Read and parse links from localStorage |
| `saveLinks(links)` | `(Link[]) → void` | Serialize and write links to localStorage |
| `addLink(label, url)` | `(string, string) → void` | Validate, create Link, append, save, render |
| `deleteLink(id)` | `(string) → void` | Filter out link by id, save, render |
| `renderLinks(links)` | `(Link[]) → void` | Rebuild `#link-list` DOM from links array |
| `isValidUrl(url)` | `(string) → boolean` | Pure function: return true if url starts with `http://` or `https://` |

### Settings Panel

**DOM element**: `#settings-section`

| Function | Signature | Responsibility |
|---|---|---|
| `loadSettings()` | `() → Settings` | Read and parse settings from localStorage; fill in defaults |
| `saveSettings(partial)` | `(Partial<Settings>) → void` | Merge partial update, validate, write to localStorage |
| `applyTheme(theme)` | `(string) → void` | Set `data-theme` attribute on `<body>` |
| `renderSettings(settings)` | `(Settings) → void` | Populate settings form fields from settings object |
| `validateName(name)` | `(string) → boolean` | Pure: trimmed length 1–50 |
| `validateDuration(value)` | `(number|string) → boolean` | Pure: integer, 1–120 |

---

## File Structure

```
project-root/
├── index.html          # Single HTML file — all widget markup
├── css/
│   └── style.css       # All styles, custom properties, responsive layout
└── js/
    └── app.js          # All JavaScript logic
```

### index.html Layout

```html
<body data-theme="light">
  <header>
    <section id="greeting-section">…</section>
    <button id="settings-toggle">⚙</button>
  </header>

  <main>
    <section id="timer-section">…</section>
    <section id="todo-section">…</section>
    <section id="links-section">…</section>
  </main>

  <aside id="settings-section">…</aside>
</body>
```

Widgets are self-contained `<section>` elements. No widget's markup is nested inside another. The settings panel is an `<aside>` that overlays or slides in from the side depending on viewport.

---

## CSS Architecture

### Custom Properties (Design Tokens)

All colors, spacing, and radius values are declared as CSS custom properties on `:root` and overridden for the dark theme via `[data-theme="dark"]` on `<body>`:

```css
:root {
  /* Colors — Light theme defaults */
  --color-bg:           #f5f5f5;
  --color-surface:      #ffffff;
  --color-surface-alt:  #f0f0f0;
  --color-border:       #dddddd;
  --color-text-primary: #1a1a1a;
  --color-text-muted:   #666666;
  --color-accent:       #4a90e2;
  --color-accent-hover: #357abd;
  --color-danger:       #e05252;
  --color-success:      #52a852;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: "Courier New", monospace;

  /* Spacing scale */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 80ms ease;
}

[data-theme="dark"] {
  --color-bg:           #1a1a2e;
  --color-surface:      #16213e;
  --color-surface-alt:  #3b0f60;
  --color-border:       #2a2a4a;
  --color-text-primary: #e0e0e0;
  --color-text-muted:   #9090a0;
  --color-accent:       #6fa8dc;
  --color-accent-hover: #90c4f0;
  --color-danger:       #e07070;
  --color-success:      #70c870;
}
```

Switching theme is a single attribute change on `<body>`; every element using `var(--color-*)` re-paints automatically within the browser's next style recalculation cycle — well under the 100 ms requirement.

### Responsive Layout

The page uses CSS Grid for the main area:

```css
main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-lg);
  padding: var(--space-lg);
}
```

On narrow viewports (< 480 px) `minmax` collapses everything to a single column. No media queries are required for the core layout; a single media query handles the settings panel positioning.

---

## Data Models

All data stored in `localStorage` is JSON-serialized. Keys are prefixed with `tld_` (Todo Life Dashboard) to avoid collisions.

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string}  id        - Unique identifier (timestamp + random suffix)
 * @property {string}  title     - Task text, 1–255 chars (trimmed before save)
 * @property {boolean} completed - Whether the task is done
 */
```

`localStorage` key: `tld_tasks`  
Stored as: `JSON.stringify(Task[])`

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} id    - Unique identifier
 * @property {string} label - Display text, 1–100 chars (trimmed before save)
 * @property {string} url   - Full URL, must begin with http:// or https://
 */
```

`localStorage` key: `tld_links`  
Stored as: `JSON.stringify(Link[])`

### Settings

```js
/**
 * @typedef {Object} Settings
 * @property {string} theme    - "light" | "dark"  (default: "light")
 * @property {string} name     - Custom greeting name, 0–50 chars  (default: "")
 * @property {number} duration - Timer duration in minutes, 1–120  (default: 25)
 */
```

`localStorage` key: `tld_settings`  
Stored as: `JSON.stringify(Settings)`

Default object returned by `loadSettings()` when no key exists:

```js
{ theme: "light", name: "", duration: 25 }
```

### localStorage Key Summary

| Key | Contents | Default |
|---|---|---|
| `tld_tasks` | `Task[]` JSON array | `[]` |
| `tld_links` | `Link[]` JSON array | `[]` |
| `tld_settings` | `Settings` JSON object | `{ theme: "light", name: "", duration: 25 }` |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting time mapping is exhaustive and deterministic

*For any* integer hour in the range 0–23, `getGreetingText(hour)` SHALL return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night" — never an empty string or any other value, and two calls with the same hour always return the same string.

**Validates: Requirements 1.4, 1.5, 1.6, 1.7**

---

### Property 2: Time formatting preserves structure

*For any* valid `Date` object, `formatTime(date)` SHALL return a string of exactly 5 characters matching the pattern `HH:MM`, where HH is 00–23 and MM is 00–59.

**Validates: Requirements 1.1**

---

### Property 3: Date formatting preserves structure

*For any* valid `Date` object, `formatDate(date)` SHALL return a string whose first token is a valid English day name, followed by a zero-padded two-digit day, a valid English month name, and a four-digit year — in that exact order.

**Validates: Requirements 1.3**

---

### Property 4: Greeting with name follows "[Greeting], [Name]" format

*For any* valid greeting string G and any non-empty name string N (1–50 trimmed characters), composing the greeting SHALL produce a string that starts with G, contains a comma-space separator, and ends with N.

**Validates: Requirements 1.8**

---

### Property 5: Timer MM:SS formatting round-trips through total seconds

*For any* integer number of seconds S in the range 0–7199 (0–119 min 59 sec), `formatMMSS(S)` SHALL return a string of exactly 5 characters matching `MM:SS`, where MM is 00–99 and SS is 00–59, and `parseInt(MM) * 60 + parseInt(SS) === S`.

**Validates: Requirements 2.1**

---

### Property 6: Task serialization round-trip preserves data

*For any* array of Task objects, serializing the array to JSON and immediately deserializing it SHALL produce an array equal in length and with each task's `id`, `title`, and `completed` fields identical to the originals.

**Validates: Requirements 3.10, 3.11**

---

### Property 7: Adding a valid task grows the list by exactly one

*For any* task list L and any non-empty title string T (1–255 trimmed characters), calling `addTask(T)` on L SHALL result in a task list of length `|L| + 1` and the last element SHALL have `title === T.trim()` and `completed === false`.

**Validates: Requirements 3.1**

---

### Property 8: Whitespace-only task titles are always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), submitting it as a task title SHALL leave the task list unchanged and SHALL not write a new entry to localStorage.

**Validates: Requirements 3.2**

---

### Property 9: Toggling completion is its own inverse

*For any* task T, calling `toggleTask(T.id)` twice in succession SHALL leave `T.completed` equal to its original value.

**Validates: Requirements 3.7, 3.8**

---

### Property 10: Deleting a task removes exactly that task

*For any* task list L containing a task with id X, calling `deleteTask(X)` SHALL produce a list of length `|L| - 1` that contains no task with id X, and all other tasks SHALL remain in their original order.

**Validates: Requirements 3.9**

---

### Property 11: URL validation accepts only http/https and rejects everything else

*For any* string U, `isValidUrl(U)` SHALL return `true` if and only if U starts with `"http://"` or `"https://"`. For any string that does not start with either prefix, it SHALL return `false`.

**Validates: Requirements 4.3**

---

### Property 12: Link serialization round-trip preserves data

*For any* array of Link objects, serializing to JSON and deserializing SHALL produce an array equal in length where each link's `id`, `label`, and `url` fields are identical to the originals.

**Validates: Requirements 4.6, 4.7**

---

### Property 13: Adding a valid link grows the list by exactly one

*For any* link list L, valid label (1–100 trimmed chars), and valid URL (http/https prefix), calling `addLink(label, url)` SHALL produce a list of length `|L| + 1` with the new entry at the end having the trimmed label and the original URL.

**Validates: Requirements 4.1**

---

### Property 14: Deleting a link removes exactly that link

*For any* link list L containing a link with id X, calling `deleteLink(X)` SHALL produce a list of length `|L| - 1` containing no link with id X, with all remaining links in their original order.

**Validates: Requirements 4.5**

---

### Property 15: Settings serialization round-trip preserves all fields

*For any* Settings object with valid `theme`, `name`, and `duration` values, serializing to JSON and deserializing SHALL produce a Settings object with identical values for all three fields.

**Validates: Requirements 5.3, 5.8**

---

### Property 16: Name validation accepts 1–50 trimmed characters and rejects all others

*For any* string S, `validateName(S)` SHALL return `true` if and only if `S.trim().length` is in the range [1, 50]. Strings where the trimmed length is 0 or > 50 SHALL return `false`.

**Validates: Requirements 1.8, 5.4, 5.5**

---

### Property 17: Duration validation accepts integers 1–120 and rejects all others

*For any* value V, `validateDuration(V)` SHALL return `true` if and only if `Number(V)` is an integer in the range [1, 120]. Non-integer numbers, strings that do not parse to an integer, and out-of-range integers SHALL return `false`.

**Validates: Requirements 2.9, 2.10, 5.6, 5.7**

---

## Error Handling

### localStorage Unavailability

`localStorage` may be unavailable (e.g., private browsing with strict settings, storage quota exceeded). All read operations (`loadTasks`, `loadLinks`, `loadSettings`) are wrapped in `try/catch`. On failure:

- Tasks and links widgets render as empty.
- Settings defaults are used in memory.
- A single non-blocking warning banner is displayed at the top of the page (yellow background, dismissable).
- Write operations are similarly wrapped; a silent failure is acceptable for writes provided the in-memory state remains consistent.

### Clock Unavailability

`new Date()` returning an invalid date (e.g., `isNaN(date.getTime())`) is caught in `renderGreeting()`. When detected, the time display shows `"--:--"`, the date area shows `"---"`, and the greeting is omitted entirely.

### Timer Out-of-Range Duration

If `loadSettings()` returns a duration outside 1–120 (e.g., corrupted localStorage value), `initTimer()` clamps it to 25 before use. The settings form shows the clamped value on re-render.

### URL Validation Errors

`addLink()` runs `isValidUrl()` before appending. Invalid URLs surface an inline `<span class="error">` message adjacent to the URL input. The input value is preserved so the user can correct it.

### Edit Cancellation / Empty Edit

`editTask()` called with an empty or whitespace-only title restores the original title (stored in a `data-original-title` attribute on the edit input) and removes the edit input without modifying the task array.

---

## Testing Strategy

### Assessment: Is Property-Based Testing Appropriate?

This feature is a client-side JavaScript application. Several of its core functions are **pure functions** with clear input/output behavior and universal properties that should hold across a wide input space:

- `getGreetingText(hour)` — maps integers to strings
- `formatTime(date)` / `formatDate(date)` / `formatMMSS(seconds)` — format functions
- `isValidUrl(url)` / `validateName(name)` / `validateDuration(value)` — validation functions
- Task/Link serialization/deserialization — round-trip properties
- `addTask`, `toggleTask`, `deleteTask` — list mutation invariants

PBT **is** appropriate for these pure/near-pure functions. UI rendering and `setInterval`-based behavior are not suitable for PBT and will be covered by example-based tests.

**Chosen PBT library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, browser-compatible via CDN for manual testing; or run in Node with a test runner for CI).

### Unit / Example-Based Tests

Cover specific scenarios that are not universally quantifiable:

- Timer start → stop → resume preserves remaining time
- Timer start → reset restores configured duration
- Timer expiry triggers notification and audio
- Settings panel opens and closes correctly
- Theme toggle class is applied to `<body>`
- localStorage unavailability shows warning banner
- Edit flow: enter edit mode → cancel (Escape) → original title restored
- Quick-link button click opens correct URL in new tab

### Property-Based Tests

Each property test uses `fast-check` with a minimum of **100 iterations**. Each test is tagged with a comment referencing the design property.

| Property | Generator | Assertion |
|---|---|---|
| P1: Greeting mapping exhaustive | `fc.integer({ min: 0, max: 23 })` | result is one of the 4 greeting strings |
| P2: Time format structure | `fc.date()` | 5-char string matching `/^\d{2}:\d{2}$/` |
| P3: Date format structure | `fc.date()` | tokens match day/date/month/year pattern |
| P4: Greeting + name format | `fc.tuple(greetingArb, nameArb)` | starts with greeting, contains ", ", ends with name |
| P5: MM:SS round-trip | `fc.integer({ min: 0, max: 7199 })` | exact seconds recovered from MM:SS parts |
| P6: Task round-trip | `fc.array(taskArbitrary)` | deserialized array deeply equals original |
| P7: Add task grows list | `fc.tuple(taskArrayArb, validTitleArb)` | length + 1, last item matches title |
| P8: Whitespace title rejected | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` | list unchanged |
| P9: Toggle is involution | `fc.record({ id, title, completed })` | double toggle = original state |
| P10: Delete removes exactly one | `fc.array(taskArbitrary, { minLength: 1 })` | length - 1, id absent, order preserved |
| P11: URL validation | `fc.string()` | matches http/https prefix logic |
| P12: Link round-trip | `fc.array(linkArbitrary)` | deserialized array deeply equals original |
| P13: Add link grows list | `fc.tuple(linkArrayArb, validLabelArb, validUrlArb)` | length + 1, last item matches inputs |
| P14: Delete link removes exactly one | `fc.array(linkArbitrary, { minLength: 1 })` | length - 1, id absent, order preserved |
| P15: Settings round-trip | `fc.record(settingsArbitrary)` | deserialized object deeply equals original |
| P16: Name validation | `fc.string()` | matches trimmed-length [1, 50] logic |
| P17: Duration validation | `fc.oneof(fc.integer(), fc.float(), fc.string())` | matches integer in [1, 120] logic |

**Tag format for each test:**
```
// Feature: todo-life-dashboard, Property N: <property_text>
```

### Integration / Smoke Tests

Manual checklist (no automated framework required for the static file constraint):

1. Open `index.html` in Chrome 90, Firefox 88, Edge 90, Safari 14 — verify all widgets render.
2. Toggle theme → verify all surfaces change color within 100 ms.
3. Add task, reload page → verify task persists.
4. Add link, click link button → verify new tab opens with correct URL.
5. Start timer, let it expire → verify notification and audio.
6. Open DevTools, set `localStorage.clear()`, reload → verify graceful empty state.
7. Open DevTools, block localStorage (`Object.defineProperty(window, 'localStorage', ...)`), reload → verify warning banner.
