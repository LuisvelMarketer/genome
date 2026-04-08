---
name: obsidian
description: "Create, search, move, delete, and link notes in Obsidian vaults; query vault contents, manage backlinks, and automate note operations via obsidian-cli. Use when the user mentions Obsidian, vault management, note linking, backlinks, daily notes, tags, zettelkasten, knowledge base, .md files, or obsidian-cli commands."
homepage: https://help.obsidian.md
metadata:
  {
    "genoma":
      {
        "emoji": "💎",
        "requires": { "bins": ["obsidian-cli"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "yakitrak/yakitrak/obsidian-cli",
              "bins": ["obsidian-cli"],
              "label": "Install obsidian-cli (brew)",
            },
          ],
      },
  }
---

# Obsidian

Obsidian vault = a normal folder on disk.

Vault structure (typical)

- Notes: `*.md` (plain text Markdown; edit with any editor)
- Config: `.obsidian/` (workspace + plugin settings; usually don't touch from scripts)
- Canvases: `*.canvas` (JSON)
- Attachments: whatever folder you chose in Obsidian settings (images/PDFs/etc.)

## Find the active vault(s)

Obsidian desktop tracks vaults here (source of truth):

- `~/Library/Application Support/obsidian/obsidian.json`

`obsidian-cli` resolves vaults from that file; vault name is typically the **folder name** (path suffix).

Fast "what vault is active / where are the notes?"

- If you've already set a default: `obsidian-cli print-default --path-only`
- Otherwise, read `~/Library/Application Support/obsidian/obsidian.json` and use the vault entry with `"open": true`.

Notes

- Multiple vaults common (iCloud vs `~/Documents`, work/personal, etc.). Don't guess; read config.
- Avoid writing hardcoded vault paths into scripts; prefer reading the config or using `print-default`.

## obsidian-cli quick start

Pick a default vault (once):

- `obsidian-cli set-default "<vault-folder-name>"`
- `obsidian-cli print-default` / `obsidian-cli print-default --path-only`

Search

- `obsidian-cli search "query"` (note names)
- `obsidian-cli search-content "query"` (inside notes; shows snippets + lines)

Create

- `obsidian-cli create "Folder/New note" --content "..." --open`
- Requires Obsidian URI handler (`obsidian://…`) working (Obsidian installed).
- Avoid creating notes under "hidden" dot-folders (e.g. `.something/...`) via URI; Obsidian may refuse.

Move/rename (safe refactor)

- `obsidian-cli move "old/path/note" "new/path/note"`
- Updates `[[wikilinks]]` and common Markdown links across the vault (this is the main win vs `mv`).
- **Verify after moving:** run `obsidian-cli search "new/path/note"` to confirm the note exists at the new path, then spot-check a couple of backlinks with `obsidian-cli search-content "[[note-name]]"` to ensure they were updated correctly.

Delete

- `obsidian-cli delete "path/note"`

Prefer direct edits when appropriate: open the `.md` file and change it; Obsidian will pick it up.

## Troubleshooting

- **URI handler fails / create doesn't open Obsidian:** Obsidian must be installed and the URI scheme registered. Try launching Obsidian manually first, then retry. If the issue persists, create the note by writing the `.md` file directly instead.
- **`obsidian-cli` can't find vaults:** Confirm `~/Library/Application Support/obsidian/obsidian.json` exists and contains at least one vault entry. If you recently moved a vault folder, re-open it in Obsidian to refresh the registry, then re-run `obsidian-cli set-default`.
