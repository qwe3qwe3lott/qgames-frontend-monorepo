const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let loading: Promise<void> | undefined;

/**
 * Загружает скрипт Google Identity Services один раз и только по требованию —
 * в основной бандл он не попадает. Неудачную загрузку можно повторить.
 */
export function loadGoogleIdentity(): Promise<void> {
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      script.remove();
      loading = undefined;
      reject(new Error('Не удалось загрузить Google Identity Services'));
    };
    document.head.append(script);
  });
  return loading;
}

/**
 * Настраивает вход через Google: `onCredential` получает ID token, который
 * бэкенд проверяет по JWKS Google (`POST /api/auth/google/login`,
 * `/google/register`, привязка в профиле).
 */
export function initGoogleIdentity(
  clientId: string,
  onCredential: (idToken: string) => void,
): void {
  google.accounts.id.initialize({
    client_id: clientId,
    callback: response => {
      onCredential(response.credential);
    },
    ux_mode: 'popup',
    use_fedcm_for_button: true,
  });
}
