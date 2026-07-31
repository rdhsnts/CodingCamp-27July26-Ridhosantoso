# Requirements Document

## Introduction

Todo Life Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a personal productivity dashboard featuring a time-aware greeting, a Pomodoro focus timer, a to-do list, quick-access links, and a customizable theme. All user data is persisted using the browser's Local Storage API. No backend server or build toolchain is required.

## Glossary

- **Dashboard**: The single-page web application that contains all widgets.
- **Greeting_Widget**: The UI section that displays the current time, date, and a personalized greeting message.
- **Timer**: The Pomodoro focus countdown timer widget.
- **Todo_List**: The widget that manages a collection of Task items.
- **Task**: A single to-do item with a title, completion state, and unique identifier.
- **Quick_Links**: The widget that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-access entry consisting of a label and a URL.
- **Settings**: The configuration panel where the user can set a custom name, choose a theme, and adjust the timer duration.
- **Storage**: The browser Local Storage API used to persist all user data.
- **Theme**: The visual color scheme of the Dashboard, either Light or Dark.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting, so that I have immediate situational awareness when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 24-hour HH:MM format on page load.
2. THE Greeting_Widget SHALL update the displayed time every 60 seconds without requiring a page reload.
3. THE Greeting_Widget SHALL display the current local date in the format "DayName, DD MonthName YYYY" (e.g., "Monday, 28 July 2026").
4. WHEN the current local hour is between 05 and 11 inclusive, THE Greeting_Widget SHALL display the greeting "Good Morning".
5. WHEN the current local hour is between 12 and 17 inclusive, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. WHEN the current local hour is between 18 and 21 inclusive, THE Greeting_Widget SHALL display the greeting "Good Evening".
7. WHEN the current local hour is between 22 and 23 inclusive, OR between 00 and 04 inclusive, THE Greeting_Widget SHALL display the greeting "Good Night".
8. WHERE a custom name (1–50 characters) has been saved in Settings, THE Greeting_Widget SHALL display the greeting in the format "[Greeting], [Name]" (e.g., "Good Morning, Ridho").
9. WHERE no custom name has been saved, THE Greeting_Widget SHALL display the greeting text without a name suffix.
10. IF the system clock is unavailable or returns an invalid value, THEN THE Greeting_Widget SHALL display a static fallback string (e.g., "--:--") in place of the time and date, and omit the greeting text.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a Pomodoro countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Timer SHALL display the remaining countdown time in MM:SS format, where MM is zero-padded to two digits (00–99) and SS is zero-padded to two digits (00–59).
2. WHEN the Dashboard first loads, THE Timer SHALL display the configured duration in MM:SS format with the Start control enabled and the Stop control disabled.
3. WHEN the user activates the Start control while the Timer is not counting down, THE Timer SHALL begin counting down one second per interval, disable the Start control, and enable the Stop control.
4. WHILE the Timer is counting down, THE Timer SHALL decrement the displayed value by one second and refresh the display once per second.
5. WHEN the user activates the Stop control while the Timer is counting down, THE Timer SHALL pause the countdown, retain the current remaining time, disable the Stop control, and re-enable the Start control.
6. WHEN the user activates the Reset control, THE Timer SHALL stop any active countdown, restore the displayed time to the configured duration, enable the Start control, and disable the Stop control.
7. WHEN the countdown reaches 00:00, THE Timer SHALL stop automatically, display a visible on-screen notification for at least 3 seconds, and play an audible signal of at least 1 second duration if the browser tab is not muted.
8. WHEN the user activates the Start control while the Timer is already counting down, THE Timer SHALL ignore the activation and continue the current countdown unchanged.
9. WHERE a custom timer duration (1–120 minutes) has been saved in Settings, THE Timer SHALL use that duration as its starting value on load or after a reset.
10. IF a custom timer duration value outside the range of 1 to 120 minutes is entered in Settings, THEN THE Settings SHALL reject the value, display an inline error message indicating the valid range, and retain the previously saved duration.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can track my work items within the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task title (1–255 characters after trimming), THE Todo_List SHALL append a new Task with that trimmed title, an incomplete state, and a unique identifier to the bottom of the list.
2. IF the user submits an empty or whitespace-only task title, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
3. WHEN the user activates the edit control on a Task, THE Todo_List SHALL replace the Task's title display with an editable input field pre-populated with the current title.
4. WHEN the user confirms an edited Task title that is non-empty (1–255 characters after trimming), THE Todo_List SHALL update the Task with the trimmed new title and restore the display view.
5. IF the user confirms an edited Task title that is empty or whitespace-only, THEN THE Todo_List SHALL reject the update and restore the original title display.
6. WHEN the user cancels an in-progress edit (e.g., pressing Escape), THE Todo_List SHALL discard all changes and restore the original title display without modifying the Task.
7. WHEN the user toggles the completion control on an incomplete Task, THE Todo_List SHALL mark the Task as complete and apply a strikethrough style to the title.
8. WHEN the user toggles the completion control on a complete Task, THE Todo_List SHALL mark the Task as incomplete and remove the strikethrough style from the title.
9. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove that Task from the list immediately without a confirmation prompt.
10. WHEN any Task is added, updated, or deleted, THE Storage SHALL persist the full updated Task collection to Local Storage before the next user interaction is processed.
11. WHEN the Dashboard loads, THE Todo_List SHALL restore all Tasks from Local Storage and render them in their saved order and completion state.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to add and manage shortcut buttons to my favorite websites, so that I can open them quickly from the Dashboard.

