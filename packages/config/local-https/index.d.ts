// Типы для local-https/index.js: конфиги приложений проверяются tsc без allowJs.

/** Локальный домен портала из .env корня репозитория (переменная окружения важнее файла). */
export function localDomain(): string;

/** Настройки `server` dev-сервера: HTTPS с сертификатами mkcert на хосте приложения. */
export function localHttpsServer(options?: {subdomain?: string}): {
  host: string;
  https: {cert: string; key: string};
};
