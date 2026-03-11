# @atlanhq/i18n

This package contains internationalization resources for Atlan frontend applications.

## Installation

```bash
npm install @atlanhq/i18n
```

## Usage

```typescript
import i18n, { en, es, fr, jp, pt, de } from '@atlanhq/i18n';

// Use individual locales
console.log(en.some_key);

// Or use the default export with locale keys
console.log(i18n['en'].some_key);
```

## Available Locales

- English - `en`
- Spanish - `es`
- French - `fr`
- Japanese - `jp`
- Portuguese - `pt`
- German - `de`

## Repository Structure

```
.
├── src/              # Source code
│   ├── index.ts      # Main entry point and Vue i18n setup
│   └── locales/      # Locale files
│       └── default/  # Default locale directory
│           ├── en.json   # English translations
│           ├── es.json   # Spanish translations
│           ├── fr.json   # French translations
│           ├── jp.json   # Japanese translations
│           ├── pt.json   # Portuguese translations
│           └── de.json   # German translations
├── scripts/          # Utility scripts
│   └── translationScript.mjs  # Translation automation script
├── .github/          # GitHub configurations
│   └── workflows/    # CI/CD workflows
└── CONTRIBUTING.md   # Contribution guidelines
```

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Scripts

- `npm run build` - Build the package
- `npm test` - Run tests
- `npm run lint` - Run linting
- `npm run translate` - Run translation script

### Adding/Updating Translations

#### Quick Updates (No Setup Required)
For simple translation fixes, you can contribute directly through GitHub:

1. Navigate to the translation file in `src/locales/default/[language-code].json`
2. Click the pencil icon (✏️) to edit
3. Make your changes in GitHub's web editor
4. Add a commit message describing your changes
5. Click 'Propose changes' - GitHub handles the rest!

#### Local Development
For more complex changes:

1. Update the translation files in `src/locales/default/<locale>.json`
2. Run the translation script:
   ```bash
   npm run translate
   ```

### Quick Translation Updates
You can contribute translations directly through GitHub's web interface - no local setup required! See the [Quick Updates](#quick-updates-no-setup-required) section above.

### Ways to Contribute

1. **Improve Translations**: Help us improve existing translations or add new languages
2. **Report Issues**: Report bugs or suggest improvements through GitHub issues
3. **Submit PRs**: Submit pull requests for bug fixes or improvements

Please see our [Contributing Guidelines](CONTRIBUTING.md) for detailed information about:
- Quick translation updates via GitHub web editor
- Setting up your development environment
- Our coding standards
- The pull request process
- Translation guidelines

## 🔄 Workflow

This repository is designed to:
- Store and manage translations for multiple projects
- Provide automated scripts for translation key management
- Enable automated workflows for translation updates
- Support community contributions for translation improvements

## 🤝 Contributing

We welcome contributions from our community! If you'd like to suggest improvements to translations:

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes in the appropriate locale files
4. Submit a Pull Request with a clear description of the changes

Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) for more details.

## License

MIT

--- 