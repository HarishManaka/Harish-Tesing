const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const watchDirectories = ['blocks', 'models'];
const watchPattern = /\.json$/;

console.info('Watching for JSON file changes in blocks and models folders...');

let debounceTimer;
const debounceDelay = 1000;

function runBuildJson() {
  console.info('Running npm run build:json...');
  exec('npm run build:json', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.info(stdout);
    console.info('Build completed successfully');
  });
}

function watchFiles(dir) {
  fs.readdir(dir, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dir}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory() && !file.name.startsWith('.')) {
        watchFiles(filePath);
      } else if (file.isFile() && watchPattern.test(file.name)) {
        // console.info(`Watching: ${filePath}`);
        fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
          if (curr.mtime !== prev.mtime) {
            console.info(`Change detected in: ${filePath}`);
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(runBuildJson, debounceDelay);
          }
        });
      }
    });
  });
}

// Watch only blocks and models directories
watchDirectories.forEach((dirName) => {
  const dirPath = path.join(process.cwd(), dirName);
  if (fs.existsSync(dirPath)) {
    // console.info(`Watching directory: ${dirPath}`);
    watchFiles(dirPath);
  } else {
    console.warn(`Directory not found: ${dirPath}`);
  }
});

process.on('SIGINT', () => {
  console.info('\nStopping file watcher...');
  process.exit(0);
});
