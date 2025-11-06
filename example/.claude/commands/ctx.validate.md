---
description: Validate context files and analyze changes
argument-hint: [--local|--global|--diff]
---

You are assisting with validating context files.

# Arguments

**$ARGUMENTS**: Optional flags (default: validate both)
- `--local` - Validate local contexts only
- `--global` - Validate global contexts only
- `--diff` - Validate only changed files (based on git)
- (no args) - Validate both local and global

# Your Task

Run mechanical validation, analyze results, and provide AI-powered semantic analysis for warnings.

# Workflow

## Step 1: Determine Scope

Parse $ARGUMENTS to determine flags:
- No args → `ctx validate`
- `--local` → `ctx validate --local`
- `--global` → `ctx validate --global`
- `--diff` → `ctx validate --diff`

## Step 2: Execute Validation

Run the appropriate `ctx validate` command.

## Step 3: Parse Results

The CLI reports three types:
- **Valid**: No issues
- **Warnings**: Target files changed (checksum mismatch)
- **Errors**: Missing files, invalid YAML, missing required fields

## Step 4: AI Semantic Analysis (for Warnings only)

For each warning where target file changed:

1. Read current context file
2. Read current target file
3. Check git diff: `git diff HEAD -- [target-file]`
4. Analyze: Does the code change require context update?

**Update needed when:**
- Public API changed (new functions, modified signatures)
- New use cases emerged
- New constraints/boundaries added
- Functionality removed

**Update NOT needed when:**
- Internal refactoring
- Code formatting
- Implementation details (usage stays same)

## Step 5: Present Results

### If All Valid:
```markdown
✓ Validation Passed

Scope: [Local / Global / Both / Diff]
Results: X contexts validated, all valid
```

### If Warnings:
```markdown
⚠️ Validation Warnings

Results:
• ✓ X contexts: valid
• ⚠️ Y contexts: target files changed

---

Changed Files Analysis

📄 [file-path]

Changes: [git diff summary]
Current context: [use_when, boundary summary]
Assessment: ✅ Update needed / ⏭️ No update needed
Reason: [explain why]

[If update needed]
Recommended updates:
• use_when: Add "[new scenario]"
• boundary: Update "[constraint]"

---

Summary:
• X files need updates
• Y files OK (internal changes)

Next steps: [specific actions]
```

### If Errors:
```markdown
❌ Validation Errors

Results:
• ✓ X contexts: valid
• ⚠️ Y contexts: warnings
• ❌ Z contexts: errors

Errors:

1. [file-path]
   • Issue: [error description]
   • Action: [fix instruction]

Next steps:
1. Fix errors listed above
2. Run /ctx.sync
3. Run /ctx.validate again
```

# What Validate Does (Background Info)

**Two-layer validation:**

1. **Mechanical** (CLI does this):
   - Schema validation (YAML structure)
   - Checksum validation (file changes)
   - Required fields check
   - File existence

2. **Semantic** (AI does this):
   - Analyze WHY files changed
   - Determine if context update is needed
   - Propose specific updates
   - Guide user to fix issues

**Validation modes:**
- **Full** (default): Validates ALL contexts, comprehensive but slower
- **Diff** (`--diff`): Only changed files (git-based), fast for daily workflow

**Note:** Use `--diff` after coding sessions for quick validation.

# Important Rules

1. **Run mechanical validation first** - Let CLI do structural checks
2. **AI analyzes warnings** - Focus on files that changed
3. **Be conservative** - Don't flag updates for internal refactoring
4. **Be specific** - Provide exact update suggestions
5. **Guide user** - Clear next steps

# Reference Documents

- Template: `ctx/templates/local-context.yml`
- Local registry: `ctx/local-context-registry.yml`
- Global registry: `ctx/global-context-registry.yml`

# Example Interactions

```
User: /ctx.validate

AI:
[Runs: ctx validate]

✓ Validation Passed

Scope: Local + Global
Results: 45 contexts validated, all valid
```

```
User: /ctx.validate --diff

AI:
[Runs: ctx validate --diff]

⚠️ Validation Warnings

Results:
• ✓ 8 contexts: valid
• ⚠️ 2 contexts: target files changed

---

Changed Files Analysis

📄 src/services/payment.ts

Changes:
• Added processRefund(orderId: string, amount: number)
• Modified processPayment() timeout parameter (optional)

Current context:
• use_when: Processing payments, handling webhooks
• boundary: 30s timeout, Stripe API only

Assessment: ✅ Update needed

Reason: New refund capability adds use case, configurable timeout affects constraints.

Recommended updates:
• use_when: Add "Processing refunds for cancelled orders"
• boundary: Update "Timeout: configurable, default 30s, max 60s"

---

📄 src/utils/url.ts

Changes:
• Added optional parameter to validateUrl()
• Internal refactoring

Assessment: ⏭️ No update needed

Reason: Backward compatible enhancement, usage scenarios unchanged.

---

Summary:
• 1 file needs update (payment.ts)
• 1 file OK (internal changes)

Next steps:
1. Review suggested update for payment.ts
2. Apply changes and run /ctx.sync
```

```
User: /ctx.validate

AI:
[Runs: ctx validate]

❌ Validation Errors

Results:
• ✓ 42 contexts: valid
• ❌ 3 contexts: errors

Errors:

1. src/old/deprecated.ctx.yml
   • Issue: Target file not found
   • Action: Remove context file or update target path

2. src/utils/broken.ctx.yml
   • Issue: Invalid YAML syntax (line 5)
   • Action: Fix YAML syntax errors

3. src/components/Button.ctx.yml
   • Issue: Missing required field 'use_when'
   • Action: Add use_when scenarios

Next steps:
1. Fix errors listed above
2. Run /ctx.sync to update registry
3. Run /ctx.validate again
```
