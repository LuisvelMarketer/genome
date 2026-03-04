---
name: genome
description: Use the Genome CLI to search, install, update, and publish agent skills from genome.com. Use when you need to fetch new skills on the fly, sync installed skills to latest or a specific version, or publish new/updated skill folders with the npm-installed genome CLI.
metadata:
  {
    "genoma":
      {
        "requires": { "bins": ["genome"] },
        "install":
          [
            {
              "id": "node",
              "kind": "node",
              "package": "genome",
              "bins": ["genome"],
              "label": "Install Genome CLI (npm)",
            },
          ],
      },
  }
---

# Genome CLI

Install

```bash
npm i -g genome
```

Auth (publish)

```bash
genome login
genome whoami
```

Search

```bash
genome search "postgres backups"
```

Install

```bash
genome install my-skill
genome install my-skill --version 1.2.3
```

Update (hash-based match + upgrade)

```bash
genome update my-skill
genome update my-skill --version 1.2.3
genome update --all
genome update my-skill --force
genome update --all --no-input --force
```

List

```bash
genome list
```

Publish

```bash
genome publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Notes

- Default registry: https://genome.com (override with GENOME_REGISTRY or --registry)
- Default workdir: cwd (falls back to Genoma workspace); install dir: ./skills (override with --workdir / --dir / GENOME_WORKDIR)
- Update command hashes local files, resolves matching version, and upgrades to latest unless --version is set