#### Acceptance Criteria

1. WHEN the user submits a valid Link label (1–100 characters) and a valid URL, THE Quick_Links SHALL append a new shortcut button displaying the label text to the end of the link list.
2. IF the user submits a Link with an empty label, an empty URL, or a label exceeding 100 characters, THEN THE Quick_Links SHALL reject the submission, display an inline validation message, and preserve the input field values.
3. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL reject the submission, display an inline validation message indicating the required format, and preserve the input field values.
4. WHEN the user activates a Link button, THE Dashboard SHALL open the associated URL in a new browser tab without navigating away from the Dashboard.
5. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL remove that Link from the list without navigating away from the Dashboard.
6. WHEN any Link is added or deleted, THE Storage SHALL persist the full updated Link collection to Local Storage within 1 second.
7. WHEN the Dashboard loads, THE Quick_Links SHALL restore all Links from Local Storage and render the corresponding shortcut buttons in their saved order within 500 milliseconds.
8. IF Local Storage is unavailable or returns a read error on Dashboard load, THEN THE Quick_Links SHALL render an empty link list and display a non-blocking warning message to the user.

---

### Requirement 5: Theme and Settings

**User Story:** As a user, I want to toggle between Light and Dark mode, set a custom name, and adjust the timer duration, so that I can personalize my Dashboard experience.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control to switch between Light Theme and Dark Theme.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme to all visible UI elements within 100 milliseconds without a page reload.
3. WHEN the theme is changed, THE Settings SHALL persist the selected Theme identifier to Local Storage.
4. WHEN the user saves a non-empty custom name (1–50 characters after trimming) in Settings, THE Settings SHALL persist the trimmed name to Local Storage and THE Greeting_Widget SHALL update the displayed greeting within 100 milliseconds.
5. IF the user saves a custom name that exceeds 50 characters after trimming, THEN THE Settings SHALL reject the value, display an inline error message, and retain the previously saved name.
6. WHEN the user saves a valid timer duration (integer between 1 and 120 minutes) in Settings, THE Settings SHALL persist the duration to Local Storage and THE Timer SHALL use the new duration on the next reset.
7. IF the user saves a timer duration that is not an integer or is outside the range of 1 to 120 minutes, THEN THE Settings SHALL reject the value, display an inline error message indicating the valid range (1–120), and retain the previously saved duration.
8. WHEN the Dashboard loads, THE Dashboard SHALL restore the saved Theme, custom name, and timer duration from Local Storage and apply them before rendering any visible content.
9. WHERE no Theme preference has been saved, THE Dashboard SHALL default to Light Theme on first load.
10. WHERE no custom name has been saved, THE Settings name field SHALL be empty and THE Greeting_Widget SHALL display no name suffix.
11. WHERE no timer duration has been saved, THE Timer SHALL default to 25 minutes on first load.
