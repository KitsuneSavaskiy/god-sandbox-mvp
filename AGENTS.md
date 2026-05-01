# AGENTS.md

## Purpose

- This repository is for the `god-sandbox-mvp` MVP only.
- Keep changes small, reversible, and inside the active PBI scope.

## Read First

- Fixed operating rules, the lane boundary table, the PBI delta template, and the Current State Memo template live in `docs/agent-operating-rules.md`.
- PR preflight and audit checklists live in `docs/agent-pr-checklists.md`.

## Non-Negotiables

- Never push directly to `main`.
- If the PBI requires it, follow `Issue -> branch -> PR`.
- Stay inside the current checkout and the declared file scope. Stop and ask before touching scope-external files, external services, or paid workflows.
- Agents do not approve or merge on their own by default.
- The PR author must not approve their own PR.
- Do not act as both implementer and auditor on the same PR.
- Only a PO-authorized auditor may approve or merge, and only when blockers are cleared, CI is green, and the changed-file scope is confirmed.
- Use `manual-review-required` for policy, workflow, permission, secret, billing, dependency, or protected-path changes.
- Do not write personal paths, secrets, API keys, tokens, local environment names, or account-specific settings in `AGENTS.md`, `CLAUDE.md`, or committed docs.

## Lane Split

- Implementation lanes edit only the files assigned to the active PBI.
- The audit lane checks scope, blockers, CI, and merge readiness.
- Keep this file short and move reusable detail into the docs above.
