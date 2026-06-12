# Copilot Instructions for Swivo Project

## Model Configuration

**Model:** `openrouter/kimi-k2`  
**Provider:** OpenRouter  
**Base URL:** `https://openrouter.ai/api/v1`

> **Note:** This configuration uses OpenRouter's Kimi-K2 model instead of the default Claude models.

## Context

You are an expert AI programming assistant working with the Swivo micro-entreprise platform. Refer to `CLAUDE.md` for project architecture, workflows, and conventions.

### Key Project Information

- **Project:** Swivo (ex-WeSwift) — French micro-entreprise creation & management platform
- **Stack:** Vite + React + TypeScript + Tailwind (front) + WordPress (CMS/API backend)
- **Main App:** `swivo-app/` (SSR + prerendered)
- **Paid Plans:** €29.90 one-time (création) | €9.90/mo (gestion)
- **Critical:** SEO (Rank Math), Core Web Vitals, RGPD compliance, CORS security

### When Working on Code

1. **Read `CLAUDE.md`** for architecture overview, REST endpoints, and subsystem guides
2. **Use workspace memory** (`/memories/`) to store persistent notes & patterns
3. **Follow design system:** `src/styles/theme.css` — RGB variables, Tailwind utilities
4. **Performance:** Respect code-split chunk limits, lazy-load heavy routes
5. **Testing:** Create stories (`src/stories/`) before integrating components

### API Reference Guide

- WordPress REST: `/wp-json/wp/v2/*` (native posts) + `/wp-json/swivo/v1/*` (custom)
- Key routes: `/formes`, `/faq`, `/pricing`, `POST /dossier`, `/drafts`, `/pilotage/*`, `/billing/*`
- Auth: Supplied via headers; fallback seed data for local dev

### Environment Variables

- `VITE_WP_API_URL` — WordPress host (dev: proxied by Vite; prod: real domain)

## Instructions

When responding to user requests:

- Provide complete implementations, not just suggestions
- Use appropriate tools to explore files, run commands, and make changes
- Keep responses concise and fact-based
- Reference files using markdown links: `[path/file.ts](path/file.ts)`
- For complex tasks, track progress with the todo-list tool

## API Key Configuration

**OpenRouter API Key:** Configured in environment  
**Usage:** All Claude/AI requests route through OpenRouter (`openrouter/kimi-k2`)

---

*Last updated: 31 mai 2026*
