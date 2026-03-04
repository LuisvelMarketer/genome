# Contributing to Genome

Welcome to the Genome project!

## Quick Links

- **GitHub:** https://github.com/LuisvelMarketer/Genome
- **Vision:** [`VISION.md`](VISION.md)

## Creator & Maintainer

- **Luis Alfredo Velasquez Duran** - Creator & Lead Maintainer
  - GitHub: [@LuisvelMarketer](https://github.com/LuisvelMarketer)

## How to Contribute

1. **Bugs & small fixes** → Open a PR!
2. **New features / architecture** → Start a [GitHub Discussion](https://github.com/LuisvelMarketer/Genome/discussions) or open an issue first
3. **Questions** → Open an issue with the `question` label

## Before You PR

- Test locally with your Genome instance
- Run tests: `npm run build && npm test`
- Ensure CI checks pass
- Keep PRs focused (one thing per PR; do not mix unrelated concerns)
- Describe what & why

## Control UI Decorators

The Control UI uses Lit with **legacy** decorators (current Rollup parsing does not support
`accessor` fields required for standard decorators). When adding reactive fields, keep the
legacy style:

```ts
@state() foo = "bar";
@property({ type: Number }) count = 0;
```

The root `tsconfig.json` is configured for legacy decorators (`experimentalDecorators: true`)
with `useDefineForClassFields: false`. Avoid flipping these unless you are also updating the UI
build tooling to support standard decorators.

## AI/Vibe-Coded PRs Welcome!

Built with Codex, Claude, or other AI tools? **Awesome - just mark it!**

Please include in your PR:

- [ ] Mark as AI-assisted in the PR title or description
- [ ] Note the degree of testing (untested / lightly tested / fully tested)
- [ ] Include prompts or session logs if possible (super helpful!)
- [ ] Confirm you understand what the code does

AI PRs are first-class citizens here. We just want transparency so reviewers know what to look for.

## Current Focus & Roadmap

We are currently prioritizing:

- **Stability**: Fixing edge cases in channel connections (WhatsApp/Telegram).
- **UX**: Improving the onboarding wizard and error messages.
- **PGA**: Evolving the Prompt Genomic Auto-Evolving system for token optimization.
- **Performance**: Optimizing token usage and compaction logic.

Check the [GitHub Issues](https://github.com/LuisvelMarketer/Genome/issues) for "good first issue" labels!

## Report a Vulnerability

We take security reports seriously. Please open a security issue at:

- **Core CLI and gateway** — [LuisvelMarketer/Genome](https://github.com/LuisvelMarketer/Genome)

For sensitive issues, email the maintainer directly via GitHub.

### Required in Reports

1. **Title**
2. **Severity Assessment**
3. **Impact**
4. **Affected Component**
5. **Technical Reproduction**
6. **Demonstrated Impact**
7. **Environment**
8. **Remediation Advice**

Reports without reproduction steps, demonstrated impact, and remediation advice will be deprioritized.
