# CTX Example Project

This is a test project for developing and testing `@11x-lab/ctx` library.

## Setup

```bash
pnpm install
```

## Usage

```bash
# Initialize ctx in this project
npx ctx init

# Sync context files
npx ctx sync

# Create new context
npx ctx create
```

## Development Workflow

When making changes to the parent ctx library:

1. Make changes in `../src`
2. Build: `cd .. && pnpm build`
3. Test here: `npx ctx [command]`
