import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { TrashIcon } from "./Icons";

const THRESHOLD = 90;

/** Sola kaydırınca altından kırmızı "Sil" çıkar; eşik geçilirse siler. Dikey kaydırmayı bozmaz. */
export function SwipeRow({ onDelete, children, className = "" }: { onDelete: () => void; children: ReactNode; className?: string }) {
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const drag = useRef<{ x: number; y: number; decided: boolean; horizontal: boolean } | null>(null);
  const moved = useRef(false);

  const down = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, decided: false, horizontal: false };
    moved.current = false;
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const ddx = e.clientX - d.x;
    const ddy = e.clientY - d.y;
    if (!d.decided && Math.hypot(ddx, ddy) > 8) {
      d.decided = true;
      d.horizontal = Math.abs(ddx) > Math.abs(ddy) * 1.2 && ddx < 0;
      if (d.horizontal) e.currentTarget.setPointerCapture(e.pointerId);
      else drag.current = null;
    }
    if (d.horizontal) {
      moved.current = true;
      setDx(Math.min(0, ddx));
    }
  };

  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dx < -THRESHOLD) {
      setLeaving(true);
      setDx(-window.innerWidth);
      setTimeout(onDelete, 180);
    } else {
      setDx(0);
    }
  };

  return (
    <div className={`swipe ${className}${leaving ? " leaving" : ""}`}>
      <div className="swipe-bg" aria-hidden style={{ opacity: Math.min(1, -dx / 40) }}>
        <TrashIcon size={22} />
        <span>Sil</span>
      </div>
      <div
        className={`swipe-fg${drag.current ? "" : " settle"}`}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          // Kaydırma bittiğinde parmak kalkınca tıklama sayılmasın
          if (moved.current) {
            e.stopPropagation();
            e.preventDefault();
            moved.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
