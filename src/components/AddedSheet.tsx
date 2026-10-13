import { parseISO } from "../dates";
import type { Todo } from "../store";
import { useBackClose } from "../useBackClose";
import { BellIcon, CalendarPlusIcon, CheckIcon } from "./Icons";

function endTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Tarihli görev eklendikten sonra: "Takvime de koyalım mı?" */
export function AddedSheet({ todo, onCalendar, onClose }: { todo: Todo; onCalendar: () => void; onClose: () => void }) {
  useBackClose(true, onClose);
  const d = parseISO(todo.dueDate!);
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label="Görev eklendi">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet added">
        <div className="added-head">
          <span className="ok-badge">
            <CheckIcon size={22} strokeWidth={2.6} />
          </span>
          <div>
            <strong>Görev eklendi</strong>
            <span>Tarihi var, takvimine de koyalım mı?</span>
          </div>
        </div>
        <div className="event">
          <div className="event-day">
            <span>{d.toLocaleDateString("tr-TR", { weekday: "short" }).toLocaleUpperCase("tr")}</span>
            <b>{d.getDate()}</b>
            <span>{d.toLocaleDateString("tr-TR", { month: "long" })}</span>
          </div>
          <div className="event-info">
            <strong>{todo.text}</strong>
            <span>{todo.time ? `${todo.time} – ${endTime(todo.time)}` : "Tüm gün"}</span>
            <small>
              <BellIcon size={14} />
              Uyarıyı takvimin yapar
            </small>
          </div>
        </div>
        <button className="primary" onClick={onCalendar}>
          <CalendarPlusIcon size={20} />
          Google Takvim'e ekle
        </button>
        <button className="text-btn" onClick={onClose}>
          Şimdi değil
        </button>
        <p className="fine">Takvim bilgiler dolu açılır, sadece Kaydet'e basarsın.</p>
      </div>
    </div>
  );
}
