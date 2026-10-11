import { useEffect, useState } from 'react';

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';

export const GOOGLE_MAPS_API_KEY = API_KEY;

let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    __initGoogleMaps?: () => void;
  }
}

function isMapsReady(): boolean {
  return !!window.google?.maps && typeof window.google.maps.Map === 'function';
}

function whenMapsReady(onReady: () => void, onFail?: () => void): void {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (isMapsReady()) {
      window.clearInterval(timer);
      onReady();
    } else if (attempts > 100) {
      window.clearInterval(timer);
      onFail?.();
    }
  }, 50);
}

function loadGoogleMapsScript(key: string): Promise<void> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window no disponible'));
      return;
    }

    if (isMapsReady()) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[data-google-maps-api]');
    if (existingScript) {
      const fail = () => reject(new Error('Error al cargar Google Maps'));
      if ((existingScript as HTMLScriptElement).dataset.loaded === 'true' && isMapsReady()) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => whenMapsReady(resolve, fail), { once: true });
      existingScript.addEventListener('error', fail, { once: true });
      whenMapsReady(resolve, fail);
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsApi = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;

    script.onload = () => {
      whenMapsReady(() => {
        script.dataset.loaded = 'true';
        resolve();
      }, () => reject(new Error('Google Maps no inicializó en el tiempo esperado')));
    };
    script.onerror = () => {
      reject(new Error('Error al cargar Google Maps JavaScript API'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMapsApi() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'));
  }, []);

  return {
    isLoaded: status === 'ready',
    isLoading: status === 'loading',
    isError: status === 'error',
    hasApiKey: !!GOOGLE_MAPS_API_KEY,
  };
}