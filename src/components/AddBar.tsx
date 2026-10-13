import { FormEvent, useRef, useState } from "react";

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

const SpeechRecognition: (new () => SpeechRec) | undefined =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export function AddBar({ onAdd, placeholder }: { onAdd: (text: string) => void; placeholder: string }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  const toggleMic = () => {
    if (!SpeechRecognition) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "tr-TR";
    rec.interimResults = false;
    rec.onresult = (e) => setText((prev) => (prev ? `${prev} ` : "") + e.results[0][0].transcript);
    rec.onend = rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <form className="addbar" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={listening ? "Dinliyorum…" : placeholder}
        aria-label="Yeni görev"
        enterKeyHint="done"
      />
      {SpeechRecognition && (
        <button
          type="button"
          className={`icon-btn mic${listening ? " listening" : ""}`}
          onClick={toggleMic}
          aria-label={listening ? "Dinlemeyi durdur" : "Sesle ekle"}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" />
          </svg>
        </button>
      )}
      <button type="submit" className="add-btn" disabled={!text.trim()} aria-label="Ekle">
        +
      </button>
    </form>
  );
}
