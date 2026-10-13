import { useEffect, useRef } from "react";

// Panel kendi kendine kapanınca eklediğimiz geçmiş kaydını history.back() ile geri alırız.
// O back()'in ürettiği popstate, hemen ardından açılan yeni paneli kapatmasın diye sayılır.
let selfBacks = 0;
let ignoring = false;
// Panellerin dinleyicilerinden önce çalışır (modül yüklenirken eklenir)
window.addEventListener("popstate", () => {
  ignoring = selfBacks > 0;
  if (ignoring) selfBacks--;
});

/**
 * Android geri tuşu / geri hareketi açık paneli kapatsın, uygulamadan çıkmasın.
 * Panel açılınca geçmişe bir kayıt eklenir; geri basılınca o kayıt tüketilip panel kapanır.
 */
export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    history.pushState({ panel: true }, "");
    let poppedByBack = false;
    const onPop = () => {
      if (ignoring) return;
      poppedByBack = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!poppedByBack && history.state?.panel) {
        selfBacks++;
        history.back();
      }
    };
  }, [open]);
}
