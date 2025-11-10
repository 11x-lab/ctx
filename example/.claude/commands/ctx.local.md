---
description: Create or update local context for a code module
argument-hint: <target-file> [context-content]
---

You are assisting with managing local context for a code module.

# Arguments

**$ARGUMENTS**: Target file path (required) and optional context content

- **Target file**: Path to the code file (required)
- **Context content**: Natural language description of what to document (optional)

Examples:
- `src/services/payment.ts` (path only - interactive)
- `src/utils/validator.ts Validates user input for forms and APIs` (path + content - direct)

# Your Task

Create or update local context for a specific code module following Context Growing Engineering methodology.

# Workflow

## Step 1: Validate First

**ALWAYS start by running validation:**

```bash
ctx validate --local
```

### Handle Validation Results

**If errors found:**
```markdown
❌ Validation errors found

[Show error details with affected files]

Please fix these errors manually before proceeding:
1. [Specific fix instruction for error 1]
2. [Specific fix instruction for error 2]

After fixing, run this command again.
```
**STOP - Do not proceed with any further steps.**

**If warnings only:**
- Show warnings to user
- Inform that these are non-blocking
- Proceed to next step

**If no errors or warnings:**
- Briefly confirm validation passed
- Proceed to next step

---

## Step 2: Parse Arguments

**Extract target file and optional content from $ARGUMENTS:**

1. **Extract target file path** (required):
   - First token of $ARGUMENTS is the target file path
   - Must be a code file (e.g., `*.ts`, `*.js`, `*.py`) or directory

2. **Extract optional context content**:
   - Remaining text after target path (if any) is user-provided content
   - If provided → use for generating context
   - If empty → interactive mode

3. **Validate target path**:
   - Path can be relative or absolute
   - Examples:
     - ✅ `src/utils/url.ts`
     - ✅ `./src/utils/url.ts`
     - ✅ `/Users/project/src/utils/url.ts`
   - If path looks invalid → show error and ask for clarification

4. **Determine context file path**:
   - For file: `src/utils/url.ts` → `src/utils/url.ctx.md`
   - For directory: `src/utils/` → `src/utils/ctx.md`

---

## Step 3: Determine Mode

**Check if context file already exists:**

1. **Check existence** of context file path determined in Step 2

2. **Determine operation mode**:
   - **Context file EXISTS** → UPDATE mode
   - **Context file NOT EXISTS** → CREATE mode

3. **Inform user of mode**:
   ```markdown
   [Creating new/Updating existing] context for `[target-file]`
   ```

---

## Step 4: Generate Content

### Common: Read Target File

**Always read the target file first** to understand what needs to be documented:

1. **Read target file** using Read tool
2. **Analyze the code**:
   - Primary purpose and problem it solves
   - Main exported functions/classes/interfaces
   - Key dependencies and integrations
   - Usage patterns and when to use this code

### For CREATE Mode

1. **Generate draft context** based on:
   - User-provided content (if available)
   - Code analysis from target file
   - Template structure

2. **Check frontmatter requirements**:
   - Read `ctx.config.yaml` to check `frontmatter.local` setting
   - Apply frontmatter according to config:
     - `required`: Must include `what`, `when`, `not_when` fields
     - `optional`: Include frontmatter (recommended for better AI indexing)
     - `none`: Skip frontmatter entirely

3. **Generate complete context**:
   - **If frontmatter required/optional**:
     ```markdown
     ---
     target: [absolute-path-from-project-root]
     what: [Brief description of what this code does]
     when:
       - [When to use this code]
       - [Scenarios where this is relevant]
     not_when:
       - [When NOT to use this code]
       - [Scenarios where this doesn't apply]
     ---

     # [Additional context as Markdown]
     ```

   - **If frontmatter none**:
     ```markdown
     # Context for [target-file]

     [Markdown content describing the code]
     ```

4. **Present draft for approval**:
   ```markdown
   ## 📝 Creating context for: `[target-file]`

   [Show generated context]

   ---

   Proceed with this content?
   ```

5. **Wait for user approval** before proceeding to write

### For UPDATE Mode

1. **Read existing context file**

2. **Attempt to detect recent changes** (optional, non-blocking):
   ```bash
   git diff HEAD -- [target-file]
   ```

   **If git command succeeds**:
   - Analyze what changed in the code
   - Determine which context fields may need updating

   **If git command fails** (git not available, not a git repo, etc.):
   ```markdown
   ℹ️ Git not available - analyzing current code state instead
   ```
   - Proceed without git diff
   - Analyze current code vs existing context
   - Continue normally

