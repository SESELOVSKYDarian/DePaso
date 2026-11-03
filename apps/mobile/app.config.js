// Extiende app.json. El archivo de Firebase no va a Git: en EAS llega por la variable de archivo
// GOOGLE_SERVICES_JSON; en la PC se usa ./google-services.json si existe.
const fs = require("node:fs");

module.exports = ({ config }) => {
  const local = "./google-services.json";
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? (fs.existsSync(local) ? local : undefined);
  return {
    ...config,
    android: { ...config.android, ...(googleServicesFile ? { googleServicesFile } : {}) },
  };
};
