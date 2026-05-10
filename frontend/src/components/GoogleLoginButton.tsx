import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    google?: any;
    __riselabGoogleIdentityClientId?: string;
  }
}

interface GoogleLoginButtonProps {
  onCredential(credential: string): void;
}

export function GoogleLoginButton({ onCredential }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasInitializedRef = useRef(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const existingScript = document.querySelector('script[data-google-identity="true"]') as HTMLScriptElement | null;

    const initialize = () => {
      if (!window.google || !containerRef.current || hasInitializedRef.current) {
        return;
      }

      if (window.__riselabGoogleIdentityClientId !== clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }: { credential?: string }) => {
            if (credential) {
              onCredential(credential);
            }
          },
        });
        window.__riselabGoogleIdentityClientId = clientId;
      }

      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 340,
      });
      hasInitializedRef.current = true;
      setIsReady(true);
    };

    if (existingScript) {
      existingScript.addEventListener('load', initialize);
      initialize();
      return () => existingScript.removeEventListener('load', initialize);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.addEventListener('load', initialize);
    document.head.appendChild(script);

    return () => script.removeEventListener('load', initialize);
  }, [clientId, onCredential]);

  if (!clientId) {
    return <p className="text-sm text-slate-400">Google OAuth fica disponivel assim que `VITE_GOOGLE_CLIENT_ID` estiver configurado.</p>;
  }

  return (
    <div className="space-y-3 text-center">
      <div className="flex justify-center">
        <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
      </div>
      {!isReady ? <p className="text-sm text-slate-400">Preparando login com Google...</p> : null}
    </div>
  );
}