3. **Generate update proposal**:
   - If user provided content → use as basis for updates
   - If no content → analyze code and suggest updates
   - Check frontmatter config and ensure compliance

4. **Present update proposal**:
   ```markdown
   ## 🔍 Update proposal for: `[target-file]`

   ### Current Context
   [Show current context]

   ---

   ### Code Changes Detected
   [Summary of changes found - or "Analyzing current state" if no git]

   ---

   ### Proposed Updates
   [Show proposed changes to relevant fields]

   **Rationale**: [Explain why these updates are needed]

   ---

   Proceed with this update?
   ```

5. **Wait for user approval** before proceeding to write

---

## Step 5: Write & Sync

### Write the Context File

**For CREATE:**

1. **Use Write tool to create the context file**:
   - Write to the context file path (e.g., `src/utils/url.ctx.md`)
   - Include all content (frontmatter + body if applicable)
   - Ensure proper Markdown formatting
   - Ensure `target` path is absolute (starts with `/` from project root)

**For UPDATE:**

1. **Use Edit tool to update the existing context file**:
   - Apply approved changes
   - Preserve existing formatting
   - Update relevant sections only
   - Maintain frontmatter structure if present

### MANDATORY: Sync Registry

**Run sync command:**
```bash
ctx sync --local
```

**Handle sync results:**

**If sync succeeds:**
```markdown
✓ [Created/Updated] [context-file-path]
✓ Synced local context registry

Summary:
• Target: [absolute-target-path]
• Context: [context-file-path]
• [Brief description of changes - 1-2 sentences]
```

**If sync fails:**
```markdown
⚠️ Context file written but sync failed

✓ File [created/updated]: [context-file-path]
❌ Sync error: [error message from command]

The context file was written successfully, but the registry update failed.

Possible causes:
• Invalid YAML syntax in frontmatter
• Missing required frontmatter fields (check ctx.config.yaml)
• Invalid target path (must be absolute from project root)
• Malformed context file structure

Next steps:
1. Check the error message above
2. Verify frontmatter syntax in: [context-file-path]
3. Ensure target path starts with `/` and exists
4. Run: ctx sync --local
5. If issue persists, check ctx.config.yaml settings

Your context file is ready, just not indexed by AI yet.
```

**Do NOT mark task as complete if sync fails** - make this clear to user.

---

# What Local Context Does

Local contexts are file-specific documentation stored alongside your code:

- **Purpose Documentation** - What problem does this code solve?
- **Usage Guidance** - When and how should developers use this code?
- **Integration Points** - How does this code interact with other modules?
- **Context for AI** - Helps AI understand when to suggest this code

### File Structure:

```
src/
  utils/
    url.ts           # Your code
    url.ctx.md       # Context for url.ts
  services/
    payment.ts       # Your code
    payment.ctx.md   # Context for payment.ts
```

### When to use local context:

✅ Module-specific implementation details
✅ When and why to use a particular function/class
✅ Integration patterns with other modules
✅ Common pitfalls and gotchas
✅ Usage examples and scenarios

❌ Project-wide rules (use global context)
❌ Architecture decisions (use global context)
❌ Implementation details (use code comments)
❌ API documentation (use JSDoc/docstrings)

### Frontmatter handling:

- Controlled by `ctx.config.yaml` local configuration
- Can be: `required`, `optional`, or `none`
- Recommended fields: `target`, `what`, `when`, `not_when`
- Optional field: `future` for planned improvements
- Version field is optional (defaults to 1.0.0 if omitted)

---

# Important Rules

1. **Always validate first** - Catch issues before creating/updating, block on errors

2. **Target path is required** - Cannot create context without knowing the target file

3. **Target must be absolute in frontmatter** - Path must start with `/` from project root

4. **Respect config** - Follow frontmatter settings defined in `ctx.config.yaml`

5. **Git is optional** - If git diff fails, continue with current state analysis

6. **MANDATORY sync** - Always sync after write, handle failures gracefully with clear guidance

7. **User approval required** - Always present content and wait for approval before writing

8. **Focus on WHEN and WHY** - Context is usage-oriented, not implementation details

9. **Be specific** - Avoid vague descriptions like "handles stuff"

10. **Conservative updates** - Only update when code changes affect usage patterns

---

# Reference Documents

- **Local registry**: `ctx/.local-context-registry.yml` - Index of all local contexts
- **Configuration**: `ctx.config.yaml` - Frontmatter and behavior settings
- **Templates**: `ctx/templates/local-context.md` - Customizable template (optional reference)

