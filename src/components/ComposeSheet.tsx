import { useEffect, useMemo, useRef, useState } from "react";
import { categoryColor } from "../categories";
import { addDays, formatLong } from "../dates";
import { parseTask, splitItems, type Span } from "../parse";
import type { Priority, Todo, TodoFields } from "../store";
import { useBackClose } from "../useBackClose";
import { speechSupported, useSpeech } from "../useSpeech";
import {
  CalendarIcon,
  CalendarPlusIcon,
  CheckIcon,
  ClockIcon,
  FlagIcon,
  KeyboardIcon,
  MicIcon,
  TagIcon,
  TrashIcon,
  XIcon,
} from "./Icons";

type Field = "dueDate" | "time" | "priority" | "category";
type Overrides = Partial<Record<Field, string | undefined>>;

const PRIORITY_LABEL: Record<Priority, string> = { high: "Yüksek", medium: "Orta", low: "Düşük" };

interface Props {
  variant: "task" | "shop";
  /** Doluysa düzenleme modu */
  initial?: Todo;
  categories: string[];
  listenOnOpen: boolean;
  onSave?: (fields: TodoFields) => void;
  onSaveItems?: (texts: string[]) => void;
  onDelete?: () => void;
  onCalendar?: (fields: TodoFields) => void;
  onClose: () => void;
}

function Highlighted({ text, spans }: { text: string; spans: Span[] }) {
  const parts: JSX.Element[] = [];
  let pos = 0;
  spans.forEach((s, i) => {
    if (s.start > pos) parts.push(<span key={`t${i}`}>{text.slice(pos, s.start)}</span>);
    parts.push(
      <mark key={`m${i}`} className={`hl-${s.kind}`}>
        {text.slice(s.start, s.end)}
      </mark>,
    );
    pos = s.end;
  });
  parts.push(<span key="end">{text.slice(pos)} </span>);
  return <>{parts}</>;
}

