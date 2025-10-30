import chalk from 'chalk';
import { isProjectInitialized } from '../lib/fileUtils.js';
import { readLocalRegistry, readGlobalRegistry } from '../lib/registry.js';
import { validateLocalContextEntry, validateGlobalContextEntry } from '../lib/validation.js';
import { ValidateOptions, ValidationResult, ValidationIssue } from '../lib/types.js';

export async function validateCommand(options: ValidateOptions = {}) {
  try {
    // Check if project is initialized
    const initialized = await isProjectInitialized();
    if (!initialized) {
      console.error(chalk.red('✗ Error: Project not initialized.'));
      console.log(chalk.gray("  Run 'ctx init' first to initialize context management."));
      process.exit(1);
    }

    const projectRoot = process.cwd();

    // Determine what to validate
    const validateLocal = options.local || (!options.local && !options.global);
    const validateGlobal = options.global || (!options.local && !options.global);

    const result: ValidationResult = {
      total: 0,
      valid: 0,
      warnings: 0,
      errors: 0,
      issues: [],
    };

    // Validate local contexts
    if (validateLocal) {
      console.log(chalk.blue('Validating local contexts...'));
      await validateLocalContexts(projectRoot, result);
    }

    // Validate global contexts
    if (validateGlobal) {
      console.log(chalk.blue('Validating global contexts...'));
      await validateGlobalContexts(projectRoot, result);
    }

    // Print report
    printValidationReport(result);

    // Exit with appropriate code
    process.exit(result.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error(chalk.red('✗ Error during validation:'), error);
    process.exit(1);
  }
}

/**
 * Validate all local contexts
 */
async function validateLocalContexts(
  projectRoot: string,
  result: ValidationResult
): Promise<void> {
  const registry = await readLocalRegistry(projectRoot);

  for (const [targetPath, entry] of Object.entries(registry.contexts)) {
    result.total++;

    try {
      const issue = await validateLocalContextEntry(projectRoot, targetPath, entry);

      if (issue) {
        result.issues.push(issue);
        if (issue.status === 'error') {
          result.errors++;
        } else {
          result.warnings++;
        }
      } else {
        result.valid++;
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Unexpected error validating ${entry.source}: ${error}`));
      result.errors++;
      result.issues.push({
        contextPath: entry.source,
        targetPath,
        status: 'error',
        checks: [
          {
            type: 'schema',
            passed: false,
            message: `Unexpected validation error: ${error}`,
          },
        ],
      });
    }
  }
}

/**
 * Validate all global contexts
 */
async function validateGlobalContexts(
  projectRoot: string,
  result: ValidationResult
): Promise<void> {
  const registry = await readGlobalRegistry(projectRoot);

  for (const [documentPath, entry] of Object.entries(registry.contexts)) {
    result.total++;

    try {
      const issue = await validateGlobalContextEntry(projectRoot, documentPath, entry);

      if (issue) {
        result.issues.push(issue);
        if (issue.status === 'error') {
          result.errors++;
        } else {
          result.warnings++;
        }
      } else {
        result.valid++;
      }
    } catch (error) {
      console.error(chalk.yellow(`⚠️  Unexpected error validating ${entry.source}: ${error}`));
      result.errors++;
      result.issues.push({
        contextPath: entry.source,
        status: 'error',
        checks: [
          {
            type: 'schema',
            passed: false,
            message: `Unexpected validation error: ${error}`,
          },
        ],
      });
    }
  }
}

/**
 * Print validation report
 */
function printValidationReport(result: ValidationResult): void {
  console.log();
  console.log(chalk.blue.bold('Validation Report'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log();

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(chalk.gray(`  Total contexts: ${result.total}`));
  console.log(chalk.green(`  ✓ Valid: ${result.valid}`));

  if (result.warnings > 0) {
    console.log(chalk.yellow(`  ⚠ Warnings: ${result.warnings}`));
  }

  if (result.errors > 0) {
    console.log(chalk.red(`  ✗ Errors: ${result.errors}`));
  }

  console.log();

  // Issues detail
  if (result.issues.length > 0) {
    const errors = result.issues.filter((i) => i.status === 'error');
    const warnings = result.issues.filter((i) => i.status === 'warning');

    // Errors first
    if (errors.length > 0) {
      console.log(chalk.red.bold('Errors:'));
      console.log();
      errors.forEach((issue, index) => {
        printIssue(issue, index + 1);
      });
    }

    // Then warnings
    if (warnings.length > 0) {
      console.log(chalk.yellow.bold('Warnings:'));
      console.log();
      warnings.forEach((issue, index) => {
        printIssue(issue, index + 1);
      });
    }
  } else {
    console.log(chalk.green.bold('✓ All contexts are valid!'));
    console.log();
  }

  // Exit status message
  if (result.errors > 0) {
    console.log(chalk.red('Validation failed. Please fix errors above.'));
  } else if (result.warnings > 0) {
    console.log(chalk.yellow('Validation passed with warnings.'));
  } else {
    console.log(chalk.green('✓ Validation passed!'));
  }
  console.log();
}

/**
 * Print a single validation issue
 */
function printIssue(issue: ValidationIssue, index: number): void {
  const icon = issue.status === 'error' ? chalk.red('✗') : chalk.yellow('⚠');

  console.log(`${index}. ${icon} ${chalk.bold(issue.contextPath)}`);

  if (issue.targetPath) {
    console.log(chalk.gray(`   Target: ${issue.targetPath}`));
  }

  issue.checks.forEach((check) => {
    if (!check.passed && check.message) {
      console.log(chalk.gray(`   ${check.code ? `[${check.code}] ` : ''}${check.message}`));
      if (check.suggestion) {
        console.log(chalk.gray(`   → ${check.suggestion}`));
      }
    }
  });

  console.log();
}