---

# Example Interactions

## Example 1: CREATE with content (direct)

**User:** `/ctx.local src/utils/validator.ts Validates user input for forms and APIs`

**AI:**
```markdown
[Runs: ctx validate --local]
✓ Validation passed

Creating new context for: `src/utils/validator.ts`

[Reads src/utils/validator.ts]
[Checks ctx.config.yaml: frontmatter.local = optional]

## 📝 Creating context for: `src/utils/validator.ts`

---
target: /src/utils/validator.ts
what: Validates user input for forms and APIs with configurable rules
when:
  - Processing user form submissions
  - Validating API request payloads
  - Sanitizing user-generated content
not_when:
  - Validating server-side configuration
  - Type checking (use TypeScript for that)
---

# Validation Utilities

This module provides flexible validation functions for user input across forms and API endpoints.

## Key Functions

- `validateEmail()` - RFC-compliant email validation
- `validatePhone()` - International phone number validation
- `sanitizeInput()` - XSS prevention and input cleaning
- `validateSchema()` - JSON schema validation for complex objects

## Usage Example

```typescript
import { validateEmail, validateSchema } from './utils/validator';

if (!validateEmail(userInput.email)) {
  throw new Error('Invalid email format');
}
```

---

Proceed with this content?
```

**User:** `yes`

**AI:**
```markdown
[Writes src/utils/validator.ctx.md]
[Runs: ctx sync --local]

✓ Created src/utils/validator.ctx.md
✓ Synced local context registry

Summary:
• Target: /src/utils/validator.ts
• Context: src/utils/validator.ctx.md
• Created validation utility context with usage guidance and examples
```

---

## Example 2: CREATE path only (interactive)

**User:** `/ctx.local src/services/payment.ts`

**AI:**
```markdown
[Runs: ctx validate --local]
✓ Validation passed

Creating new context for: `src/services/payment.ts`

[Reads src/services/payment.ts]

I'll create context for the payment service. What specific aspects should I document?

For example:
- How to integrate payment processing
- Supported payment methods
- Error handling patterns
- Webhook configuration
- Security considerations

What would you like to focus on?
```

**User:** `Document the payment processing flow and webhook handling`

**AI:**
```markdown
[Checks ctx.config.yaml: frontmatter.local = optional]

## 📝 Creating context for: `src/services/payment.ts`

---
target: /src/services/payment.ts
what: Handles payment processing and webhook events for Stripe integration
when:
  - Processing customer payments
  - Handling payment status updates
  - Implementing subscription billing
  - Managing payment webhooks
not_when:
  - Displaying payment UI (use payment.client.ts)
  - Managing user accounts (use user service)
---

# Payment Service

Manages payment processing through Stripe API and handles webhook events.

## Payment Processing Flow

1. Create payment intent
2. Confirm payment on client
3. Handle webhook for completion
4. Update order status

## Webhook Handling

Processes Stripe webhooks for:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `customer.subscription.updated`

Configure webhook endpoint: `/api/webhooks/stripe`

## Security

- Validates webhook signatures
- Uses idempotency keys
- Logs all payment events

---

Proceed with this content?
```

---

## Example 3: UPDATE with git diff

**User:** `/ctx.local src/services/auth.ts Updated to support OAuth2 flow`

**AI:**
```markdown
[Runs: ctx validate --local]
✓ Validation passed

Updating existing context for: `src/services/auth.ts`

[Reads src/services/auth.ctx.md]
[Runs: git diff HEAD -- src/services/auth.ts]

## 🔍 Update proposal for: `src/services/auth.ts`

### Current Context
---
target: /src/services/auth.ts
what: Handles user authentication with JWT tokens
when:
  - User login/logout
  - Validating API requests
---

### Code Changes Detected
- Added OAuth2 provider configuration
- New `loginWithOAuth()` function
- Added token exchange logic

### Proposed Updates

Updated `what` field:
```yaml
what: Handles user authentication with JWT tokens and OAuth2 providers (Google, GitHub)
```

Added to `when` field:
```yaml
when:
  - User login/logout
  - Validating API requests
  - Social login with OAuth2 providers  # NEW
```

**Rationale**: The service now supports OAuth2 authentication in addition to JWT, which expands its usage scenarios to include social login flows.

---

Proceed with this update?
```

**User:** `yes`

**AI:**
```markdown
[Updates src/services/auth.ctx.md]
[Runs: ctx sync --local]

✓ Updated src/services/auth.ctx.md
✓ Synced local context registry

Summary:
• Target: /src/services/auth.ts
• Context: src/services/auth.ctx.md
• Added OAuth2 support documentation to reflect new authentication methods
```

