const { withAndroidManifest } = require('expo/config-plugins');

// Permite a API HTTP da rede local nos testes do APK acadêmico.
module.exports = (config) => withAndroidManifest(config, (result) => {
  const application = result.modResults.manifest.application[0];
  application.$['android:usesCleartextTraffic'] = 'true';
  return result;
});
