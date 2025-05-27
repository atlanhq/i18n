# Contributing to @ atlanhq/i18n

First off, thank you for considering contributing to @ atlanhq/i18n! It's people like you that make it a great tool for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Exercise consideration and empathy in your speech and actions
- Focus on what is best for the community

## How Can I Contribute?

### Improving Translations

1. **Review Existing Translations**
   - Check for accuracy and cultural appropriateness
   - Ensure consistency in terminology
   - Fix grammatical errors or awkward phrasing

2. **Add New Languages**
   - Create a new directory under `src/locales/` with the language code
   - Copy the structure from an existing language directory
   - Translate all strings
   - Update the README.md to include the new language

### Quick Translation Updates (GitHub Web Editor)

To update translations, simply:

1. **Find the translation file** you want to edit in the GitHub repository
   - Navigate to `src/locales/[language-code]/` (e.g., `src/locales/en/` for English)

2. **Click the pencil icon** (✏️) on any translation file
   - This opens GitHub's web editor directly in your browser

3. **Make your changes** in the web editor
   - Edit the translation text as needed
   - Use the preview tab to check your formatting

4. **Add a commit message** describing your changes
   - Example: "fix: correct German translation for login button"
   - Keep it clear and concise

5. **Click 'Propose changes'** - GitHub handles the rest!
   - This automatically creates a pull request
   - No need to fork or set up anything locally

This method is perfect for quick fixes, typos, or small translation improvements!

### Development Process

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/i18n.git
   cd i18n
   npm install
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm run build
   npm test
   npm run lint
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```
   Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `chore:` for maintenance tasks

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Submit a Pull Request**
   - Fill in the pull request template
   - Link any relevant issues
   - Provide a clear description of your changes

### Translation Guidelines

1. **Maintain Context**
   - Understand the context where the string is used
   - Consider cultural differences and localization needs

2. **Keep Formatting**
   - Preserve any placeholders (e.g., `{userName}`)
   - Maintain HTML tags if present
   - Keep special characters and punctuation as needed

3. **Be Consistent**
   - Use consistent terminology throughout translations
   - Follow the same style and tone as existing translations
   - Use appropriate formality level for the target language

4. **Testing Translations**
   - Run the translation script to validate format
   - Test the translations in context if possible
   - Check for any missing or untranslated strings

### Pull Request Review Process

1. **Initial Check**
   - Automated tests pass
   - Code style follows project guidelines
   - Documentation is updated
   - Commits follow conventional commit format

2. **Review Criteria**
   - Code quality and maintainability
   - Test coverage
   - Documentation clarity
   - Translation accuracy (for language contributions)

3. **After Review**
   - Address any feedback from reviewers
   - Update your branch with the latest main if needed
   - Squash commits if requested

## Need Help?

- Check existing issues and pull requests
- Open a new issue for questions or problems
- Tag maintainers for urgent matters

Thank you for contributing to @ atlanhq/i18n! 