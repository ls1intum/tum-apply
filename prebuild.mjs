/**
 * This script is executed before the Angular CLI's build script is executed.
 * It adds environment variables to the environment file and merges the i18n files.
 * This way, we don't need a webpack configuration file: It replaces
 * - webpack.DefinePlugin and
 * - MergeJsonWebpackPlugin
 */
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { hashElement } from 'folder-hash';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local file only if no env variables are set (e.g. in CI they come from Docker ENV)
if (!process.env.KEYCLOAK_URL) {
  const envFiles = ['.env.local.local', '.env.local', '.env.local.test', '.env.local.prod'];
  const selectedEnvFile = envFiles.find(f => fs.existsSync(path.resolve(__dirname, f)));
  if (selectedEnvFile) {
    dotenv.config({ path: path.resolve(__dirname, selectedEnvFile) });
    console.log(`[prebuild] Loaded environment from ${selectedEnvFile}`);
  } else {
    console.error(
      '[prebuild.mjs] No .env.local file found. Please add the file to the project root or set the environment variables manually.',
    );
    process.exit(1);
  }
}

const languagesHash = await hashElement(path.resolve(__dirname, 'src', 'main', 'webapp', 'i18n'), {
  algo: 'md5',
  encoding: 'hex',
  files: { include: ['*.json'] },
});

// =====================
// Environment variables
// =====================

/*
 * Needed for client compilations with docker compose, where the 'APP_VERSION' property isn't injected by gradle.
 *
 * Returns the inferred APP_VERSION from 'build.gradle', or 'DEV' if this couldn't be retrieved
 */
function inferVersion() {
  let version = 'DEV';

  try {
    let data = fs.readFileSync('build.gradle', 'UTF-8');

    version = data.match(/\nversion\s=\s"(.*)"/);

    version = version[1] ?? 'DEV';
  } catch (error) {
    console.log("Error while retrieving 'APP_VERSION' property", error);
  }

  return version;
}

// --develop flag is used to enable debug mode
const args = process.argv.slice(2);
const developFlag = args.includes('--develop');
const keycloakConfig = {
  url: process.env.KEYCLOAK_URL,
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  enableLogging: process.env.KEYCLOAK_ENABLE_LOGGING === 'true',
};
const environmentConfig = `// Don't change this file manually, it will be overwritten by the build process!
export const __DEBUG_INFO_ENABLED__ = ${developFlag};
export const __VERSION__ = '${process.env.APP_VERSION || inferVersion()}';
export const I18N_HASH = '${languagesHash.hash}';
export const environment = {
  production: ${!developFlag},
  keycloak: {
    url: '${keycloakConfig.url}',
    realm: '${keycloakConfig.realm}',
    clientId: '${keycloakConfig.clientId}',
    enableLogging: ${keycloakConfig.enableLogging},
  },
};
`;
fs.writeFileSync(path.resolve(__dirname, 'src', 'main', 'webapp', 'app', 'environments', 'environment.override.ts'), environmentConfig);

// =====================
// i18n merging
// =====================

const groups = [
  { folder: './src/main/webapp/i18n/en', output: './src/main/webapp/i18n/en.json' },
  { folder: './src/main/webapp/i18n/de', output: './src/main/webapp/i18n/de.json' },
];

const isObject = obj => obj && typeof obj === 'object';

function deepMerge(target, source) {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  for (const key in source) {
    // prevent prototype pollution
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (key === '__proto__' || key === 'constructor') continue;

    const targetValue = target[key];
    const sourceValue = source[key];

    if (isObject(sourceValue)) {
      target[key] = deepMerge(targetValue || {}, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  }

  return target;
}

for (const group of groups) {
  try {
    // create output folder if it doesn't exist
    fs.mkdirSync(path.dirname(group.output), { recursive: true });

    const files = fs.readdirSync(group.folder).filter(file => file.endsWith('.json'));

    const mergedContent = files.reduce((acc, file) => {
      const content = JSON.parse(fs.readFileSync(path.resolve(group.folder, file)).toString());
      return deepMerge(acc, content);
    }, {});

    await fs.promises.writeFile(group.output, JSON.stringify(mergedContent));
  } catch (error) {
    console.error(`Error merging JSON files for ${group.output}:`, error);
  }
}
