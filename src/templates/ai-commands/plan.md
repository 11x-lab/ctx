---
description: Create a planning document from an issue URL
argument-hint: <url> [requirements]
allowed-tools: [Read, Write, Edit, TodoWrite, Bash, WebFetch, Glob, Grep, SlashCommand, mcp__linear-server__get_issue, mcp__linear-server__create_comment, mcp__github__*]
---

# Task
Create a comprehensive planning document based on the issue at: **$ARGUMENTS**

This command will:
1. Create a todo list to track progress
2. Fetch issue details from the provided URL (GitHub, Linear, or generic)
3. Create a local `plan.md` file with structured frontmatter
4. Load relevant contexts once
5. Conduct a Q&A session to gather requirements
6. Generate a high-level implementation plan
7. Update status to "Reviewed"
8. Sync the plan back to the issue as a comment

---

# Execution Algorithm

## Step 0: Create Todo List

**Create a todo list** to track progress through all steps.

Use TodoWrite to create todos for:
1. Get git branch and parse arguments
2. Fetch issue from URL
3. Create plan.md template
4. Load relevant contexts
5. Conduct Q&A session
6. Fill Q&A in plan.md
7. Generate implementation plan
8. Update status to Reviewed
9. Sync plan to issue
10. Show final summary

**Mark each todo as completed** as you finish each step.

---

## Step 1: Get Current Git Branch

```bash
git branch --show-current
```

**Store the branch name** for inclusion in frontmatter.

If not in a git repository → Use `"not-in-git-repo"` as branch name.

---

## Step 2: Parse Arguments

Extract from `$ARGUMENTS`:
- **URL** (required): First argument (e.g., `https://github.com/user/repo/issues/123`)
- **Requirements** (optional): Remaining text after URL

**Validation:**
- If no URL provided → Show error: "Error: URL is required. Usage: /ctx.plan <url> [requirements]"
- If URL is invalid → Show error: "Error: Invalid URL format"

---

## Step 3: Detect URL Type and Fetch Issue

### GitHub URLs
If URL contains `github.com`:

```bash
# Extract issue number from URL
gh issue view <issue-number> --repo <owner/repo>
```

**Alternative**: Use GitHub MCP if available.

### Linear URLs
If URL contains `linear.app`:

```typescript
// Extract issue ID from URL (e.g., ABC-123)
mcp__linear-server__get_issue({ id: "<issue-id>" })
```

### Generic URLs
For all other URLs:

```typescript
WebFetch({
  url: "<url>",
  prompt: "Extract the main content, title, and description from this page"
})
```

**Store:**
- Issue title
- Issue description/body
- Issue metadata (labels, assignees, etc.)

---

## Step 4: Create plan.md with Template

**Write to**: `plan.md` (project root)

**Template:**

```markdown
---
issue_link: <URL>
git_branch: <branch-name>
created_at: <ISO-timestamp>
status: In Progress
---

# Q&A

<!-- This section will be filled after the Q&A session -->

# Implementation Plan

<!-- This section will be filled after context analysis -->
```

**Show confirmation:**
```
✓ Created plan.md
  - Issue: <issue-title>
  - Branch: <branch-name>
  - Status: In Progress
```

---

## Step 5: Load Relevant Contexts

**Load contexts** related to the issue using the `/ctx.load` command.

**Create search description** from:
- Issue title
- Issue labels/tags
- Optional requirements argument
- Key technical terms from description

**Run:**
```bash
/ctx.load <search-description>
```

**Example:**
```
Issue: "Implement OAuth2 Social Login"
→ /ctx.load authentication oauth social login
```

---

## Step 6: Conduct Q&A Session

**Goal**: Ask comprehensive questions to understand the **Scope & Impact** and **Design Overview** of this change.

use AskUserQuestion tool to ask questions

**Present questions to the user:**

```markdown
## 📋 Planning Questions

I need to understand the scope and design of this change. Please answer the following questions:

### Scope & Impact
1. **What is in-scope for this change?** (What will be implemented/modified)
2. **What is out-of-scope for this change?** (What will NOT be addressed)
3. **What existing code, libraries, or infrastructure can be reused?**
4. **Which modules/files/classes/functions will be affected by this change?**

### Design Overview
5. **How will the architecture or system flow change after this implementation?** (Describe the changes)
6. **What are the main interfaces?** (Function signatures, API specs, event/message formats)
7. **What data model changes are needed?** (New entities, schema modifications, database changes)
8. **Are there external systems to integrate with?**
   - If yes: What are the request/response schemas, timeout/retry policies, auth/rate-limit requirements?

### Testing Strategy
9. **Will you write test code for this feature?**
   [ ] Yes [ ] No

---

Please take your time to provide detailed responses to all questions above.
```

**Wait for user response.**

**Note**: Ask follow-up questions if needed to fully understand the scope and design. The goal is to have a comprehensive understanding before moving to implementation planning.

---

## Step 7: Fill Q&A Section in plan.md

**After receiving answers**, update `plan.md` with the actual Q&A conversation.

**Record the complete Q&A exchange:**
- Copy the questions you asked
- Copy the user's answers verbatim
- Include any follow-up questions and answers
- Preserve the conversation flow

**Example format:**
```markdown
---
issue_link: <URL>
git_branch: <branch-name>
created_at: <ISO-timestamp>
status: In Progress
---

# Q&A

**Q: What is in-scope for this change?**
A: [User's actual answer here...]

**Q: What is out-of-scope for this change?**
A: [User's actual answer here...]

**Q: [Follow-up question if asked]**
A: [User's actual answer here...]

[... continue with all Q&A exchanges ...]

# Implementation Plan

<!-- To be filled next -->
```