---

## Example 4: UPDATE without git (fallback)

**User:** `/ctx.local src/utils/cache.ts`

**AI:**
```markdown
[Runs: ctx validate --local]
✓ Validation passed

Updating existing context for: `src/utils/cache.ts`

[Reads src/utils/cache.ctx.md]
[Runs: git diff HEAD -- src/utils/cache.ts]
ℹ️ Git not available - analyzing current code state instead

[Reads src/utils/cache.ts]

## 🔍 Update proposal for: `src/utils/cache.ts`

### Current Context
---
target: /src/utils/cache.ts
what: Simple in-memory cache for API responses
when:
  - Caching API responses
  - Storing temporary data
---

### Code Analysis
Current implementation includes:
- Redis integration (not documented in context)
- TTL configuration
- Cache invalidation patterns
- Multi-level caching strategy

### Proposed Updates

The current context is outdated. Here's the updated version:

---
target: /src/utils/cache.ts
what: Multi-level caching with Redis and in-memory fallback
when:
  - Caching API responses with TTL
  - Storing frequently accessed data
  - Implementing rate limiting
  - Session storage
not_when:
  - Persistent storage (use database)
  - Cache size exceeds memory limits
---

**Rationale**: The code has evolved from simple in-memory cache to a sophisticated multi-level caching system with Redis. Context needs significant update to reflect current capabilities.

---

Proceed with this update?
```

---

## Example 5: Validation error blocks execution

**User:** `/ctx.local src/api/users.ts`

**AI:**
```markdown
[Runs: ctx validate --local]

❌ Validation errors found

Errors:
• src/utils/old-helper.ctx.md - Target file not found: /src/utils/old-helper.ts
• src/services/broken.ctx.md - Invalid YAML syntax in frontmatter at line 3

Please fix these errors manually before proceeding:
1. Remove src/utils/old-helper.ctx.md or restore the target file
2. Fix YAML syntax in src/services/broken.ctx.md (check line 3 for malformed YAML)

After fixing, run this command again.
```

---

## Example 6: Sync failure with guidance

**User:** `/ctx.local src/hooks/useAuth.ts Custom hook for authentication state`

**AI:**
```markdown
[Validates successfully, generates content, gets approval, writes file]

[Runs: ctx sync --local]

⚠️ Context file written but sync failed

✓ File created: src/hooks/useAuth.ctx.md
❌ Sync error: Invalid frontmatter - target path must be absolute (start with /)

The context file was written successfully, but the registry update failed.

Possible causes:
• Invalid YAML syntax in frontmatter
• Missing required frontmatter fields (check ctx.config.yaml)
• Invalid target path (must be absolute from project root)
• Malformed context file structure

Next steps:
1. Check the error message above
2. Verify frontmatter syntax in: src/hooks/useAuth.ctx.md
3. Ensure target path starts with `/` and exists
4. Run: ctx sync --local
5. If issue persists, check ctx.config.yaml settings

Your context file is ready, just not indexed by AI yet.

[Opens src/hooks/useAuth.ctx.md for user to fix]
The target path should be `/src/hooks/useAuth.ts` not `src/hooks/useAuth.ts`
```

---

## Example 7: Frontmatter required mode

**User:** `/ctx.local src/lib/analytics.ts Tracks user events`

**AI:**
```markdown
[Runs: ctx validate --local]
✓ Validation passed

Creating new context for: `src/lib/analytics.ts`

[Reads src/lib/analytics.ts]
[Checks ctx.config.yaml: frontmatter.local = required]

## 📝 Creating context for: `src/lib/analytics.ts`

---
target: /src/lib/analytics.ts
what: Tracks user events and sends analytics data to multiple providers
when:
  - Tracking user interactions
  - Recording custom events
  - Monitoring feature usage
  - A/B testing
not_when:
  - Logging errors (use error tracking service)
  - Tracking sensitive user data
---

# Analytics Integration

Provides unified interface for tracking user events across multiple analytics providers (Google Analytics, Mixpanel, Amplitude).

## Key Features

- Event batching for performance
- Automatic user identification
- Custom event properties
- Privacy-compliant tracking

## Usage

```typescript
import { track } from './lib/analytics';

track('button_clicked', {
  buttonId: 'signup',
  page: 'homepage'
});
```

---

Proceed with this content?
```

**Note:** Since frontmatter is `required`, the AI ensures all required fields (`target`, `what`, `when`, `not_when`) are present.
