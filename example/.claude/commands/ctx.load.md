---
description: Load relevant contexts by description
argument-hint: <description>
---

You are assisting with loading relevant contexts into the conversation.

# Arguments

**$ARGUMENTS**: Description of what contexts to load

Examples:
- `authentication` (single keyword)
- `payment processing` (multiple keywords)
- `api design rules` (specific topic)
- `database schema and migrations` (complex query)

# Your Task

Search and load relevant context files (local and global) based on the user's description. This helps bring project knowledge into the current conversation.

# Workflow (Follow Step-by-Step)

## Step 1: Search Registries

**Read both registry files:**
1. `ctx/local-context-registry.yml`
2. `ctx/global-context-registry.yml`

**Search strategy:**
- Match $ARGUMENTS against:
  - `preview.what` (what the context describes)
  - `preview.when` (when to use it)
  - `folder` names (for global contexts)
  - File paths and names
- Use semantic matching (not just exact string match)
- Consider synonyms and related terms

## Step 2: Present Matches

**If matches found:**

```markdown
## 🔍 Found Contexts for: "$ARGUMENTS"

### Local Contexts (N)
1. **[target-path]**
   - Context: [source-path]
   - What: [preview.what summary]

2. **[target-path]**
   - Context: [source-path]
   - What: [preview.what summary]

### Global Contexts (M)
1. **[doc-path]**
   - What: [preview.what summary]
   - When: [preview.when[0], preview.when[1], ...]

2. **[doc-path]**
   - What: [preview.what summary]

---

👉 **Load all?** (yes/no/select)
```

**If no matches:**
```markdown
## ❌ No contexts found for: "$ARGUMENTS"

I searched through:
- X local contexts
- Y global contexts

Try:
- Different keywords
- Broader terms
- Check `/ctx.sync` to ensure registry is up-to-date
```

## Step 3: Load Files

**For each selected context:**

### Local Context Loading:
1. Read the context file: `[source]` (*.ctx.yml)
2. Read the target file: `[meta.target]` (actual code)
3. Present both to conversation:
   ```markdown
   ### Loaded: [target-path]

   **Context Summary:**
   - What: [preview.what]
   - When: [preview.when as bullet list]
   - Not when: [preview.not_when as bullet list]

   **Target File:** [target-path]
   [Show key exports/functions from target file]
   ```

### Global Context Loading:
1. Read the markdown document: `[source]`
2. Present to conversation:
   ```markdown
   ### Loaded: [doc-path]

   **Summary:**
   - What: [preview.what]
   - When: [preview.when as bullet list]

   [Show document content or relevant sections]
   ```

## Step 4: Provide Summary

```markdown
## ✓ Loaded Contexts

**Local Contexts (N):**
- [target-path-1]
- [target-path-2]

**Global Contexts (M):**
- [doc-path-1]
- [doc-path-2]

**Total:** N + M contexts loaded

---

💡 **Tip:** These contexts are now available in our conversation. Ask me anything about them!
```

# Important Rules

1. **Always search both registries** - Don't skip local or global

2. **Semantic matching** - Use AI understanding, not just string matching
   - "auth" should match "authentication", "authorization"
   - "payment" should match "billing", "subscription"

3. **Show relevance** - Explain why each match is relevant

4. **Load actual files** - Don't just show registry entries
   - For local: Load both .ctx.yml AND target file
   - For global: Load the full .md document

5. **Readable presentation** - Format loaded content clearly

6. **Handle errors gracefully**:
   - Missing files → Skip and warn user
   - Invalid registry → Suggest `ctx sync`

7. **User control** - Let user confirm before loading many files

8. **Context limits** - If too many matches (>10), ask user to be more specific

# Advanced Features

## Folder Loading

If $ARGUMENTS matches a folder name in global registry:
```markdown
## 📁 Found Folder: [folder-name]

Contains X documents:
1. [doc-1] - [what]
2. [doc-2] - [what]
...

👉 **Load entire folder?** (yes/no)
```

## Wildcard Patterns

Support patterns like:
- `src/auth/*` → Load all auth-related local contexts
- `rules/*` → Load all rule documents

## Related Contexts

After loading, suggest related contexts:
```markdown
💡 **Related contexts you might want:**
- [related-1] - [what]
- [related-2] - [what]
```

# Reference Documents

- Local registry: `ctx/local-context-registry.yml`
- Global registry: `ctx/global-context-registry.yml`

