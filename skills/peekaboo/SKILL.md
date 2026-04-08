---
name: peekaboo
description: "Uses the Peekaboo CLI to automate macOS desktop UI interactions: take screenshots, capture screen regions or windows, inspect accessibility trees, list UI elements, click buttons, type text, drag, scroll, manage apps and windows, navigate menus, and drive keyboard/mouse input. Use when the user asks to take a screenshot, capture the screen, inspect or interact with UI elements, automate macOS GUI workflows, perform desktop automation, test accessibility, or use Peekaboo CLI commands."
homepage: https://peekaboo.boo
metadata:
  {
    "genoma":
      {
        "emoji": "👀",
        "os": ["darwin"],
        "requires": { "bins": ["peekaboo"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "LuisvelMarketer/tap/peekaboo",
              "bins": ["peekaboo"],
              "label": "Install Peekaboo (brew)",
            },
          ],
      },
  }
---

# Peekaboo

Peekaboo is a full macOS UI automation CLI: capture/inspect screens, target UI
elements, drive input, and manage apps/windows/menus. Commands share a snapshot
cache and support `--json`/`-j` for scripting. Run `peekaboo` or
`peekaboo <cmd> --help` for flags; `peekaboo --version` prints build metadata.
Tip: run via `polter peekaboo` to ensure fresh builds.

## Features (all CLI capabilities, excluding agent/MCP)

Core: `bridge`, `capture`, `clean`, `config`, `image`, `learn`, `list`,
`permissions`, `run`, `sleep`, `tools`

Interaction: `click`, `drag`, `hotkey`, `move`, `paste`, `press`, `scroll`,
`swipe`, `type`

System: `app`, `clipboard`, `dialog`, `dock`, `menu`, `menubar`, `open`,
`space`, `visualizer`, `window`

Vision: `see` — annotated UI maps, snapshot IDs, optional analysis

Run `peekaboo <cmd> --help` for the full flag reference for any command.

Global runtime flags

- `--json`/`-j`, `--verbose`/`-v`, `--log-level <level>`
- `--no-remote`, `--bridge-socket <path>`

## Quickstart (happy path)

```bash
peekaboo permissions
peekaboo list apps --json
peekaboo see --annotate --path /tmp/peekaboo-see.png
peekaboo click --on B1
peekaboo type "Hello" --return
```

## Common targeting parameters (most interaction commands)

- App/window: `--app`, `--pid`, `--window-title`, `--window-id`, `--window-index`
- Snapshot targeting: `--snapshot` (ID from `see`; defaults to latest)
- Element/coords: `--on`/`--id` (element ID), `--coords x,y`
- Focus control: `--no-auto-focus`, `--space-switch`, `--bring-to-current-space`,
  `--focus-timeout-seconds`, `--focus-retry-count`

## Common capture parameters

- Output: `--path`, `--format png|jpg`, `--retina`
- Targeting: `--mode screen|window|frontmost`, `--screen-index`,
  `--window-title`, `--window-id`
- Analysis: `--analyze "prompt"`, `--annotate`
- Capture engine: `--capture-engine auto|classic|cg|modern|sckit`

## Common motion/typing parameters

- Timing: `--duration` (drag/swipe), `--steps`, `--delay` (type/scroll/press)
- Human-ish movement: `--profile human|linear`, `--wpm` (typing)
- Scroll: `--direction up|down|left|right`, `--amount <ticks>`, `--smooth`

## Examples

### See -> click -> type (most reliable flow)

Always call `see` first to get a fresh annotated snapshot, verify the expected
element IDs appear in the output, then proceed to interact.

```bash
peekaboo see --app Safari --window-title "Login" --annotate --path /tmp/see.png --json
# Inspect the JSON output to confirm the expected element IDs (e.g. B3, T1) are present.
# If the expected element is missing, re-run see or check --window-title matches.

peekaboo click --on B3 --app Safari
# Confirm the click succeeded (no error exit code / error message) before continuing.

peekaboo type "user@example.com" --app Safari
peekaboo press tab --count 1 --app Safari
peekaboo type "supersecret" --app Safari --return
```

### Target by window id

```bash
peekaboo list windows --app "Visual Studio Code" --json
peekaboo click --window-id 12345 --coords 120,160
peekaboo type "Hello from Peekaboo" --window-id 12345
```

### Capture screenshots + analyze

```bash
peekaboo image --mode screen --screen-index 0 --retina --path /tmp/screen.png
peekaboo image --app Safari --window-title "Dashboard" --analyze "Summarize KPIs"
peekaboo see --mode screen --screen-index 0 --analyze "Summarize the dashboard"
```

### Live capture (motion-aware)

```bash
peekaboo capture live --mode region --region 100,100,800,600 --duration 30 \
  --active-fps 8 --idle-fps 2 --highlight-changes --path /tmp/capture
```

### App + window management

```bash
peekaboo app launch "Safari" --open https://example.com
peekaboo window focus --app Safari --window-title "Example"
peekaboo window set-bounds --app Safari --x 50 --y 50 --width 1200 --height 800
peekaboo app quit --app Safari
```

### Menus, menubar, dock

```bash
peekaboo menu click --app Safari --item "New Window"
peekaboo menu click --app TextEdit --path "Format > Font > Show Fonts"
peekaboo menu click-extra --title "WiFi"
peekaboo dock launch Safari
peekaboo menubar list --json
```

### Mouse + gesture input

```bash
peekaboo move 500,300 --smooth
peekaboo drag --from B1 --to T2
peekaboo swipe --from-coords 100,500 --to-coords 100,200 --duration 800
peekaboo scroll --direction down --amount 6 --smooth
```

### Keyboard input

```bash
peekaboo hotkey --keys "cmd,shift,t"
peekaboo press escape
peekaboo type "Line 1\nLine 2" --delay 10
```

## Troubleshooting & error recovery

| Symptom | Recovery |
|---|---|
| `permissions denied` / commands silently fail | Run `peekaboo permissions` and grant Screen Recording + Accessibility in System Settings. |
| Element not found / wrong element clicked | Re-run `peekaboo see --annotate --json` to refresh the snapshot; element IDs change after UI updates. |
| Stale snapshot IDs | Always use the snapshot ID returned by the most recent `see` call; cache is invalidated on UI changes. |
| Window not targeted correctly | Use `peekaboo list windows --app <App> --json` to confirm `--window-id` or exact `--window-title`. |
| Click has no effect | Add `--space-switch` or `--bring-to-current-space` if the window is on another Space; also try `--focus-timeout-seconds`. |

Notes

- Requires Screen Recording + Accessibility permissions.
- Use `peekaboo see --annotate` to identify targets before clicking.
