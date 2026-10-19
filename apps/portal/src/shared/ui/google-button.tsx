import {useEffect, useRef, useState} from 'react';

import {initGoogleIdentity, loadGoogleIdentity} from '@/shared/lib';

/** Ширина кнопки Google в пикселях (GIS принимает только число). */
const BUTTON_WIDTH = 320;

export interface GoogleButtonProps {
  clientId: string;
  text: 'signin_with' | 'signup_with' | 'continue_with';
  /** Получает ID token после выбора аккаунта Google. */
  onCredential: (idToken: string) => void;
}

/**
 * Стандартная кнопка Google (её рисует сам Google Identity Services — так требуют
 * правила бренда). Скрипт GIS грузится при первом показе кнопки.
 */
export function GoogleButton({
  clientId,
  text,
  onCredential,
}: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  // Свежий колбэк без повторной инициализации и перерисовки кнопки.
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || container === null) {
          return;
        }
        initGoogleIdentity(clientId, idToken => {
          onCredentialRef.current(idToken);
        });
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          locale: 'ru',
          width: BUTTON_WIDTH,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, text]);

  if (status === 'error') {
    return (
      <p className="text-sm text-destructive" role="alert">
        Не удалось загрузить вход через Google.
      </p>
    );
  }
  return (
    <div
      ref={containerRef}
      className="min-h-10"
      aria-busy={status === 'loading'}
    />
  );
}
