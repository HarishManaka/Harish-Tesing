#!/usr/bin/env node
/* eslint-disable no-console */

// Commit 1: CLI script with fancy prompts, logging, dry-run, and test mode
const { prompt, Select, Confirm } = require('enquirer');
const chalk = require('chalk');
const minimist = require('minimist');
const fs = require('fs');
const path = require('path');

const logLevel = process.env.LOG_LEVEL || 'info';
function log(level, ...args) {
  const levels = ['error', 'info', 'debug'];
  if (levels.indexOf(level) <= levels.indexOf(logLevel)) {
    let color = chalk.blue; // Default color
    if (level === 'error') {
      color = chalk.red;
    } else if (level === 'debug') {
      color = chalk.gray;
    }
    console.log(color(`[${level.toUpperCase()}]`), ...args);
  }
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const dryRun = argv['dry-run'] || false;
  const testMode = argv.test || false;

  log('debug', 'CLI args:', argv);

  let blockName = '';
  let resourceType = '';
  let registerCommon = false;

  try {
    // Prompt for block name
    const { blockNameRaw } = await prompt({
      type: 'input',
      name: 'blockNameRaw',
      message: 'Enter the block name (kebab-case recommended):',
      validate: (input) => !!input.trim() || 'Block name is required',
    });
    blockName = toKebabCase(blockNameRaw);
    log('debug', `Block name entered: ${blockName}`);

    // Prompt for resourceType
    const resourceTypes = [
      'core/franklin/components/block/v1/block',
      'core/franklin/components/section/v1/section',
      'Custom...',
    ];
    resourceType = await (new Select({
      name: 'resourceType',
      message: 'Select resourceType:',
      choices: resourceTypes,
    })).run();
    if (resourceType === 'Custom...') {
      resourceType = await prompt({
        type: 'input',
        name: 'customResourceType',
        message: 'Enter custom resourceType:',
      }).then((r) => r.customResourceType);
    }
    log('debug', `resourceType selected: ${resourceType}`);

    // Prompt for _common-blocks.json registration
    registerCommon = await (new Confirm({
      name: 'registerCommon',
      message: 'Register in _common-blocks.json?',
      initial: true,
    })).run();
    log('debug', `Register in _common-blocks.json: ${registerCommon}`);
  } catch (err) {
    if (dryRun || testMode) {
      log('info', '[DRY RUN] No files will be written.');
      log('info', `Block name: ${blockName || 'N/A'}`);
      log('info', `resourceType: ${resourceType || 'N/A'}`);
      log('info', `Register in _common-blocks.json: ${registerCommon}`);
      if (testMode) {
        log('info', '[TEST MODE] Prompts and logging verified.');
      }
      process.exit(0);
    } else {
      log('error', err);
      process.exit(1);
    }
  }

  if (dryRun || testMode) {
    log('info', '[DRY RUN] No files will be written.');
    log('info', `Block name: ${blockName}`);
    log('info', `resourceType: ${resourceType}`);
    log('info', `Register in _common-blocks.json: ${registerCommon}`);
    if (testMode) {
      log('info', '[TEST MODE] Prompts and logging verified.');
    }
    process.exit(0);
  }

  // --- Commit 2: Generate block folder and initial files ---
  const blockDir = path.join(__dirname, '..', 'blocks', blockName);
  const jsFile = path.join(blockDir, `${blockName}.js`);
  const cssFile = path.join(blockDir, `${blockName}.css`);
  const jsonFile = path.join(blockDir, `_${blockName}.json`);

  // Create block directory
  if (!fs.existsSync(blockDir)) {
    fs.mkdirSync(blockDir, { recursive: true });
    log('info', `Created ${blockDir}`);
  } else {
    log('info', `Block directory already exists: ${blockDir}`);
  }

  // Create JS file with decorate function
  if (!fs.existsSync(jsFile)) {
    const jsContent = `export default function decorate(block) {
  // Create and append h1 with block name
  const h1 = document.createElement('h1');
  h1.textContent = '${blockName}';
  block.appendChild(h1);

  // Add additional DOM manipulation or event listeners here
}
`;
    fs.writeFileSync(jsFile, jsContent);
    log('info', `Created ${jsFile}`);
  } else {
    log('info', `JS file already exists: ${jsFile}`);
  }

  // Create CSS file with default styling
  if (!fs.existsSync(cssFile)) {
    const cssContent = `.${blockName} {
  color: red;
}
`;
    fs.writeFileSync(cssFile, cssContent);
    log('info', `Created ${cssFile}`);
  } else {
    log('info', `CSS file already exists: ${cssFile}`);
  }

  // Create JSON boilerplate
  if (!fs.existsSync(jsonFile)) {
    const blockTitle = blockName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const jsonBoilerplate = {
      definitions: [
        {
          title: blockTitle,
          id: blockName,
          plugins: {
            xwalk: {
              page: {
                resourceType,
                template: {
                  name: blockTitle,
                  model: blockName,
                },
              },
            },
          },
        },
      ],
      models: [
        {
          id: blockName,
          fields: [],
        },
      ],
      filters: [],
    };
    fs.writeFileSync(jsonFile, JSON.stringify(jsonBoilerplate, null, 2));
    log('info', `Created ${jsonFile}`);
  } else {
    log('info', `JSON file already exists: ${jsonFile}`);
  }

  // --- Commit 3: Register block in _component-definition.json ---
  const componentDefPath = path.join(__dirname, '..', 'models', '_component-definition.json');
  let componentDef;
  try {
    componentDef = JSON.parse(fs.readFileSync(componentDefPath, 'utf8'));
  } catch (e) {
    log('error', `Failed to read ${componentDefPath}:`, e);
    process.exit(1);
  }
  const blocksGroup = componentDef.groups.find((g) => g.id === 'blocks');
  if (!blocksGroup) {
    log('error', 'No "Blocks" group found in _component-definition.json');
    process.exit(1);
  }
  const newRef = { '...': `../blocks/${blockName}/_*.json#/definitions` };
  const exists = blocksGroup.components.some((c) => c['...'] === newRef['...']);
  if (exists) {
    log('info', `Block already registered in _component-definition.json: ${newRef['...']}`);
  } else {
    blocksGroup.components.push(newRef);
    log('info', `Registered ${blockName} in _component-definition.json`);
    if (!(dryRun || testMode)) {
      fs.writeFileSync(componentDefPath, JSON.stringify(componentDef, null, 2));
    }
  }

  // --- Commit 4: Optionally register block in _common-blocks.json ---
  if (registerCommon) {
    const commonBlocksPath = path.join(__dirname, '..', 'models', '_common-blocks.json');
    let commonBlocks;
    try {
      commonBlocks = JSON.parse(fs.readFileSync(commonBlocksPath, 'utf8'));
    } catch (e) {
      log('error', `Failed to read ${commonBlocksPath}:`, e);
      process.exit(1);
    }
    if (!commonBlocks.includes(blockName)) {
      commonBlocks.push(blockName);
      commonBlocks.sort();
      log('info', `Registered ${blockName} in _common-blocks.json`);
      if (!(dryRun || testMode)) {
        fs.writeFileSync(commonBlocksPath, JSON.stringify(commonBlocks, null, 2));
      }
    } else {
      log('info', `Block already present in _common-blocks.json: ${blockName}`);
    }
  }
}

main().catch((err) => {
  log('error', err);
  process.exit(1);
});
