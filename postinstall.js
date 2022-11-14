const os = require('os');
const http = require('https');
const fs = require('fs');

const version = 'v0.0.6'
const baseUrl = 'https://github.com/saeschdivara/tunnel3-me-client/releases/download/' + version + '/'

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

const binaryName = 'tunnel3MeLocal_' + osPrefix + architecturePostfix
const binaryPath = 'bin/' + binaryName

if (!fs.existsSync('bin')) {
  fs.mkdirSync('bin')
}

const file = fs.createWriteStream(binaryPath);

http.get(baseUrl + binaryName, function(redirectResponse) {
  // follow Github redirect
  if (redirectResponse.statusCode === 302) {
    http.get(redirectResponse.headers.location, function(response) {

      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");

        fs.chmodSync(binaryPath, 0o0755);
      });
    });
  }
});
