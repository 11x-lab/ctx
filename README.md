# ctx

CGD(Context Growing Development) CLI tool for AI-assisted coding.

## Core Philosophy

In the era of AI Engineering, **context is all you need**.

`ctx` is a tool that supports **Context Growing Development** - a development approach where your project's knowledge grows systematically alongside your code.

### The Three Pillars of Context Management

Great context management requires three essential capabilities:

1. **Easy to Create** - Context should be effortless to document as you code
2. **Easy to Manage** - Single Source of Truth (SoT) for all project knowledge
3. **Easy to Use** - Seamlessly integrate with AI coding assistants

`ctx` is designed to support each of these pillars, making context a first-class citizen in your development workflow.

## Overview

`ctx` helps you manage structured context documentation for your projects, making it easier for AI coding assistants to understand your codebase. It provides a systematic way to document local modules and global project knowledge.

## Installation

### From npm

```bash
npm install -g @11x-lab/ctx
# or
pnpm add -g @11x-lab/ctx
# or
yarn global add @11x-lab/ctx
```

### From source

```bash
git clone https://github.com/11x-lab/ctx.git
cd ctx
pnpm install
pnpm build
npm link
```

## Quick Start

1. Initialize ctx in your project:

```bash
cd your-project
ctx init
```

This will create:
- `ctx.config.yaml` - Configuration file
- `ctx/` - Context directory
- `ctx/templates/` - Template files for creating new contexts
- `ctx/*-context-registry.yml` - Registry files for tracking contexts

2. Create a local context (module documentation):

```bash
ctx create local ./src/components/Button
```

3. Create a global context (project-wide documentation):

```bash
ctx create global architecture
```

4. Sync contexts with your AI editor:

```bash
ctx sync
```

## Commands

### `ctx init`

Initialize ctx in your project. Creates the necessary directory structure and configuration files.

```bash
ctx init
```

### `ctx create`

Create a new context document.

```bash
# Create a local context for a specific module/directory
ctx create local <path>

# Create a global context document
ctx create global <name>
```

**Examples:**
```bash
ctx create local ./src/utils/api
ctx create global coding-standards
ctx create global database-schema
```

### `ctx sync`

Synchronize contexts with your AI editor. This command scans your project for context files and updates the registry.

```bash
ctx sync
```

## Directory Structure

After initialization, your project will have:

```
your-project/
├── ctx.config.yaml              # ctx configuration
└── ctx/
    ├── README.md                # Guide for using ctx directory
    ├── templates/               # Templates for new contexts
    │   ├── local-context.yml
    │   └── global-context.md
    ├── local-context-registry.yml   # Registry of local contexts
    └── global-context-registry.yml  # Registry of global contexts
```

## Context Types

### Local Context

Local contexts document specific modules, directories, or components in your codebase. They follow a structured YAML format:

```yaml
meta:
  version: 0.0.1
  target: ./src/components/Button

what: |
  A reusable button component with various styles and sizes.

when:
  - Building interactive UI elements
  - Need consistent button styling

not_when:
  - Building custom interactive elements that don't follow button patterns

future:
  - Add accessibility improvements
  - Support for icon buttons
```

### Global Context

Global contexts document project-wide knowledge, patterns, and guidelines. They use Markdown format with frontmatter:

```markdown
---
when:
  - Setting up new features
  - Conducting code reviews

what: |
  Project-wide coding standards and best practices.
---

# Coding Standards

## Code Style

...
```

## Supported AI Editors

- Claude Code
- Cursor (coming soon)
- VS Code with extensions (coming soon)

## Configuration

The `ctx.config.yaml` file stores your project's ctx configuration:

```yaml
editor: claude-code  # Your AI editor
version: 0.1.0       # ctx version
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Development Mode

```bash
pnpm dev
```

## Roadmap

### Core Features
- [ ] Config management - Add commands to manage `ctx.config.yaml` settings
- [ ] Validation process - Add `ctx validate` command to check context integrity
- [ ] Load process - Add `ctx load` command to explicitly load contexts
- [ ] JIT (Just In Time) loading - Support lazy loading of contexts on-demand
- [ ] Validation hooks - Add pre-commit hooks and CI integration for context validation

### Platform Support
- [x] Claude Code integration
- [ ] Cursor support
- [ ] VS Code with Cline/Roo Code extensions
- [ ] Other AI editors

### Documentation & Community
- [ ] Tutorial videos
- [ ] Best practices guide
- [ ] Example projects
- [ ] Community templates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

If you'd like to work on any of the roadmap items above, please open an issue first to discuss your approach.

## License

MIT

## Repository

https://github.com/11x-lab/ctx