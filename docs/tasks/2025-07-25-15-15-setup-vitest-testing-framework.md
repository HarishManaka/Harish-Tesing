# Task: Setup Vitest and Testing Library Framework for AEM Project

## Commit 1: feat: configure vitest testing framework and dependencies [docs/tasks/2025-07-25-15-15-setup-vitest-testing-framework.md]
**Description:**
Install and configure Vitest as the primary testing framework with @testing-library/dom for DOM testing capabilities. Create base configuration files including `vitest.config.js` at project root with proper ES modules support, test environment setup for jsdom, and coverage configuration. Update `package.json` with test scripts including `test`, `test:watch`, `test:coverage`, and `test:ui`. Configure Vitest to work with the existing ES modules structure used by AEM blocks (`.js` files with ES6 imports). Set up test file patterns to match `**/*.test.js` and `**/*.spec.js` in blocks, scripts, and utils directories. Exclude commerce-related blocks from test patterns.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm run test -- --reporter=verbose --run`
   * **Expected Outcome:** Vitest runs successfully with no tests found message, showing configuration is properly loaded and framework is operational
2. **Logging Check:**
   * **Action:** Run `npm run test:coverage` to verify coverage reporting setup
   * **Expected Log:** Console output showing "% Coverage report generated at coverage/" and coverage thresholds configuration
   * **Toggle Mechanism:** Vitest built-in reporting with `--reporter=verbose` flag for detailed output

---

## Commit 2: test: create utilities and helper functions for DOM testing [docs/tasks/2025-07-25-15-15-setup-vitest-testing-framework.md]
**Description:**
Create `tests/utils/test-helpers.js` with utility functions for testing AEM blocks and components. Include functions like `createBlockElement()` for generating mock block DOM structures, `loadBlockCSS()` for styling injection during tests, `mockAEMEnvironment()` for simulating AEM context variables, and `waitForBlockDecoration()` for async block decoration testing. Create `tests/setup.js` for global test configuration including jsdom environment setup, global mocks for AEM-specific functions from `scripts/aem.js` (such as `decorateBlocks`, `decorateButtons`, `decorateIcons`), and cleanup utilities. Configure import path aliases in vitest config to match project structure (`@blocks/*`, `@scripts/*`, `@utils/*`).

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm test tests/utils/test-helpers.test.js`
   * **Expected Outcome:** All utility function tests pass, verifying DOM manipulation helpers, mock creation functions, and AEM environment simulation work correctly
2. **Logging Check:**
   * **Action:** Run test with debug logging enabled via `DEBUG=test npm test`
   * **Expected Log:** Debug output showing "Test helpers initialized", "Mock AEM environment created", and "Block element structure validated"
   * **Toggle Mechanism:** Environment variable `DEBUG=test` enables detailed test execution logging

---

## Commit 3: test: implement block component testing with hero and cards blocks [docs/tasks/2025-07-25-15-15-setup-vitest-testing-framework.md]
**Description:**
Create comprehensive test suites for core AEM blocks starting with hero block (`blocks/hero/hero.test.js`) and cards block (`blocks/cards/cards.test.js`). Test DOM manipulation, class assignment logic, content structure validation, and responsive behavior. Mock dependencies from `scripts/aem.js` including `decorateButtons`, `decorateIcons`, and `loadCSS`. For hero block, implement tests for different content scenarios (4-element structure vs flexible assignment), heading detection logic, and CTA link validation. For cards block, test card generation, layout handling, and content parsing. Create test fixtures in `tests/fixtures/` with various block markup examples for different scenarios.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm test blocks/{hero,cards}/*.test.js --coverage`
   * **Expected Outcome:** Block tests achieve >85% code coverage, all test cases pass including DOM structure validation, class assignment verification, and content analysis logic for both hero and cards blocks
2. **Logging Check:**
   * **Action:** Enable test debugging with `LOG_LEVEL=debug npm test blocks/hero/hero.test.js`
   * **Expected Log:** Detailed logs showing "Block decoration started", "Content elements analyzed", "Class assignments completed", and "Block decoration finished"
   * **Toggle Mechanism:** Environment variable `LOG_LEVEL=debug` controls test execution verbosity

---

## Commit 4: test: add core scripts and utilities testing [docs/tasks/2025-07-25-15-15-setup-vitest-testing-framework.md]
**Description:**
Create test suites for core AEM scripts functionality in `tests/scripts/aem.test.js` and `tests/scripts/scripts.test.js`. Test core AEM functions like `decorateBlocks`, `decorateButtons`, `decorateIcons`, `loadHeader`, `loadFooter`, and utility functions like `toCamelCase`, `toClassName`, `readBlockConfig`. Mock DOM manipulation functions and test block decoration workflows. Create tests for `scripts/configs.js` configuration management including `initializeConfig`, `getRootPath`, and environment-specific configuration loading. Focus on testing the core AEM functionality while excluding any commerce or dropin-related code paths.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm run test:scripts -- --reporter=verbose`
   * **Expected Outcome:** Scripts tests pass with proper mocking of DOM functions, AEM core functionality verified, and configuration loading validated
2. **Logging Check:**
   * **Action:** Run scripts tests with debug logging via `AEM_DEBUG=true npm run test:scripts`
   * **Expected Log:** AEM logs showing "Block decoration initialized", "Configuration loaded", "Header/Footer loading completed", and "Scripts initialization finished"
   * **Toggle Mechanism:** Environment variable `AEM_DEBUG=true` enables AEM-specific test logging

---

## Commit 5: docs: create comprehensive testing documentation and CI integration [docs/tasks/2025-07-25-15-15-setup-vitest-testing-framework.md]
**Description:**
Create `docs/TESTING_GUIDE.md` with comprehensive documentation covering testing patterns, block testing guidelines, mock strategies, and best practices for AEM components. Include examples of testing different block types (hero, cards, accordion, tabs), async operation testing, and AEM core functionality testing. Update project README.md with testing section including quick start commands and testing workflow. Create GitHub Actions workflow file `.github/workflows/test.yml` for automated testing on PR creation and push to main branch. Configure workflow to run tests with coverage reporting, upload coverage artifacts, and validate test thresholds. Add npm scripts for different testing scenarios including `test:blocks`, `test:scripts`, `test:utils`.

**Verification:**
1. **Automated Test(s):**
   * **Command:** `npm run test:ci -- --coverage --reporter=junit --outputFile=test-results.xml`
   * **Expected Outcome:** CI-compatible test execution with JUnit XML output, coverage reports generated, and all test suites passing with exit code 0
2. **Logging Check:**
   * **Action:** Review GitHub Actions workflow simulation locally with `act` or manual workflow file validation
   * **Expected Log:** Workflow logs showing "Tests completed successfully", "Coverage threshold met: [percentage]%", and "Test artifacts uploaded"
   * **Toggle Mechanism:** GitHub Actions environment with workflow logging and npm script `--reporter` flags for CI output formatting
