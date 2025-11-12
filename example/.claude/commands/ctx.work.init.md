---
description: Initialize a new work environment with git worktree for an issue
argument-hint: [branch-name] [issue-link]
allowed-tools: [Bash, TodoWrite, WebFetch, SlashCommand, mcp__linear-server__get_issue, mcp__github__*]
---

# Task
Set up a new work environment with git worktree: **$ARGUMENTS**

1. Validate parameters (at least one required)
2. Create git worktree in `.worktrees`
3. If issue link provided, run `/ctx.work.plan`

---

# Workflow

## 1. Parse Arguments

Extract from `$ARGUMENTS`:
- **branch-name** (optional): Branch name for worktree
- **issue-link** (optional): GitHub/Linear issue URL

**Validation:**
- If both missing → Error and stop:
  ```
  ❌ Error: At least one parameter required.
  Usage: /ctx.work.init [branch-name] [issue-link]
  ```

## 2. Infer Branch Name

### If branch-name provided:
Use it as-is.

### If only issue-link provided:
Fetch issue and generate branch name from title.

**GitHub:**
```bash
gh issue view <number> --repo <owner/repo> --json title,number
```
Generate: `<number>-<sanitized-title>`

**Linear:**
```typescript
mcp__linear-server__get_issue({ id: "<issue-id>" })
```
Generate: `<issue-id>-<sanitized-title>`

**Sanitization:**
- Lowercase, replace spaces with `-`, remove special chars, max 50 chars

## 3. Create Worktree

```bash
git worktree add .worktrees/<branch-name> -b <branch-name>
```

**Show:**
```
✓ Created git worktree
  - Branch: <branch-name>
  - Location: .worktrees/<branch-name>
```

## 4. Next Steps

### If no issue link:
```
✅ Worktree Initialized

Next: cd .worktrees/<branch-name>
```

### If issue link provided:
```
→ Starting planning...
/ctx.work.plan <issue-link>
```

---

# Examples

```
/ctx.work.init feature/add-auth
/ctx.work.init https://github.com/user/repo/issues/123
/ctx.work.init feature/auth https://github.com/user/repo/issues/123
```
