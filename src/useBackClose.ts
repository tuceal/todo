import { useEffect, useRef } from "react";

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
      poppedByBack = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Panel başka yoldan kapandıysa eklediğimiz geçmiş kaydını geri al
      if (!poppedByBack && history.state?.panel) history.back();
    };
  }, [open]);
}
