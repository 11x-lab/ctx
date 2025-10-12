---
description: Manage local context for a code module (create or update)
argument-hint: <target-file> [context-content]
---

You are assisting with managing local context for a code module.

# Arguments

**$ARGUMENTS**: Target file path and optional context content

Examples:
- `src/services/payment.ts` (path only)
- `src/utils/validator.ts Validates user input for forms and APIs` (path + content)

# Your Task

Manage (create or update) the local context file for the target module following the Context Growing Engineering methodology.

# Workflow (Follow Step-by-Step)

## Step 0: Parse $ARGUMENTS

**Pure argument parsing (no file operations yet):**

1. **Extract target file path**:
   - First token of $ARGUMENTS is the target file path
   - Must be a code file (*.ts, *.js, *.py, etc.) or directory

2. **Extract optional content**:
   - Remaining text after target path (if any) is user-provided content

3. **Determine context file path**:
   - If target is `src/utils/url.ts` → context file is `src/utils/url.ctx.yml`
   - If target is a directory → context file is `[directory]/ctx.yml`

## Step 1: Determine Operation Mode

**Read template once**: `ctx/templates/local-context.yml`
   - Understand all required fields and structure
   - This template defines the context file format

**Check context file existence**:
- **If EXISTS** → UPDATE mode
- **If NOT EXISTS** → CREATE mode

## Step 2: Gather Information

### For CREATE (new context file)

1. **Read the target file**
   - Understand primary purpose and problem it solves
   - Identify main exported functions/classes/interfaces
   - Note key dependencies and integrations

2. **Generate draft** following template structure:
   - If user provided content → use it as basis for all fields
   - If no content → AI fills what it can analyze
   - List remaining fields that need user input

3. **Present draft**:
   ```markdown
   ## 📝 Draft Context for `[target-file]`

   [Show AI-generated content following template]

   ---

   👉 **Approve?** (yes/no/edit)
   ```
   - If content was provided and draft is complete → wait for approval
   - If fields are missing → ask for user input first

4. **Get approval** → Proceed to Final Step

### For UPDATE (existing context file)

1. **Read existing context file**

2. **Read the target file**
   - Run `git diff HEAD -- [target-file]` to see recent changes
   - Determine which context fields may need updating

3. **Generate update proposal**:
   ```markdown
   ## 🔍 Update Proposal for `[target-file]`

   ### Current Context
   [Show current context following template structure]

   ---

   ### Code Changes Detected
   [Summary of git diff findings]

   ---

   ### Proposed Updates
   [Show proposed changes for relevant fields]

   **Rationale**: [Explain why these updates are needed]

   ---

   👉 **Approve?** (yes/no/edit)
   ```

4. **Get approval** → Proceed to Final Step

---

## Final Step: Write & Sync

### Write the Context File

**For CREATE:**
1. Run `ctx create <target-file> --force` to generate template structure
2. Use Edit tool to fill in all fields from approved draft
   - Ensure `meta.target` is absolute path (starts with `/`)
   - Fill `what`, `when`, `not_when` sections
   - Optionally add `future` section

**For UPDATE:**
1. Use Edit tool to update the existing context file
   - Apply approved changes from proposal
   - Consider version bump for significant changes
   - Update `what`/`when`/`not_when` as needed

### MANDATORY: Sync Registry

```bash
ctx sync --local
```

**CRITICAL**: This step is REQUIRED. Do not skip.
- If sync fails → report error and stop
- Task is NOT complete without successful sync

### Provide Summary

```markdown
✓ [Created/Updated] [context-file-path]
✓ Synced local context registry

Summary:
- Target: /[absolute-path]
- Context: [context-file-path]
- [Brief description of changes]
```

# Important Rules

1. **Template defines structure**: Read `ctx/templates/local-context.yml` once at start
   - All field definitions come from template
   - Follow template structure exactly
   - Don't hardcode field names or requirements

2. **Target path in meta MUST be absolute** (start with `/` from project root)

3. **Focus on WHEN and WHY, not HOW** - context is usage-oriented, not implementation

4. **Be specific** - avoid vague descriptions

5. **For updates**: Be conservative - only update when code changes affect usage patterns

6. **MANDATORY sync**: Always run `ctx sync --local` after create/update
   - This is REQUIRED, not optional
   - If sync fails → report error and stop
   - Task NOT complete without successful sync

7. **Version bump**: Consider incrementing for significant changes

8. **Approval format**: Always use `👉 **Approve?** (yes/no/edit)`

# Reference Documents

- Local registry: `ctx/.local-context-registry.yml`

# Example Usage

## Path Only (Interactive)
```bash
/ctx.local src/services/payment.ts
```
AI will check if context exists, analyze the file, and guide you through create/update.

## Path + Content (Quick)
```bash
/ctx.local src/utils/validator.ts Validates user input for forms and APIs
```
AI will create or update the context directly from your description.
