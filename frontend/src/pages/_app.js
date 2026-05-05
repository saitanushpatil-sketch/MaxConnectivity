import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('SW registered:', reg.scope))
          .catch((err) => console.log('SW error:', err));
      });
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A26',
            color: '#E8E8FF',
            border: '1px solid #252535',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#00F5FF', secondary: '#0A0A0F' } },
          error: { iconTheme: { primary: '#FF006E', secondary: '#0A0A0F' } },
        }}
      />
    </>
  );
}
