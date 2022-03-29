const { doSign } = require('app-builder-lib/out/codeSign/windowsCodeSign');

exports.default = async function(configuration, packager) {
  // skip sign for .appx (pacckage for Windows Store)
  // Windows store will sign on one's own and can't take signed app
  // https://www.electron.build/configuration/appx#appx-package-code-signing
  if (configuration.path.endsWith(".appx")) {
    return
  }

  return await doSign(configuration, packager)
};