import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';
import { speak, unlockSpeech } from './speech';

registerSW({ immediate: true });

// iOS Safari дозволяє говорити лише після першого дотику
window.addEventListener('pointerdown', unlockSpeech, { once: true });
window.addEventListener('touchend', unlockSpeech, { once: true });
// Дотик до хмарки Рокі повторює фразу вголос
document.addEventListener('click', (e) => {
  const bubble = (e.target as Element).closest('.bubble');
  if (bubble?.textContent) speak(bubble.textContent);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
