You are assisting with validating context files.

# Arguments
$ARGUMENTS

# Your Task

Run mechanical validation, analyze results, and provide AI-powered semantic analysis for issues.

# What is Validate?

**Validation** has two layers:

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

# Workflow

## Step 1: Determine Scope

Parse arguments to determine what to validate:

- No arguments or `--all` → Validate both local and global
- `--local` → Validate local contexts only
- `--global` → Validate global contexts only
- `--diff` → Validate only changed files (based on git diff)

## Step 2: Execute Mechanical Validation

Run the appropriate command:

```bash
# Both (default)
ctx validate

# Local only
ctx validate --local

# Global only
ctx validate --global

# Diff mode (changed files only)
ctx validate --diff
```

## Step 3: Parse Validation Results

The CLI will report:

**Valid contexts**: No issues
**Warnings**: Target files changed (checksum mismatch)
**Errors**: Missing files, invalid YAML, missing required fields

## Step 4: AI Semantic Analysis (for Warnings)

For each warning where target file changed:

1. **Read current context file**
2. **Read current target file**
3. **Check git diff**:
   ```bash
   git diff HEAD -- [target-file]
   ```
4. **Analyze**: Does the code change require context update?

### When Update is Needed:
- Public API changed (new functions, modified signatures)
- New use cases emerged
- New constraints/boundaries added
- Functionality removed

### When Update is NOT Needed:
- Internal refactoring
- Code formatting
- Implementation details (usage stays same)

## Step 5: Present Results

### If All Valid:

```markdown
## ✓ Validation Passed

**Scope**: [Local / Global / Both / Diff]

**Results**:
- ✓ X contexts validated
- ✓ All schemas valid
- ✓ All checksums match
- ✓ All files exist
```

### If Warnings Found:

```markdown
## ⚠️ Validation Warnings

**Scope**: [Local / Global / Both]

**Results**:
- ✓ X contexts: valid
- ⚠️ Y contexts: target files changed

---

### Changed Files Analysis

#### 📄 src/utils/url.ts

**Changes detected**:
[Summary of git diff]

**Current context**:
- use_when: [current scenarios]
- boundary: [current constraints]

**Assessment**: ✅ Update needed / ⏭️ No update needed

**Reason**: [Explain why]

**Recommended action**:
[If update needed, provide specific suggestions]

---

#### 📄 src/services/payment.ts

[Similar analysis]

---

**Summary**:
- X files need context updates
- Y files are OK (internal changes only)

**Next steps**:
[List specific actions user should take]
```

### If Errors Found:

```markdown
## ❌ Validation Errors

**Results**:
- ✓ X contexts: valid
- ⚠️ Y contexts: warnings
- ❌ Z contexts: errors

**Errors**:

1. **src/old/deprecated.ctx.yml**
   - Issue: Target file not found
   - Target: /src/old/deprecated.ts
   - Action: Remove context file or update target path

2. **src/utils/broken.ctx.yml**
   - Issue: Invalid YAML syntax (line 5)
   - Action: Fix YAML syntax errors

3. **src/components/Button.ctx.yml**
   - Issue: Missing required field 'use_when'
   - Action: Add use_when scenarios

**Next steps**:
1. Fix errors listed above
2. Run `/ctx.sync` to update registry
3. Run `/ctx.validate` again
```

# Validation Modes

## Full Validation (Default)
- Validates ALL contexts
- Comprehensive health check
- Slower but complete

## Diff Validation (`--diff`)
- Validates only changed files (based on git)
- Fast for daily workflow
- Run this after coding sessions

```bash
User: /ctx.validate --diff
# Only checks files changed in git
```

# Important Rules

1. **Run mechanical validation first** - let CLI do structural checks
2. **AI analyzes warnings** - focus on files that changed
3. **Be conservative** - don't flag updates for internal refactoring
4. **Be specific** - provide exact update suggestions
5. **Guide user** - clear next steps

# Reference Documents

- Template: `ctx/templates/local-context.yml`
- Local registry: `ctx/.local-context-registry.yml`
- Global registry: `ctx/.global-context-registry.yml`

# Example Interaction

```
User: /ctx.validate

AI:
Running validation...

## ⚠️ Validation Warnings

**Scope**: Local + Global

**Results**:
- ✓ 42 contexts: valid
- ⚠️ 3 contexts: target files changed

---

### Changed Files Analysis

#### 📄 src/utils/url.ts

**Changes detected**:
- Added `validateUrl(url: string, options?: ValidationOptions)` with new optional parameter
- Added new export `UrlValidationError` class

**Current context**:
- use_when:
  - "Validating user-provided URLs"
  - "Parsing URL components"
- boundary:
  - "Regex-based validation only"

**Assessment**: ⏭️ No update needed

**Reason**: New optional parameter doesn't change usage scenarios. The when/why/boundary remain the same - this is backward compatible enhancement.

---

#### 📄 src/services/payment.ts

**Changes detected**:
- Added `processRefund(orderId: string, amount: number)` function
- Modified `processPayment()` to accept optional `timeout` parameter

**Assessment**: ✅ Update needed

**Reason**: New refund capability adds a use case, and configurable timeout affects boundary constraints.

**Recommended updates**:

**use_when** - Add:
- "Processing refunds for cancelled orders"

**boundary** - Update:
- Change "PG API timeout: 30 seconds" to "Timeout: configurable, default 30s, max 60s"

Would you like me to apply these updates? (yes/no/edit)

---

#### 📄 src/components/Button.tsx

**Changes detected**:
- Renamed `onClick` to `onPress` (internal prop name)
- Refactored styling logic

**Assessment**: ⏭️ No update needed

**Reason**: Internal implementation changes. Usage scenarios and boundaries unchanged.

---

**Summary**:
- 1 file needs context update (payment.ts)
- 2 files are OK (internal changes only)

**Next steps**:
1. Approve or edit the suggested update for payment.ts
2. I'll apply the changes and sync the registry
```