**Show confirmation:**
```
✓ Updated plan.md with Q&A conversation
```

---

## Step 8: Generate Implementation Plan

**Goal**: Create a high-level, phase-based implementation plan.

### Plan Structure

```markdown
# Implementation Plan

## Phase 1: <Phase-Name>

### Step 1: <Step-Name>
- [ ] <High-level task>
- [ ] <High-level task>

### Step 2: <Step-Name>
- [ ] <High-level task>

## Phase 2: <Phase-Name>

### Step 1: <Step-Name>
- [ ] <High-level task>

### Step 2: <Step-Name>
- [ ] <High-level task>

## Phase 3: Testing (if applicable)

### Step 1: Write Tests
- [ ] Unit tests for <component>
- [ ] Integration tests for <flow>
- [ ] E2E tests for <user-journey>

## Files to Modify
- `<path/to/file.ts>` - <what needs to change>
- `<path/to/file.ts>` - <what needs to change>

## Files/Objects to Reuse
- `<path/to/utility.ts>` - `<className>` / `<functionName>`
- `<path/to/types.ts>` - `<InterfaceName>`, `<EnumName>`

## New Files to Create
- `<path/to/new-file.ts>` - <purpose>
- `<path/to/new-file.ctx.md>` - Document new feature

## Notes
- <Any important considerations>
- <Architectural patterns to follow>
- <Dependencies to add>
```

### Plan Generation Rules

1. **High-level only** - No detailed code implementation steps
2. **Phase-based** - Group related steps into logical phases
3. **Checkbox format** - Each task should be actionable
4. **Include testing phase** - Only if user answered "Yes" to test question
5. **Reference Q&A** - Use Q&A responses to inform plan structure
6. **Reference loaded contexts** - Use context knowledge to suggest patterns

**Update plan.md** with generated implementation plan.

**Show confirmation:**
```
✓ Generated implementation plan
```

---

## Step 9: Update Status to Reviewed

**Update plan.md status** from "In Progress" to "Reviewed".

```markdown
---
issue_link: <URL>
git_branch: <branch-name>
created_at: <ISO-timestamp>
status: Reviewed
---
```

**Show confirmation:**
```
✓ Updated status to: Reviewed
```

---

## Step 10: Sync Plan to Issue (GitHub/Linear)

**Goal**: Post the plan as a comment on the original issue.

### GitHub Issues

```bash
gh api repos/<owner>/<repo>/issues/<number>/comments \
  -X POST \
  -f body="$(cat plan.md)"
```

**Confirmation:**
```
✓ Plan synced to GitHub issue #<number>
```

### Linear Issues

```typescript
mcp__linear-server__create_comment({
  issueId: "<issue-id>",
  body: "<plan.md-content>"
})
```

**Confirmation:**
```
✓ Plan synced to Linear issue <issue-id>
```

### Generic URLs

**Show message:**
```
ℹ Plan created in plan.md
  Cannot auto-sync to generic URLs.
  Please manually copy plan.md content to the issue if needed.
```

---

## Step 11: Final Summary

**Show complete summary:**

```markdown
---

## ✅ Planning Complete

**Plan Details:**
- Issue: <issue-title>
- Link: <issue-link>
- Branch: <git-branch>
- Status: Reviewed
- File: plan.md

**What's in the plan:**
- ✓ Q&A responses (scope, design, testing)
- ✓ Implementation plan (phases and steps)
- ✓ Files to modify/create
- ✓ Reusable resources identified

**Next Steps:**
1. Review the plan in `plan.md`
2. Make any adjustments if needed
3. Start implementation following the phases
4. Update status to "Completed" when done

**Plan synced to issue:** <yes/no>
```

---

# Rules

1. **Create todos first** - Use TodoWrite to track progress
2. **Always get git branch first** - Include in frontmatter
3. **Validate URL** - Must be provided and valid
4. **Auto-detect URL type** - GitHub, Linear, or generic
5. **Load contexts once** - Use `/ctx.load` based on issue content
6. **Ask ALL questions at once** - Don't ask iteratively
7. **Always ask about tests** - Include in Q&A
8. **High-level plans only** - Phases and steps, not detailed code
9. **Include test phase conditionally** - Only if user wants tests
10. **Update status to Reviewed** - After implementation plan is generated
11. **Sync to issue** - Post plan as comment (GitHub/Linear only)
12. **Plan.md is local** - Not committed (gitignored)
13. **Status progression** - In Progress → Reviewed → Completed (manual)

---

# Advanced Features

## Multi-Phase Planning for Large Projects

If issue is complex (many Q&A answers, large scope):
- Break into multiple phases (Setup, Core Implementation, Integration, Testing, Deployment)
- Each phase should have 2-5 steps max
- Each step should have 2-5 tasks max

## Dependency Analysis

Identify dependencies between phases:
```markdown
## Phase Dependencies
- Phase 2 depends on: Phase 1 (database schema must exist)
- Phase 3 depends on: Phase 1, Phase 2 (auth + data layer ready)
```

## Risk Assessment

Include a risks section if warranted:
```markdown
## Risks & Mitigations
- **Risk**: Breaking changes to existing API
  - **Mitigation**: Version API, maintain backward compatibility
- **Risk**: Performance impact on large datasets
  - **Mitigation**: Add pagination, implement caching
```

# Reference

- Local registry: `{{GLOBAL_DIR}}/local-context-registry.yml`
- Global registry: `{{GLOBAL_DIR}}/global-context-registry.yml`
- Plan file: `plan.md` (project root, gitignored)
- Keep contexts updated: `/ctx.sync`
- Validate contexts: `/ctx.validate`
- Load contexts: `/ctx.load <description>`