# Example Usage

## Example 1: Simple Keyword

```
User: /ctx.load authentication

AI:
[Searches registries...]

## 🔍 Found Contexts for: "authentication"

### Local Contexts (3)
1. **/src/auth/jwt.ts**
   - Context: src/auth/jwt.ctx.yml
   - What: JWT token generation and validation utilities

2. **/src/auth/middleware.ts**
   - Context: src/auth/middleware.ctx.yml
   - What: Express middleware for route authentication

3. **/src/auth/oauth.ts**
   - Context: src/auth/oauth.ctx.yml
   - What: OAuth2 integration with Google and GitHub

### Global Contexts (2)
1. **/rules/auth-security.md**
   - What: Authentication security best practices
   - When: Implementing any authentication feature, Code review...

2. **/architecture/auth-flow.md**
   - What: User authentication and session management flow
   - When: Designing auth features, Debugging auth issues...

---

👉 **Load all?** (yes/no/select)

User: yes

AI:
[Loads all 5 contexts...]

## ✓ Loaded Contexts

**Local Contexts (3):**
- /src/auth/jwt.ts
- /src/auth/middleware.ts
- /src/auth/oauth.ts

**Global Contexts (2):**
- /rules/auth-security.md
- /architecture/auth-flow.md

**Total:** 5 contexts loaded

---

💡 **Tip:** I now have all authentication-related contexts. How can I help?
```

## Example 2: Complex Query

```
User: /ctx.load payment processing and refund handling

AI:
[Searches registries...]

## 🔍 Found Contexts for: "payment processing and refund handling"

### Local Contexts (2)
1. **/src/payment/stripe.ts**
   - Context: src/payment/stripe.ctx.yml
   - What: Stripe payment gateway integration

2. **/src/payment/refund.ts**
   - Context: src/payment/refund.ctx.yml
   - What: Refund processing and webhook handling

### Global Contexts (1)
1. **/architecture/payment/refund-process.md**
   - What: Refund workflow and edge cases
   - When: Implementing refund features, Handling payment disputes...

---

👉 **Load all?** (yes/no/select)
```

## Example 3: No Matches

```
User: /ctx.load blockchain

AI:
## ❌ No contexts found for: "blockchain"

I searched through:
- 45 local contexts
- 12 global contexts

Try:
- Different keywords
- Broader terms
- Check if contexts exist: `ctx sync`
```

## Example 4: Folder Loading

```
User: /ctx.load rules

AI:
## 📁 Found Folder: rules

Contains 5 documents:
1. typescript.md - TypeScript coding standards
2. api-design.md - REST API design guidelines
3. auth-security.md - Authentication security best practices
4. testing.md - Testing strategies and patterns
5. git-workflow.md - Git commit and PR conventions

👉 **Load entire folder?** (yes/no)

User: yes

AI:
[Loads all 5 documents...]

## ✓ Loaded Contexts

**Global Contexts (5):**
- /rules/typescript.md
- /rules/api-design.md
- /rules/auth-security.md
- /rules/testing.md
- /rules/git-workflow.md

**Total:** 5 contexts loaded
```

# When to Use /ctx.load in Agentic Coding

## Use Cases

1. **Starting new feature in unfamiliar domain**
   ```
   Agent: About to implement payment feature
   Action: /ctx.load payment
   Result: Load all payment-related contexts before coding
   ```

2. **Following project patterns/rules**
   ```
   Agent: Need to create new API endpoint
   Action: /ctx.load api design rules
   Result: Load API guidelines to follow conventions
   ```

3. **Understanding complex architecture**
   ```
   Agent: Modifying authentication flow
   Action: /ctx.load authentication architecture
   Result: Load auth flow diagrams and documentation
   ```

4. **Cross-module changes**
   ```
   Agent: Database schema change affects multiple modules
   Action: /ctx.load database schema
   Result: Load schema docs and related contexts
   ```

## Auto-trigger Suggestions (Future)

AI could automatically trigger `/ctx.load` when:
- User mentions a domain that has contexts
- Code mentions imports from modules with contexts
- Error messages suggest checking documentation

# Notes

- **Performance**: Loading is fast (just file reads)
- **Idempotent**: Safe to load same contexts multiple times
- **Context window**: Be mindful of loading too many large files
- **Up-to-date**: Run `ctx sync` if registry seems stale
