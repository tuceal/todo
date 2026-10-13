import { useCallback, useEffect, useRef, useState } from "react";

type Rec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

const Ctor: (new () => Rec) | undefined =
  (window as unknown as Record<string, new () => Rec>).SpeechRecognition ??
  (window as unknown as Record<string, new () => Rec>).webkitSpeechRecognition;

export const speechSupported = !!Ctor;

/**
 * Tarayıcının konuşma tanıması (Android Chrome'da Google'ın sunucusu kullanılır).
 * onText her ara sonuçta tüm metinle çağrılır.
 */
export function useSpeech(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Rec | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  const stop = useCallback(() => recRef.current?.stop(), []);

  const start = useCallback(() => {
    if (!Ctor) return;
    recRef.current?.abort();
    const rec = new Ctor();
    rec.lang = "tr-TR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      cb.current(text.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Mikrofon izni kapalı. Tarayıcı ayarlarından izin ver ya da yazarak ekle.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setError("Ses anlaşılamadı, tekrar dene.");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setError(null);
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { listening, error, start, stop };
}
