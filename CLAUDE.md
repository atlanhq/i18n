# CLAUDE.md — Atlan AI Agent Guidelines

> **Applies To:** `i18n`
> **Full security policy:** See `AGENTS.md`

---

## Security

`i18n` contains Atlan product internationalisation translation strings. Key surface: translation strings rendered in the UI must not introduce XSS vectors.

### Security Contact
Security questions → `#bu-security-and-it` on Slack.

### XSS via Translation Strings
- **[MUST]** Translation strings must not contain raw HTML that renders unsanitised. Strings with `<script>`, event handlers, or `javascript:` URIs must be blocked in CI.
- **[MUST]** No API keys, user data, or environment-specific values in translation files.
