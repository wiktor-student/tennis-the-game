import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-ext-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource/instrument-serif/latin-ext-400-italic.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-ext-400.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-ext-600.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-ext-400.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-ext-600.css';
import '@fontsource/caveat/latin-500.css';
import '@fontsource/caveat/latin-ext-500.css';
import '@fontsource/caveat/latin-700.css';
import '@fontsource/caveat/latin-ext-700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/paper.css';
import './styles/screens.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
