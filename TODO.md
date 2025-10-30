# TODO

## Roadmap

### Inline Context Feature

**Status**: Planned

**Description**: Support inline context annotations within source code files (similar to JSDoc/TSDoc style).

**Current State**:
- Local contexts are file-based only (`*.ctx.md` or `ctx.md`)
- All contexts require separate files

**Proposed Implementation**:
- Add support for extracting context from special comment blocks in source files
- Allow developers to document context directly in code
- Sync inline contexts to registry alongside file-based contexts

**Benefits**:
- Reduce context/code proximity gap
- Easier to maintain context alongside implementation
- No need for separate context files for simple modules

**Example Use Cases**:
```typescript
/**
 * @ctx-what Validates user input for forms and APIs
 * @ctx-when
 *   - Processing user form submissions
 *   - Validating API request payloads
 * @ctx-not-when
 *   - Server-side data validation (use schema validators)
 */
export function validateInput(input: unknown): boolean {
  // implementation
}
```

**Tasks**:
- [ ] Design inline context syntax (JSDoc-style vs custom markers)
- [ ] Update scanner to detect inline context blocks
- [ ] Add parser support for extracting inline context
- [ ] Update `LocalContextEntry` type to support `type: 'inline'`
- [ ] Update sync command to process inline contexts
- [ ] Add validation for inline context format
- [ ] Update templates/documentation
- [ ] Write tests for inline context parsing
- [ ] Consider editor extensions/LSP support

**Related Files**:
- src/lib/types.ts (add `type: 'inline'` to LocalContextEntry)
- src/lib/scanner.ts (detect inline annotations)
- src/lib/parser.ts (parse inline context syntax)
- src/commands/sync.ts (process inline contexts)
