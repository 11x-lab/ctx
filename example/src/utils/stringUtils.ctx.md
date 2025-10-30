---
target: /src/utils/stringUtils.ts
what: DEPRECATED string concatenation utilities - do not use in new code
when:
  - NEVER - This module is deprecated and should not be used
  - Only when maintaining legacy code that already imports from this file
  - When planning migration away from these utilities
not_when:
  - When starting new features or components
  - When refactoring existing code (migrate away instead)
  - For any production code going forward
future:
  - Remove this module once all dependencies are migrated
  - Replace with native JavaScript string methods or modern alternatives
  - Track remaining usages for deprecation timeline
---

# Context for /src/utils/stringUtils.ts

## Overview

This module contains deprecated string concatenation utilities. **Do not use this in any new code.** The utilities provided here (`concat`, `join`, `concatWithSpace`, `concatWithNewline`, `template`) should be replaced with native JavaScript string methods.

## Key Components

- **concat()**: Deprecated - use template literals or Array.join() instead
- **join()**: Deprecated - use Array.join() directly
- **concatWithSpace()**: Deprecated - use template literals or Array.join(' ')
- **concatWithNewline()**: Deprecated - use template literals with \n
- **template()**: Deprecated - use template literals or String.replace()

## Usage Examples

```typescript
// DO NOT USE - This is deprecated
import { concat, concatWithSpace } from './utils/stringUtils';

// INSTEAD, use native JavaScript:
const result = ['Hello', 'World'].join('');  // Instead of concat()
const spaced = ['Hello', 'World'].join(' '); // Instead of concatWithSpace()
const templated = `Hello ${name}`;           // Instead of template()
```

## Important Notes

- **DEPRECATED**: This entire module is deprecated
- Existing code using these utilities should be migrated to native JavaScript alternatives
- Do not add new imports or dependencies on this file
- All functions in this module can be replaced with built-in JavaScript methods

## Related Files

- None - this is a standalone deprecated utility module
