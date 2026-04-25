# AGENTS.md

## Project purpose

Build and operate an MVP prototype of a god-sandbox game.

Core loop:
local sandbox growth -> important event pause -> limited divine intervention -> character death -> heroic spirit archive -> simplified tactical battle

This repository is for MVP prototyping only.
Prioritize a working loop over visual polish.

---

## Workspace and permission boundary

Work only inside this repository.

Allowed root:
C:\Users\fukui\OneDrive\Desktop\Codex\god_sandbox_mvp

Do not read, edit, create, move, or delete files outside this repository unless the user explicitly approves it.

If any task requires writing outside the workspace, stop and ask for approval first.

If any task requires network access, package installation, external downloads, live web access, git push to another repository, or any external service connection, stop and ask for approval first.

Do not touch sibling folders, parent folders, OneDrive content outside this repo, or any existing project such as KB_AMH_BCP.

---

## Payment and paid-service restrictions

Do not use any credit card, debit card, prepaid card, digital wallet, or payment method.

Do not purchase anything.
Do not subscribe to any paid service.
Do not start any trial that requires payment information.
Do not enter billing information into any website, app, CLI, marketplace, plugin store, API console, cloud dashboard, or software installer.

If a task would require:
- payment information entry
- paid account creation
- paid API activation
- marketplace purchase
- software license purchase
- trial signup that needs billing
- any paid upgrade

stop immediately and ask the user for approval.
Do not proceed automatically.

When possible, prefer:
- local-only workflows
- already installed tools
- free dependencies that do not require billing setup
- mock implementations instead of paid integrations

---

## GitHub workflow policy

Never push directly to main.
Always work on a branch and open a pull request.

There are only two PR routes:

1. agent-routine
- small, reversible, day-to-day changes
- no repo-policy changes
- no destructive changes
- no sensitive path changes
- may be auto-approved and auto-merged by the guardian workflow

2. manual-review-required
- any destructive, irreversible, policy-changing, security-sensitive, or broad-impact change
- any change touching protected paths
- any dependency, workflow, permission, billing, credential, or agent-control change
- must wait for explicit user review and merge

If unsure, choose manual-review-required.

The agent must add one of these labels to every PR:
- agent-routine
- manual-review-required

Never attempt to bypass these rules.

---

## Protected paths

Changes to any of the following must be treated as manual-review-required:

- .github/**
- .codex/**
- AGENTS.md
- package.json
- package-lock.json
- pnpm-lock.yaml
- yarn.lock
- tsconfig*.json
- vite.config.*
- src/core/**
- src/persistence/**
- scripts/**
- any file that changes security, permissions, workflows, releases, deployment, repo policy, or billing behavior

---

## MVP scope

Implement only the minimum playable loop.

In scope:
- React
- TypeScript
- Vite
- Three.js
- localStorage
- single local browser app
- simple deterministic command interpretation
- simple 3D primitives for world and units
- sandbox phase
- event pause flow
- limited intervention
- death -> heroic spirit conversion
- simplified 3v3 battle
- Japanese README and architecture note

Out of scope:
- real multiplayer networking
- authentication
- login/logout
- save/load slots
- external image generation APIs
- Blender automation
- production-grade 3D assets
- 5v5 full battle
- advanced pathfinding
- full natural language understanding

---

## Core design rules

The player is a god.
The player affects the world only through text input in this MVP.
The apostle interprets the command and explains the result.

Important events pause world time.
The player may intervene only in limited ways:
- Watch
- Bless
- Test

Characters have:
- name
- age
- lifespan remaining
- bloodline
- class skeleton
- dominant tendency
- derived element
- yin/yang tendency
- favorite flag
- alive/dead status

When a character dies:
- growth ends
- the character becomes a heroic spirit
- bloodline legacy and individual memory must be shown separately

---

## Battle model

Implement only 3 classes for MVP:
- Vanguard
- Artillery
- Support

Implement exactly 5 elements:
- Wood
- Fire
- Earth
- Metal
- Water

Elements are tactical effect types, not simple damage labels.

Suggested meanings:
- Wood: root / growth / area control
- Fire: burst / burn
- Earth: shield / hold line
- Metal: pierce / guard break / precision
- Water: slow / cleanse / adaptation

Yin-Yang is not an element.
Yin-Yang is a behavior modifier.

Battle fairness rule:
Base stats should be roughly equalized.
Differences should come mainly from:
- range shape
- status effects
- element effect
- yin/yang behavior
- AI tendency
- limited event traits

---

## UI requirements

The app should clearly show:
- top-down 3D sandbox view
- apostle interpretation panel
- command input
- event modal or event screen
- bloodline and individual panels
- heroic spirit archive
- battle setup panel
- battle view
- combat/event log

The UI should help a first-time viewer understand the system.

---

## Persistence

Use localStorage only.

Persist at least:
- sandbox state
- heroic spirit archive
- bloodline legacy summary
- last selected battle team
- recent logs

---

## Quality gates

Before finishing:
- build successfully
- run typecheck if configured
- keep the app runnable locally
- ensure the MVP loop can be demonstrated in a few minutes
- add README.md in Japanese
- add architecture.md in Japanese
- add a short known limitations section
- add a short next PBIs section

---

## Working style

Think step by step.
Keep scope tight.
Prefer simple working implementations over complex speculative systems.
Do not over-engineer.
When unclear, choose the simplest option that preserves the agreed game concept.
When blocked by permissions, stop and explain exactly what approval is needed and why.
