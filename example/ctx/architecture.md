---
when:
  - When starting new development work in the src package
  - When adding new utilities or modules to the project
  - When understanding the overall project structure and organization
  - When onboarding new developers to the codebase

what: |
  Overview of the src package architecture, including directory structure,
  module organization, and design principles for the project.

not_when:
  - When looking for specific API documentation (check local context files instead)
  - When debugging specific functions (use local context for individual modules) 
---

# src Package Architecture

## Overview

The `src` package is the main source code directory for this project, organized as a modular TypeScript package with clear separation of concerns.

## Directory Structure

```
src/
├── index.ts          # Main entry point - exports all public APIs
└── utils/            # Utility modules
    ├── index.ts      # Utils package exports
    └── stringUtils.ts # String manipulation utilities (DEPRECATED)
```

## Module Organization

### Entry Point (`src/index.ts`)

The main entry point that re-exports all public APIs from subdirectories. This provides a clean, single import point for consumers:

```typescript
import { concat, join } from './src';
```

### Utils Package (`src/utils/`)

Collection of utility functions organized by functionality:

- **stringUtils.ts**: String manipulation utilities (currently deprecated)
- Each utility module should have its own context file (`*.ctx.md`)

## Design Principles

1. **Modular Structure**: Each subdirectory represents a logical grouping of related functionality
2. **Clear Exports**: Use index.ts files to manage public API surface
3. **Context Documentation**: All modules should have local context files documenting usage and deprecation status
4. **TypeScript First**: All code written in TypeScript with proper type definitions

## Adding New Modules

When adding new modules to the src package:

1. Create the module file in the appropriate subdirectory (or create a new subdirectory)
2. Export from the subdirectory's `index.ts`
3. Re-export from the main `src/index.ts` if it's part of the public API
4. Create a local context file (`*.ctx.md`) documenting when/how to use it
5. Run `ctx sync --local` to update the registry

## Deprecation Process

When deprecating modules:

1. Update the module's context file with deprecation notice
2. Document alternative approaches in the context file
3. Mark the module with `DEPRECATED` in comments
4. Keep the module until all consumers migrate
5. Track migration progress in the context file's `future` section

## Related Documentation

- Local context files: `src/**/*.ctx.md` - Module-specific documentation
- Global contexts: `ctx/*.md` - Project-wide guidelines and processes
