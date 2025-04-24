# @ atlanhq/i18n

This package contains internationalization resources for Atlan frontend applications.

## Installation

```bash
npm install @ atlanhq/i18n
```

## Usage

```typescript
import i18n, { en, fr, jp, pt } from '@ atlanhq/i18n';

// Use individual locales
console.log(en.some_key);

// Or use the default export with locale keys
console.log(i18n['en'].some_key);
```

## Available Locales

- English - `en`
- French - `fr`
- Japanese - `jp`
- Portuguese - `pt`

## Repository Structure

```
.
├── src/              # Source code
│   ├── index.ts      # Main entry point
│   └── locales/      # Locale directories
│       ├── en/       # English translations
│       ├── fr/       # French translations
│       ├── jp/       # Japanese translations
│       └── pt/       # Portuguese translations
├── scripts/          # Utility scripts
│   └── translationScript.mjs  # Translation automation script
└── .github/          # GitHub configurations
    └── workflows/    # CI/CD workflows
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

1. Update the translation files in `src/locales/<locale>/`
2. Run the translation script:
   ```bash
   npm run translate
   ```

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, improving translations, or proposing new features, your contributions are welcome.

### Ways to Contribute

1. **Improve Translations**: Help us improve existing translations or add new languages
2. **Report Issues**: Report bugs or suggest improvements through GitHub issues
3. **Submit PRs**: Submit pull requests for bug fixes or improvements

Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details on:
- Setting up your development environment
- Our coding standards
- The pull request process
- Translation guidelines

## Publishing

This package uses semantic versioning. To publish a new version:

1. Update version in `package.json`
2. Create and push a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. The GitHub Action will automatically publish to NPM

## License

MIT

## 📁 Repository Structure

```
.
├── locales/           # Directory containing all locale files
│   ├── en/           # English (source) translations
│   ├── es/           # Spanish translations
│   ├── fr/           # French translations
│   └── ...           # Other language directories
├── scripts/          # Utility scripts for translation management
├── config/           # Configuration files
└── docs/            # Additional documentation
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies (if any)
3. Follow the setup instructions in the documentation

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

## 📜 License

[Add appropriate license information]

## 🔗 Related Resources

- [Link to documentation]
- [Link to related tools]
- [Other relevant links]

## ⚙️ Configuration

Configuration details and setup instructions can be found in the [documentation](./docs/CONFIGURATION.md).

## 🛠️ Scripts

Details about available scripts and their usage can be found in the [scripts documentation](./docs/SCRIPTS.md).

## 📞 Support

[Add support information]

--- 