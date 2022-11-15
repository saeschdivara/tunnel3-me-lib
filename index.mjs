import fetch from 'node-fetch';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import os from 'os';

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Function to execute exe
 * @param {string} fileName The name of the executable file to run.
 * @param {string[]} params List of string arguments.
 * @param {string} path Current working directory of the child process.
 */
function execute(fileName, params, path) {
  const promise = new Promise((resolve, reject) => {
    execFile(fileName, params, { cwd: path }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
  return promise;
}

(async function() {
  const localAssets = !!process.env.LOCAL_ASSETS;
  const port = process.env.WEBAPP_PORT;
  const assetsPort = process.env.ASSETS_PORT;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const username = process.env.USERNAME || process.env.USER;
  const subDomainApp = `${process.env.npm_package_name}-${username.replace(
    '.',
    '-'
  )}-bitvoodoo`;

  const webAppUrl = `https://${subDomainApp}.tunnel3.me`;
  const assetsUrl = `https://assets-${subDomainApp}.tunnel3.me`;

  const hostCreationResult = await fetch(
    `https://config.tunnel3.me/create-host/${subDomainApp}`
  ).then(r => r.json());
  const websocketPort = hostCreationResult.result;

  // make sure we aren't too fast trying to connect to the websocket server
  await sleep(5000);

  const assetsConfigFile = `
module.exports = {
  domain: '${assetsUrl.replace('https://', '')}',
  baseUrl: '${assetsUrl}',
  suffix: ''
};
`;

  fs.writeFile(
    `${__dirname}/../../../src/main/frontend/build/ngrok.config.js`,
    assetsConfigFile,
    err => {
      // throws an error, you could also catch it here
      if (err) throw err;
    }
  );

  const appConfigFile = `
addon:
  base-url: ${webAppUrl}
  dev-assets-base-url: ${localAssets ? 'http://localhost:' + assetsPort : assetsUrl}
`;

  fs.writeFile(
    `${__dirname}/../../../src/main/resources/application-ngrok.yml`,
    appConfigFile,
    err => {
      // throws an error, you could also catch it here
      if (err) throw err;
    }
  );

  let osPrefix;

  if (os.platform() === 'linux') {
    osPrefix = 'ubuntu'
  }
  else if (os.platform() === 'darwin') {
    osPrefix = 'mac'
  }
  else if (os.platform() === 'win32') {
    osPrefix = 'windows.exe'
  }

  let architecturePostfix = '';

  if (os.arch() === 'arm64') {
    architecturePostfix = '_arm';
  }

  const binaryName = 'tunnel3MeLocal_' + osPrefix + architecturePostfix;

  console.log(`Confluence App Install-URL: ${webAppUrl}/atlassian-connect.json`);

  const result = await execute(
    `${__dirname}/bin/${binaryName}`,
    [`ws://tunnel3.me:${websocketPort}/`, port],
    ''
  );

  console.error(result);
})();
