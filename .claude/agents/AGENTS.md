# React Agent Team — Workflow Guide

## Agents

| Agent | Model | Role | When to Invoke |
|---|---|---|---|
| `ux-designer` | Sonnet | Wireframes, component specs, design tokens | Start of every new feature |
| `react-architect` | Sonnet | Project structure, tech stack, patterns | Project setup + major structural changes |
| `component-engineer` | Sonnet | React components, JSX, Tailwind, hooks | All UI implementation |
| `state-data-engineer` | Sonnet | API integration, TanStack Query, Zustand | Any data fetching or shared state |
| `test-engineer` | Sonnet | Vitest, RTL, Playwright | After implementation, before merge |
| `code-reviewer` | Sonnet | PR reviews, quality + security checks | Before merging any feature |
| `performance-engineer` | Sonnet | Bundle size, Core Web Vitals, render perf | Before major releases |
| `devops-engineer` | Sonnet | CI/CD, Docker, deployment, monitoring | Deploy setup + infrastructure changes |

---

## Full Feature Workflow

Paste this into Claude Code for a new feature:

```
We're building Maps, QR Scanning & Real-time Inventory: Interactive indoor map. QR code entry. Live inventory updates..

Run this workflow in sequence:

1. Use the ux-designer agent to produce wireframes, component hierarchy, 
   and component specs for this feature.

2. Use the state-data-engineer agent to design the API integration and 
   data hooks, reading the ux-designer's output first.

3. Use the component-engineer agent to implement all components, reading 
   the ux-designer specs and state-data-engineer hooks.

4. Use the test-engineer agent to write unit, integration, and E2E tests 
   for everything that was built.

5. Use the code-reviewer agent to review all changed files and produce 
   a structured findings report.
```

---

## Parallel Research Workflow

For competitive analysis or multi-part research before building:

```
Use 3 parallel sub-agents to research before we start building [FEATURE]:
- Agent 1: Research best practices and patterns for [feature type]
- Agent 2: Research potential security concerns for [feature type]
- Agent 3: Research React libraries that could help with [feature type]
Synthesize findings into research-brief.md
```

---

## Pre-Release Workflow

Run before any production deployment:

```
Run the pre-release checklist:

1. Use the code-reviewer agent to audit all files changed since last release 
   for MUST FIX and SHOULD FIX issues.

2. Use the performance-engineer agent to audit bundle size and Core Web Vitals 
   targets — flag anything below Good thresholds.

3. Use the devops-engineer agent to verify CI/CD config, environment variables, 
   and monitoring setup is correct for production.

Produce a release-readiness-report.md with a GO / NO-GO recommendation.
```

---

## Project Setup Workflow

For a brand new React project:

```
Set up a new React project for [APP NAME]: [brief description].

1. Use the react-architect agent to define the full tech stack, folder structure, 
   ARCHITECTURE.md, and all base config files (tsconfig, vite.config, tailwind, eslint).

2. Use the devops-engineer agent to set up Docker, GitHub Actions CI/CD pipeline, 
   and Vercel deployment config.

3. Use the ux-designer agent to define the global design system (tokens, typography, 
   color palette, spacing) and output design-tokens.md.
```
