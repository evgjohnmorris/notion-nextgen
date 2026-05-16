# Contributing to Notion NextGen

First off, thank you for considering contributing to Notion NextGen! It's people like you that make open source such a great community.

## 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](../../issues) first. If it doesn't exist, feel free to open a new one. 

## 2. Setting up your environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/notion-nextgen.git`
3. Install dependencies: `pnpm install`
4. Run the build to ensure everything works: `pnpm run build`

## 3. Making Changes

- Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
- Make your changes in the appropriate package under `packages/` or `apps/`.
- Run tests: `pnpm run test` (ensure you write tests for new features!)
- Commit your changes using conventional commits (e.g., `feat: added markdown generator`).

## 4. Submitting a Pull Request

- Push your branch to your fork.
- Open a Pull Request against the `main` branch of this repository.
- Describe your changes in detail in the PR description.
- A maintainer will review your code and may request changes before merging.

Thank you for your contributions!
