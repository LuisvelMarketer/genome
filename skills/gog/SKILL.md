---
name: gog
description: "Google Workspace CLI (`gog`) for Gmail, Google Calendar, Google Drive, Contacts, Google Sheets, and Google Docs. Use when the user asks to send or read emails, search Gmail, schedule or list calendar events, upload or download files from Google Drive, manage contacts, read or write Google Sheets data, or create and export Google Docs. Supports actions like sending plain or HTML emails, creating calendar events with colors, querying spreadsheet ranges, and exporting Docs. Requires OAuth setup."
homepage: https://gogcli.sh
metadata:
  {
    "genoma":
      {
        "emoji": "🎮",
        "requires": { "bins": ["gog"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "LuisvelMarketer/tap/gogcli",
              "bins": ["gog"],
              "label": "Install gog (brew)",
            },
          ],
      },
  }
---

# gog

Use `gog` for Gmail/Calendar/Drive/Contacts/Sheets/Docs. Requires OAuth setup.

## Setup (once)

- `gog auth credentials /path/to/client_secret.json`
- `gog auth add you@gmail.com --services gmail,calendar,drive,contacts,docs,sheets`
- `gog auth list`

## Safety Workflow for Destructive Operations

**Always follow this pattern before dispatching any destructive action (sending email, modifying sheets, creating/updating calendar events):**

1. **Preview / draft** — create a draft or display the data to be written
2. **Confirm with the user** — show what will be sent/modified and wait for explicit approval
3. **Dispatch** — execute the final action only after confirmation

| Service | Preview step | Dispatch step |
|---|---|---|
| Gmail | `gog gmail drafts create --to … --subject … --body-file …` | `gog gmail drafts send <draftId>` |
| Sheets | `gog sheets get <sheetId> "Tab!range" --json` (show current data) | `gog sheets update/append/clear …` |
| Calendar | Show event details to user for review | `gog calendar create/update …` |

For scripting, add `--no-input` and confirm programmatically.

## Common Commands

**Gmail**
- Search threads: `gog gmail search 'newer_than:7d' --max 10`
- Search individual messages: `gog gmail messages search "in:inbox from:ryanair.com" --max 20`
- Send (plain): `gog gmail send --to a@b.com --subject "Hi" --body "Hello"`
- Send (multi-line): `gog gmail send --to a@b.com --subject "Hi" --body-file ./message.txt`
- Reply: `gog gmail send --to a@b.com --subject "Re: Hi" --body "Reply" --reply-to-message-id <msgId>`

**Calendar**
- List events: `gog calendar events <calendarId> --from <iso> --to <iso>`
- Create event: `gog calendar create <calendarId> --summary "Title" --from <iso> --to <iso>`
- Create with color: `gog calendar create <calendarId> --summary "Title" --from <iso> --to <iso> --event-color 7`

**Drive / Contacts**
- Drive search: `gog drive search "query" --max 10`
- Contacts list: `gog contacts list --max 20`

**Sheets**
- Get range: `gog sheets get <sheetId> "Tab!A1:D10" --json`
- Update cells: `gog sheets update <sheetId> "Tab!A1:B2" --values-json '[["A","B"],["1","2"]]' --input USER_ENTERED`
- Append rows: `gog sheets append <sheetId> "Tab!A:C" --values-json '[["x","y","z"]]' --insert INSERT_ROWS`

**Docs**
- Export: `gog docs export <docId> --format txt --out /tmp/doc.txt`
- Cat: `gog docs cat <docId>`

For the full command reference (drafts, clear, metadata, update, colors, etc.) run `gog <service> --help`.

## Calendar Colors

- Use `gog calendar colors` to see all available event colors (IDs 1-11)
- Add colors to events with `--event-color <id>` flag
- Update an existing event's color: `gog calendar update <calendarId> <eventId> --summary "New Title" --event-color 4`

## Email Formatting

- Prefer plain text. Use `--body-file` for multi-paragraph messages (or `--body-file -` for stdin).
- Same `--body-file` pattern works for drafts and replies.
- `--body` does not unescape `\n`. If you need inline newlines, use a heredoc or `$'Line 1\n\nLine 2'`.
- Use `--body-html` only when you need rich formatting.
- Example (plain text via stdin):

  ```bash
  gog gmail send --to recipient@example.com \
    --subject "Meeting Follow-up" \
    --body-file - <<'EOF'
  Hi Name,

  Thanks for meeting today. Next steps:
  - Item one
  - Item two

  Best regards,
  Your Name
  EOF
  ```

- Example (HTML list):
  ```bash
  gog gmail send --to recipient@example.com \
    --subject "Meeting Follow-up" \
    --body-html "<p>Hi Name,</p><p>Thanks for meeting today. Here are the next steps:</p><ul><li>Item one</li><li>Item two</li></ul><p>Best regards,<br>Your Name</p>"
  ```

## Notes

- Set `GOG_ACCOUNT=you@gmail.com` to avoid repeating `--account`.
- For scripting, prefer `--json` plus `--no-input`.
- Sheets values can be passed via `--values-json` (recommended) or as inline rows.
- Docs supports export/cat/copy. In-place edits require a Docs API client (not in gog).
- `gog gmail search` returns one row per thread; use `gog gmail messages search` when you need every individual email returned separately.
