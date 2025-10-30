---
description: Manage global context documentation (create or update)
argument-hint: <path-or-intent> [content]
---

You are assisting with managing global context documentation.

# Arguments

**$ARGUMENTS**: Flexible input - can be path, intent, or both

Examples:
- `architecture/caching.md` (path only)
- `rules/api-design.md Add REST versioning guidelines` (path + content)
- `typescript rule에 enum 대신 union type 쓰도록 추가` (natural language intent)

# Your Task

Manage (create or update) global context documentation. Global contexts are project-level Markdown documents stored in `ctx/` that describe architecture, rules, processes, or any project-wide knowledge.

# Workflow (Follow Step-by-Step)

## Step 0: Parse $ARGUMENTS

**Pure argument parsing:**

1. **Extract first token**: Everything before first space (if any)
2. **Extract remaining text**: Everything after first space (if any)

## Step 1: Search Registry First

**Always start by searching the global registry** (`ctx/.global-context-registry.yml`):

1. **Search for exact path match**:
   - Check if first token matches any document path
   - Normalize: prepend `ctx/` if needed, add `.md` if missing

2. **Search for semantic matches**:
   - Search entire $ARGUMENTS in: file paths, ai_comments, categories
   - Find all potentially relevant documents

3. **Determine mode**:
   - **Exact path match found** → Path Mode (skip to Step 2)
   - **Semantic matches found** → Intent Mode (show results)
   - **No matches** → New Document Mode (suggest path)

---

## Step 2: Path Mode (Exact Match Found)

**A document at the specified path exists or path is clearly defined:**

### If content provided in $ARGUMENTS:

1. **Read existing document** (if UPDATE)

2. **Generate updated content**:
   - For CREATE: Generate Markdown from content
   - For UPDATE: Merge content with existing

3. **Present result**:
   ```markdown
   ## 📝 [Creating/Updating]: `[path]`

   [Show generated/updated content]

   ---

   👉 **Approve?** (yes/no/edit)
   ```

4. **On approval** → Jump to Final Step

### If no content provided:

**For CREATE:**
1. Ask: `What should this document contain?`
2. Generate draft from response
3. Present draft → Get approval → Final Step

**For UPDATE:**
1. Read existing document
2. Ask: `What would you like to change?`
3. Generate updates from response
4. Present changes → Get approval → Final Step

---

## Step 2: Intent Mode (Semantic Matches Found)

**Multiple potentially relevant documents found:**

1. **Present search results**:
   ```markdown
   ## Found related documents for: "$ARGUMENTS"

   1. [path] - [ai_comment]
   2. [path] - [ai_comment]
   ...

   👉 **Which document should I work on?** (1/2.../new)
   ```

2. **Based on user choice**:
   - **Existing document (1/2/...)**: Read it, apply intent from $ARGUMENTS
   - **New document**: Ask for suggested path or generate from intent

3. **Generate content/updates** based on $ARGUMENTS intent

4. **Present result**:
   ```markdown
   ## 📝 [Creating/Updating]: `[path]`

   [Show generated/updated content]

   ---

   👉 **Approve?** (yes/no/edit)
   ```

5. **On approval** → Jump to Final Step

---

## Step 2: New Document Mode (No Matches)

**No existing documents match the query:**

1. **Suggest path** based on $ARGUMENTS:
   ```markdown
   No related documents found.

   Based on your request, I suggest creating:
   **[suggested-path]**

   👉 **Approve path?** (yes/no/custom-path)
   ```

2. **Generate content** from $ARGUMENTS intent

3. **Present draft**:
   ```markdown
   ## 📝 Creating: `[path]`

   [Show generated content]

   ---

   👉 **Approve?** (yes/no/edit)
   ```

4. **On approval** → Jump to Final Step

---

## Final Step: Write & Sync

### Write the Document

**For CREATE:**
1. Run `ctx create <path> --global --force`
   - Automatically normalizes path to `ctx/`
   - Adds `.md` extension if missing
   - Creates directory structure
   - Includes frontmatter template (when/what/not_when)

2. Use Edit tool to fill in content:
   - Replace TODO placeholders in frontmatter
   - Fill when/what/not_when fields
   - Write main document content below frontmatter
   - Use clear headings, examples, actionable guidance

**For UPDATE:**
1. Use Edit tool to update existing document:
   - Modify changed sections
   - Update frontmatter if when/what/not_when changed
   - Keep structure clear and actionable

### MANDATORY: Sync Registry

```bash
ctx sync --global
```

**CRITICAL**: This step is REQUIRED. Do not skip.
- AI annotations generated/updated automatically during sync
- If sync fails → report error and stop
- Task NOT complete without successful sync

### Provide Summary

```markdown
✓ [Created/Updated] [doc-path]
✓ Synced global context registry

Summary:
- Document: [doc-path]
- [Brief description of content/changes]
```

# Important Rules

1. **Registry-first approach**: Always search registry before determining mode

2. **Free-form Markdown**: No strict template, focus on clarity and usefulness

3. **User decides structure**: Categories and organization are user-defined

4. **Be clear and concise**: Write for humans who will read this later

5. **AI annotations are automatic**: Generated by sync, don't add manually

6. **MANDATORY sync**: Always run `ctx sync --global` after create/update
   - This is REQUIRED, not optional
   - If sync fails → report error and stop
   - Task NOT complete without successful sync

7. **Approval format**: Always use `👉 **Approve?** (yes/no/edit)`

# Reference Documents

- Global registry: `ctx/.global-context-registry.yml`

# Example Usage

## Path Mode Examples

```bash
# Path only - interactive
/ctx.global architecture/caching.md

# Path with content - direct
/ctx.global rules/api-design.md Use RESTful conventions and version with /v1/ prefix

# Explicit ctx/ path
/ctx.global ctx/processes/deployment.md Document our CI/CD pipeline
```

## Intent Mode Examples

```bash
# Natural language search and update
/ctx.global typescript rule에 enum 대신 union type 쓰도록 추가

# General instruction
/ctx.global Add API versioning guidelines

# Korean natural language
/ctx.global 캐싱 전략에 Redis TTL 설정 가이드 추가해줘
```

## How It Works

**Registry-First Approach**:
- AI always searches registry first
- Exact path match → Path Mode (direct edit)
- Semantic matches → Intent Mode (choose from results)
- No matches → New Document Mode (suggest path)

Choose whichever input feels natural - AI will figure it out!
