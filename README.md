# Yapılacaklar ✓ (v2.0.1)

**Adres:** https://yapilacaklarim.vercel.app

Telefonuna kurulan, **hesapsız ve sunucusuz** yapılacaklar listesi. Tüm veriler cihazın tarayıcı depolamasında (`localStorage`) durur; hiçbir yere gönderilmez.

## Özellikler

- Görev ekle, düzenle (metne dokun), tamamla, sil (5 sn **Geri al**)
- Öncelik (Yüksek / Orta / Düşük) ve son tarih (Bugün / Yarın / Haftaya / takvim)
- Kategoriler ve filtre çubuğu
- Sesle ekleme (tarayıcı destekliyorsa, Türkçe)
- Offline çalışır, ana ekrana kurulabilir (PWA)
- Açık / koyu tema (cihaz ayarını izler)
- **Yedek al / geri yükle** (⋮ menüsü → JSON dosyası)

## Stack

Vite 5 · React 18 · TypeScript · `vite-plugin-pwa` (Workbox). Backend, veritabanı, giriş yok.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ klasörüne üretim çıktısı
npm run preview  # build'i yerelde test et
```

## Vercel'e Deploy

Ortam değişkeni (env var) **gerekmiyor** — uygulamanın sunucu tarafı yok.

1. [vercel.com/new](https://vercel.com/new) → GitHub ile giriş → **Import** → `tuceal/todo` reposunu seç.
2. Ayarlar otomatik gelir (`vercel.json` içinde tanımlı): Framework **Vite**, Build `npm run build`, Output `dist`. Hiçbir şeyi değiştirme, **Deploy**'a bas.
3. 1 dakika sonra `https://<proje-adı>.vercel.app` adresin hazır. Bundan sonra `main`'e her push otomatik deploy olur; PR'lar için ayrı önizleme linki gelir.

### Telefona kurulum

- **iPhone (Safari):** Adresi aç → Paylaş → **Ana Ekrana Ekle**.
- **Android (Chrome):** Adresi aç → ⋮ → **Uygulamayı yükle** / **Ana ekrana ekle**.

### Bilmen gerekenler

- **Veri sadece o cihazda ve o tarayıcıda.** iPhone'da Safari sekmesi ile ana ekrana eklenen uygulama **ayrı depolama** kullanır — uygulamayı ana ekrandan kullan.
- Ana ekrandaki uygulamayı silersen ya da tarayıcı verilerini temizlersen **liste de silinir**. Arada bir ⋮ → **Yedeği indir** yap.
- Vercel adresi (domain) değişirse eski adresteki veriler yeni adreste görünmez. Eski adresler (`yapilacaklar-bay`, `yapilacaklar-tuci`) açıldığında uygulama veriyi alıp otomatik olarak yeni adrese taşır; başka bir adres değişikliğinde `src/main.tsx` içindeki listeye eklenmeli.
- Preview deploy'lar kapalı: sadece `main` dalı yayına çıkar, tek adres vardır.
- Yeni sürüm deploy edildiğinde uygulama bir sonraki açılışta kendini günceller (service worker `autoUpdate`).
- Vercel Hobby (ücretsiz) planı kişisel, ticari olmayan kullanım içindir.
