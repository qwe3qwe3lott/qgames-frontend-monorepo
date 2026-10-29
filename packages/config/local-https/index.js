// @ts-check
// Локальный HTTPS-домен для dev-сервера Rsbuild и e2e, как в проде (adr/c4/deployment.md, раздел «Локальный стенд»):
// портал — https://<LOCAL_DOMAIN>:3000, админка — https://admin.<LOCAL_DOMAIN>:3001.
// LOCAL_DOMAIN — из .env корня репозитория, сертификаты mkcert — docker/certs/ (те же, что у nginx). Настройка — README.md.
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const CERT = `${ROOT}docker/certs/cert.pem`;
const KEY = `${ROOT}docker/certs/key.pem`;

/**
 * Локальный домен портала из .env корня репозитория (переменная окружения важнее файла).
 * @returns {string}
 */
export function localDomain() {
  const envFile = `${ROOT}.env`;
  if (process.env['LOCAL_DOMAIN'] === undefined && existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
  const domain = process.env['LOCAL_DOMAIN'];
  if (domain === undefined || domain === '') {
    throw new Error(
      'Не задан LOCAL_DOMAIN: скопируйте .env.example в .env в корне репозитория (README.md, «Подготовка»)',
    );
  }
  return domain;
}

/**
 * Настройки `server` dev-сервера: HTTPS с сертификатами mkcert на хосте приложения.
 * @param {{subdomain?: string}} [options] subdomain — поддомен LOCAL_DOMAIN (админка — `admin`).
 * @returns {{host: string, https: {cert: string, key: string}}}
 */
export function localHttpsServer({subdomain} = {}) {
  const domain = localDomain();
  if (!existsSync(CERT) || !existsSync(KEY)) {
    throw new Error(
      'Нет сертификатов docker/certs/cert.pem и key.pem: выпустите их mkcert (README.md, «Подготовка»)',
    );
  }
  return {
    // Хост из server.host Rsbuild разрешает всегда (проверка Host), он же в адресе в консоли.
    host: subdomain === undefined ? domain : `${subdomain}.${domain}`,
    https: {cert: readFileSync(CERT, 'utf8'), key: readFileSync(KEY, 'utf8')},
  };
}
