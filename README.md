# To-Do Magic ✨ (v3.0.1)

**Adres:** https://yapilacaklarim.vercel.app

Söyle, o yazsın. Telefonuna kurulan, **hesapsız ve sunucusuz** yapılacaklar + alışveriş listesi. Tüm veriler cihazın tarayıcı depolamasında (`localStorage`) durur.

## Özellikler

- **Büyük mikrofon:** "yarın saat 4'te Beril ile önemli toplantı" de → tarih **yarın 16:00**, öncelik **Yüksek** otomatik dolar. Anlaşılan kelimeler renkli işaretlenir; yanlışsa etikete dokunup düzeltirsin.
- **Google Takvim'e ekle:** Tarihli görev eklenince takvim, bilgiler dolu açılır; Kaydet'e basarsın, uyarıyı takvim yapar. Giriş/izin yok.
- **Alışveriş sekmesi:** Çizgili defter kağıdı. "süt, yumurta ve ekmek" de → 3 ayrı ürün.
- Tamamlamak için halkaya dokun (üstü çizilir); **silmek için sola kaydır**; 10 saniye içinde **Geri al**.
- Bölümler: Gecikmiş · Bugün · Yaklaşan · Tarihsiz · Tamamlanan. Renkli kategoriler.
- ⋮ menüsü: Uygulamayı yükle, Yedeği indir / geri yükle, Tamamlananları temizle.
- Offline çalışır (PWA), Android geri tuşu açık paneli kapatır.

### Cümle anlama (kural tabanlı, internetsiz)

Anlar: `bugün`, `yarın`, `öbür gün`, `haftaya`, gün adları (`cuma`, `haftaya pazartesi`), `15 kasım`, `ayın 20'si`, `3 gün sonra`, `saat 4`, `saat dörtte`, `4'te`, `14:30`, `3 buçuk`, `sabah 9`, `akşam 7`, `öğlen`, `önemli`/`acil` (yüksek öncelik), mevcut kategori adları.
Saat ipucusuz 1–7 öğleden sonra sayılır (`saat 4` → 16:00). Sadece saat söylenirse: geçmediyse bugün, geçtiyse yarın.

## Stack

Vite 6 · React 18 · TypeScript · `vite-plugin-pwa`. Backend, veritabanı, giriş yok. Yapay zeka yok (cümle anlama `src/parse.ts`).

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # cümle çözümleyici testleri (Node 22.6+)
npm run build    # test + tip kontrolü + dist/
```

## Vercel'e Deploy

Ortam değişkeni (env var) **gerekmiyor**. Proje Vercel'e bağlı; `main`'e her push otomatik yayına çıkar. Preview deploy'lar kapalı.

Sıfırdan kurulum: [vercel.com/new](https://vercel.com/new) → `tuceal/todo` → Import → Deploy (ayarlar `vercel.json`'da).

### Telefona kurulum

- **Android (Chrome):** Adresi aç → ⋮ → **Uygulamayı yükle**. Uygulama çekmecesinde sihirli değnek ikonuyla durur.
- **iPhone (Safari):** Paylaş → **Ana Ekrana Ekle**.

### Bilmen gerekenler

- **Veri sadece o cihazda.** Chrome'da "site verilerini temizle" dersen liste silinir. Arada bir ⋮ → **Yedeği indir**.
- **Ses tanıma:** Android Chrome'da sesi Google'ın sunucusu yazıya çevirir (tarayıcı özelliği). Metin ve görevler cihazda kalır.
- Eski adresler (`yapilacaklar-bay`, `yapilacaklar-tuci`) açılırsa veri otomatik yeni adrese taşınır (`src/main.tsx`).
- Vercel Hobby (ücretsiz) planı kişisel, ticari olmayan kullanım içindir.
