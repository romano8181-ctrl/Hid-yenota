/**
 * Голос Рокі. Поки що використовується вбудований синтез мовлення браузера (uk-UA).
 * Пізніше замінюється на заздалегідь згенеровані аудіофайли за ключами реплік.
 */
const KEY = 'hid-yenota:sound';

export function soundEnabled(): boolean {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

export function setSoundEnabled(on: boolean): void {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* приватний режим */ }
  if (!on) stopSpeaking();
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function ukrainianVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('uk'));
  return voices.find((v) => /lesya|леся|female|жін/i.test(v.name)) ?? voices[0];
}

export function speak(text: string): void {
  if (!soundEnabled() || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uk-UA';
    const v = ukrainianVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.15;
    window.speechSynthesis.speak(u);
  } catch { /* звук необов'язковий */ }
}