export function ComposeSheet(props: Props) {
  const { variant, initial, categories, onClose } = props;
  const isTask = variant === "task";
  const [text, setText] = useState(initial?.text ?? "");
  const [ov, setOv] = useState<Overrides>(
    initial ? { dueDate: initial.dueDate, time: initial.time, priority: initial.priority, category: initial.category } : {},
  );
  const [picker, setPicker] = useState<null | "date" | "prio" | "cat">(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeech(setText);

  useBackClose(true, onClose);

  useEffect(() => {
    if (props.listenOnOpen && speechSupported) speech.start();
    else inputRef.current?.focus();
    // sadece açılışta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = useMemo(() => (isTask ? parseTask(text, categories) : null), [text, categories, isTask]);
  const pick = <K extends Field>(k: K) => (k in ov ? ov[k] : parsed?.[k]);
  const fields: TodoFields = {
    text: parsed?.title ?? text,
    dueDate: pick("dueDate"),
    time: pick("dueDate") ? pick("time") : undefined,
    priority: pick("priority") as Priority | undefined,
    category: pick("category"),
  };
  const set = (patch: Overrides) => setOv((o) => ({ ...o, ...patch }));
  const canSave = text.trim().length > 0;

  const save = () => {
    speech.stop();
    if (!canSave) return onClose();
    if (isTask) props.onSave?.(fields);
    else props.onSaveItems?.(splitItems(text));
  };

  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else if (speechSupported) speech.start();
  };

  const cat = fields.category ? categoryColor(fields.category, categories) : null;

  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={isTask ? (initial ? "Görevi düzenle" : "Yeni görev") : "Alışverişe ekle"}>
      <div className="sheet-backdrop" onClick={save} />
      <div className="sheet">
        <div className="sheet-handle" aria-hidden />
        <div className="sheet-status">
          {speech.listening ? (
            <>
              <span className="rec-dot" aria-hidden />
              Dinliyorum…
            </>
          ) : initial ? (
            "Görevi düzenle"
          ) : isTask ? (
            "Ne yapılacak?"
          ) : (
            "Listeye ne ekleyelim?"
          )}
        </div>

        <div className={`hl-wrap${isTask ? "" : " shop-font"}`}>
          <div className="hl" aria-hidden>
            {parsed ? <Highlighted text={text} spans={parsed.spans} /> : text + " "}
          </div>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => speech.listening && speech.stop()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                save();
              }
            }}
            placeholder={isTask ? "ör. yarın saat 4'te Beril ile toplantı" : "ör. süt, yumurta ve ekmek"}
            aria-label={isTask ? "Görev" : "Ürünler"}
            enterKeyHint="done"
            rows={1}
          />
        </div>

        {speech.error && <p className="sheet-error">{speech.error}</p>}

        {isTask && (
          <div className="understood">
            <span className="label">{text ? "Şöyle anladım" : "Ekle"}</span>
            <div className="chips-row">
              <button className={`pchip${fields.dueDate ? " on date" : ""}`} onClick={() => setPicker(picker === "date" ? null : "date")} aria-expanded={picker === "date"}>
                <CalendarIcon size={16} />
                {fields.dueDate ? `${formatLong(fields.dueDate)}${fields.time ? ` · ${fields.time}` : ""}` : "Tarih"}
              </button>
              <button className={`pchip${fields.priority ? ` on prio-${fields.priority}` : ""}`} onClick={() => setPicker(picker === "prio" ? null : "prio")} aria-expanded={picker === "prio"}>
                <FlagIcon size={16} />
                {fields.priority ? `${PRIORITY_LABEL[fields.priority]} öncelik` : "Öncelik"}
              </button>
              <button
                className={`pchip${fields.category ? " on" : ""}`}
                style={cat ? { background: cat.bg, color: cat.fg, borderColor: "transparent" } : undefined}
                onClick={() => setPicker(picker === "cat" ? null : "cat")}
                aria-expanded={picker === "cat"}
              >
                <TagIcon size={16} />
                {fields.category ?? "Kategori"}
              </button>
            </div>

            {picker === "date" && (
              <div className="picker">
                <button onClick={() => set({ dueDate: addDays(0) })}>Bugün</button>
                <button onClick={() => set({ dueDate: addDays(1) })}>Yarın</button>
                <button onClick={() => set({ dueDate: addDays(7) })}>Haftaya</button>
                <label className="picker-input">
                  <CalendarIcon size={16} />
                  <span className="sr">Tarih seç</span>
                  <input type="date" value={fields.dueDate ?? ""} onChange={(e) => set({ dueDate: e.target.value || undefined })} />
                </label>
                <label className="picker-input">
                  <ClockIcon size={16} />
                  <span className="sr">Saat seç</span>
                  <input
                    type="time"
                    value={fields.time ?? ""}
                    onChange={(e) => set({ time: e.target.value || undefined, ...(fields.dueDate ? {} : { dueDate: addDays(0) }) })}
                  />
                </label>
                {fields.dueDate && (
                  <button className="danger" onClick={() => set({ dueDate: undefined, time: undefined })}>
                    Kaldır
                  </button>
                )}
              </div>
            )}
            {picker === "prio" && (
              <div className="picker">
                {(["high", "medium", "low"] as const).map((p) => (
                  <button key={p} className={`prio-opt prio-${p}${fields.priority === p ? " selected" : ""}`} onClick={() => (set({ priority: p }), setPicker(null))}>
                    <span className="dot" />
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
                {fields.priority && (
                  <button className="danger" onClick={() => (set({ priority: undefined }), setPicker(null))}>
                    Kaldır
                  </button>
                )}
              </div>
            )}
            {picker === "cat" && (
              <div className="picker">
                {categories.length === 0 && <span className="picker-note">Önce ana ekrandan "+ Kategori" ile kategori ekle.</span>}
                {categories.map((c) => (
                  <button key={c} className={fields.category === c ? "selected" : ""} onClick={() => (set({ category: c }), setPicker(null))}>
                    {c}
                  </button>
                ))}
                {fields.category && (
                  <button className="danger" onClick={() => (set({ category: undefined }), setPicker(null))}>
                    Kaldır
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {initial && (
          <div className="edit-actions">
            {fields.dueDate && (
              <button className="soft" onClick={() => props.onCalendar?.(fields)}>
                <CalendarPlusIcon size={18} />
                Takvime ekle
              </button>
            )}
            <button className="soft danger" onClick={props.onDelete}>
              <TrashIcon size={18} />
              Sil
            </button>
          </div>
        )}

        {speech.listening && (
          <div className="wave" aria-hidden>
            {Array.from({ length: 11 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${(i % 5) * 0.12}s` }} />
            ))}
          </div>
        )}

        <div className="sheet-actions">
          <button className="round" onClick={onClose} aria-label="Vazgeç">
            <XIcon size={22} />
          </button>
          <button className="round big" onClick={save} aria-label="Kaydet" disabled={!canSave && !speech.listening}>
            <CheckIcon size={36} strokeWidth={2.6} />
          </button>
          {speechSupported ? (
            <button className={`round${speech.listening ? " live" : ""}`} onClick={toggleMic} aria-label={speech.listening ? "Dinlemeyi durdur" : "Sesle söyle"}>
              <MicIcon size={22} />
            </button>
          ) : (
            <button className="round" onClick={() => inputRef.current?.focus()} aria-label="Yaz">
              <KeyboardIcon size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
