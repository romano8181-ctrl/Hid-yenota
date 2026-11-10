/**
 * Голос Рокі. Поки що використовується вбудований синтез мовлення браузера (uk-UA).
 * Пізніше замінюється на заздалегідь згенеровані аудіофайли за ключами реплік.
 *
 * Особливості iOS Safari: говорити можна лише після першого дотику користувача («розблокування»),
 * між cancel() і speak() потрібна коротка пауза, а об'єкт фрази треба тримати в пам'яті до кінця.
 */
const KEY = 'hid-yenota:sound';

let primed = false;
let current: SpeechSynthesisUtterance | null = null;

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

/** Викликається з обробника першого дотику: «розблоковує» синтез мовлення на iOS і підвантажує голоси */
export function unlockSpeech(): void {
  if (primed || !('speechSynthesis' in window)) return;
  primed = true;
  try {
    window.speechSynthesis.getVoices();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch { /* звук необов'язковий */ }
}

function ukrainianVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('uk'));
  return voices.find((v) => /lesya|леся|female|жін/i.test(v.name)) ?? voices[0];
}

export function speak(text: string): void {
  if (!soundEnabled() || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uk-UA';
    const v = ukrainianVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.15;
    current = u;
    u.onend = u.onerror = () => { if (current === u) current = null; };
    // iOS: після cancel() потрібна пауза, інакше нову фразу може бути проковтнуто
    setTimeout(() => {
      try { synth.resume(); synth.speak(u); } catch { /* звук необов'язковий */ }
    }, 60);
  } catch { /* звук необов'язковий */ }
}
