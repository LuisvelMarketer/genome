---
name: discord
description: "Sends messages, manages channels, reacts to posts, creates threads, runs polls, searches server content, pins messages, and moderates users on Discord via the message tool. Use when the user asks about Discord messaging, Discord server management, Discord bot interactions, DMs, Discord notifications, Discord channel management, or any other Discord server action."
metadata: { "genoma": { "emoji": "🎮", "requires": { "config": ["channels.discord.token"] } } }
allowed-tools: "message"
---

# Discord (Via `message`)

Use the `message` tool. No provider-specific `discord` tool exposed to the agent.

## Musts

- Always: `channel: "discord"`.
- Respect gating: `channels.discord.actions.*` (some default off: `roles`, `moderation`, `presence`, `channels`).
- Prefer explicit ids: `guildId`, `channelId`, `messageId`, `userId`.
- Multi-account: optional `accountId`.

## Guidelines

- Avoid Markdown tables in outbound Discord messages.
- Mention users as `<@USER_ID>`.
- Prefer Discord components v2 (`components`) for rich UI; use legacy `embeds` only when you must.

## Targets

- Send-like actions: `to: "channel:<id>"` or `to: "user:<id>"`.
- Message-specific actions: `channelId: "<id>"` (or `to`) + `messageId: "<id>"`.

## Common Actions (Examples)

Send message:

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "hello",
  "silent": true
}
```

Send with media:

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "see attachment",
  "media": "file:///tmp/example.png"
}
```

- Optional `silent: true` to suppress Discord notifications.

Send with components v2 (recommended for rich UI):

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Status update",
  "components": "[Carbon v2 components]"
}
```

- `components` expects Carbon component instances (Container, TextDisplay, etc.) from JS/TS integrations.
- Do not combine `components` with `embeds` (Discord rejects v2 + embeds).

Legacy embeds (not recommended):

```json
{
  "action": "send",
  "channel": "discord",
  "to": "channel:123",
  "message": "Status update",
  "embeds": [{ "title": "Legacy", "description": "Embeds are legacy." }]
}
```

- `embeds` are ignored when components v2 are present.

React:

```json
{
  "action": "react",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "emoji": "✅"
}
```

Read:

```json
{
  "action": "read",
  "channel": "discord",
  "to": "channel:123",
  "limit": 20
}
```

Edit / delete:

```json
{
  "action": "edit",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "message": "fixed typo"
}
```

```json
{
  "action": "delete",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

**Validation workflow for destructive actions (edit/delete) — follow before executing:**
1. **Read** the channel to retrieve the message and confirm its content matches what you expect.
2. **Verify** the `messageId` in the response matches the intended target.
3. **Only then** proceed with the `edit` or `delete` action.

These actions are irreversible. If the `messageId` cannot be confirmed, stop and ask the user to provide it explicitly.

- Check gating permissions (`channels.discord.actions.moderation`) before any moderation action — it is off by default.

Poll:

```json
{
  "action": "poll",
  "channel": "discord",
  "to": "channel:123",
  "pollQuestion": "Lunch?",
  "pollOption": ["Pizza", "Sushi", "Salad"],
  "pollMulti": false,
  "pollDurationHours": 24
}
```

Pins:

```json
{
  "action": "pin",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456"
}
```

Threads:

```json
{
  "action": "thread-create",
  "channel": "discord",
  "channelId": "123",
  "messageId": "456",
  "threadName": "bug triage"
}
```

Search:

```json
{
  "action": "search",
  "channel": "discord",
  "guildId": "999",
  "query": "release notes",
  "channelIds": ["123", "456"],
  "limit": 10
}
```

Presence (often gated):

```json
{
  "action": "set-presence",
  "channel": "discord",
  "activityType": "playing",
  "activityName": "with fire",
  "status": "online"
}
```

## Writing Style (Discord)

- Short, conversational, low ceremony.
- No markdown tables.
- Mention users as `<@USER_ID>`.
