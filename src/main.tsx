import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {LanguageProvider} from './i18n/LanguageContext.tsx';
import './index.css';

registerSW({
  immediate: true,
  onRegisterError() {
    // Gracefully ignore SW registration errors in restricted iframe/browser contexts
  },
});

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
