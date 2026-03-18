# AGENTS.md — Atlan AI Agent Guidelines

> **Applies To:** `i18n`
> **Companion file:** See `CLAUDE.md` for the lean summary.

---

## Security

`i18n` contains internationalisation translation strings for Atlan products.

### Security Contact
`#bu-security-and-it` on Slack.

---

### XSS via Translation Strings

```javascript
// ❌ Translation string rendered as HTML
element.innerHTML = t('welcome.message');

// ✅ Render as text node
element.textContent = t('welcome.message');
// Or sanitise if HTML formatting needed:
element.innerHTML = DOMPurify.sanitize(t('welcome.message'));
```

**[MUST]** Add a CI lint step scanning translation files for `<script>`, `javascript:`, and event handler patterns.

---

### General Invariants

- **[MUST]** No API keys or credentials in translation files.
- **[MUST]** HTML in translations sanitised via DOMPurify before innerHTML render.
- **[SHOULD]** CI validation blocking malicious HTML patterns in translation strings.
