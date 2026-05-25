# ClipBridge / Köprü – Revize Edilmiş Başlangıç Talimatı

## PWA ve Arka Plan Transferi Dahil

## Genel Amaç

Kullanıcıların tarayıcı üzerinden, hiçbir kayıt/şifre olmadan, WebRTC ile uçtan uca şifreli olarak **pano (clipboard) senkronizasyonu** ve **dosya transferi** yapabildiği, 5 haneli oda kodu veya QR ile eşleşen, minimalist ama premium görünümlü bir web uygulaması.

Türkçe adı **Köprü**, İngilizce adı **ClipBridge** olacaktır.

Uygulamanın temel vaadi **“anlık köprü”**dür. Ancak dosya transferinin sekme kapansa veya cihaz uykuya geçse bile devam edebilmesi için **PWA ve Service Worker tabanlı arka plan transferi** MVP’de yer alacaktır. Kullanıcıya, transferin arka planda süreceğine dair bildirim gösterilecektir.

---

## 1. Teknik Stack

Kesinlikle aşağıdaki teknolojiler kullanılacaktır:

- **Framework:** Next.js 15+ (App Router)
- **Dil:** TypeScript (strict)
- **UI Kütüphanesi:** shadcn/ui (tüm bileşenler) + Tailwind CSS
- **Animasyonlar:** Framer Motion
- **Tema:** next-themes (dark/light/system)
- **Çoklu Dil:** next-intl (Türkçe + İngilizce, varsayılan dil tarayıcıdan alınacak)
- **QR Kod:** qrcode.react
- **Pano API:** Tarayıcı Clipboard API (izin yönetimi ile)
- **WebRTC:** Yerleşik tarayıcı RTCPeerConnection API
- **WebSocket Sunucusu:** Node.js + `ws` kütüphanesi (sinyalleşme için, Next.js’ten bağımsız çalışacak)
- **Veritabanı (opsiyonel premium özellikler):** PostgreSQL (Dokploy üzerinde kurulu), `pg` + `drizzle-orm`
- **Konteyner:** Docker, docker-compose
- **Deployment:** Dokploy üzerinde VPS
- **PWA & Arka Plan Transferi:** `next-pwa`, Service Worker, Cache API, Background Sync API, opsiyonel deneysel BackgroundFetchManager

---

## 2. Özellikler ve Kullanıcı Akışı

### 2.1. Ana Sayfa

- Tek ekran, sade arayüz.
- **Oda oluştur** butonu ile rastgele 5 karakterli oda kodu oluşturulur. Örnek: `X7K2P`.
- Oda kodu URL’ye de yansır: `/oda/X7K2P`.
- **Odaya katıl** alanı üzerinden kullanıcı kodu girip bağlanır.
- QR kod odanın tam URL’sini içerir.
- QR kod modern görünür ve ortasında küçük logo bulunur.
- Bağlantı kurulana kadar yükleme animasyonu gösterilir.
- Bağlantı kurulunca iki panelli arayüze geçilir.

### 2.2. Bağlantı Sonrası Arayüz

- Masaüstünde yatay iki panel, mobilde üst/alt dikey panel yapısı kullanılır.

#### Pano Köprüsü

- Bilgisayarda kopyalanan metin mobilde **Panoyu Al** butonuyla alınır.
- Clipboard API izni varsa otomatik senkronizasyon yapılabilir.
- Senkronizasyon her iki yönde çalışır.
- Data channel üzerinden aşağıdaki formatta mesaj gönderilir:

```json
{
  "type": "clipboard",
  "payload": "metin"
}
```

#### Dosya Transferi

- Sürükle-bırak alanı veya dosya seç butonu bulunur.
- Dosya seçildiğinde FileReader ile ArrayBuffer’a çevrilir.
- Dosya 16 KB chunk’lara bölünür.
- Chunk’lar data channel üzerinden gönderilir.
- Alıcı tarafta ilerleme çubuğu gösterilir.
- Transfer tamamlanınca otomatik indirme başlatılır.
- **Arka plan transferi:** Uygulama PWA olarak yüklüyse ve sekme kapanırsa, Service Worker transferi devralır.
- Kullanıcıya **“Transfer arka planda devam ediyor”** bildirimi gösterilir.
- Alıcı taraf çevrimiçi olduğunda dosya parçaları birleştirilir ve indirilir.
- Ücretsiz sürümde dosya boyutu sınırı 50 MB olacaktır.
- Sunucuya hiçbir dosya yüklenmez.

#### Bağlantı Durumu

- Canlı yeşil/kırmızı bağlantı göstergesi bulunur.

#### Bilgilendirme Mesajı

Panellerin üstünde ince bir uyarı şeridi yer alır:

> Her iki cihazda da bu sayfa açık kalmalıdır. Dosya transferi başladıktan sonra arka planda devam edebilir.

#### Sekme Kapanma Uyarısı

- Aktif bağlantı varsa `beforeunload` event ile kullanıcı uyarılır.
- Arka plan transferi başlamışsa kullanıcıya transferin devam edeceği bilgisi verilir.
- **Ayrıl / Kapat** butonu bulunur.

### 2.3. Opsiyonel Premium Özellikler

Sonraki aşamada aşağıdaki özellikler eklenebilir:

- Kalıcı oda adı rezervasyonu
- DB’de `rooms` tablosu
- 50 MB üzeri dosya transfer limitleri
- Çoklu cihaz bağlantısı

---

## 3. Veritabanı Modeli

PostgreSQL yalnızca premium özellikler aktifse kullanılacaktır.

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

İlk sürümde DB bağlantısı kurulmaz. `DATABASE_URL` ortam değişkeni tanımlı değilse drizzle başlatılmaz ve premium özellikler pasif olur. Kodda şema ve bağlantı mantığı hazır bulunur.

---

## 4. UI/UX Tasarım Prensipleri

### 4.1. Genel Stil

- Modern glassmorphism yaklaşımı kullanılacaktır.
- Soft shadow efektleri tercih edilecektir.
- İnce gradient kenarlar kullanılacaktır.
- Arka planda hafif hareketli organik CSS blob’lar bulunacaktır.
- Kartlar şeffaf ve premium görünümlü olacaktır.

### 4.2. Tipografi

- Inter fontu kullanılacaktır.
- Font, `next/font/google` üzerinden yüklenecektir.

### 4.3. Light Tema

- Arka plan beyaza yakın olacaktır.
- Kartlar yarı saydam beyaz olacaktır.
- Vurgu rengi indigo-500’den purple-600’ye uzanan gradient olacaktır.

### 4.4. Dark Tema

- Arka plan koyu gri-siyah olacaktır.
- Kartlar yarı saydam koyu gri olacaktır.

### 4.5. Animasyonlar

- Sayfa geçişleri animasyonlu olacaktır.
- Buton hover animasyonları bulunacaktır.
- Bağlantı kurulunca **bağlandı** efekti gösterilecektir.
- Dosya transferi ilerleme çubuğu animasyonlu olacaktır.

### 4.6. Responsive Yapı

- Mobilde dikey layout kullanılacaktır.
- Masaüstünde yatay iki panel yapısı kullanılacaktır.

### 4.7. Bildirimler

- Toast bildirimleri için shadcn Sonner kullanılacaktır.
- Bağlantı durumu, transferin başlaması, arka plana geçmesi ve tamamlanması bildirimlerle gösterilecektir.

### 4.8. QR Kod

- QR kod için `qrcode.react` kullanılacaktır.
- CSS ile ortasına logo yerleştirilecektir.
- Yuvarlak köşeli modern bir görünüm verilecektir.

### 4.9. Tema ve Dil Değiştirici

- Tema değiştirici shadcn `DropdownMenu` içinde yer alacaktır.
- Güneş/Ay simgeleri kullanılacaktır.
- Dil değiştirici aynı dropdown menüde TR/EN seçenekleriyle yer alacaktır.

### 4.10. Bilgi Şeridi

- İnce, yarı saydam ve ikonlu bilgi şeridi kullanılacaktır.

---

## 5. Çoklu Dil

Çoklu dil yapısı `next-intl` ile kurulacaktır.

### 5.1. Mesaj Dosyaları

Aşağıdaki dosyalar oluşturulacaktır:

```text
messages/tr.json
messages/en.json
```

### 5.2. Kapsam

Tüm metinler mesaj dosyalarından yönetilecektir:

- Butonlar
- Uyarılar
- Bilgi şeridi
- Arka plan bildirimleri
- Toast mesajları
- Bağlantı durumu metinleri
- Dosya transferi metinleri

### 5.3. Routing

- `next-intl` routing yapısı `/[locale]/...` şeklinde kurulacaktır.
- Varsayılan `/` rotası tarayıcı diline göre yönlendirme yapacaktır.
- Dil seçimi `localStorage` içine kaydedilecektir.

---

## 6. WebRTC ve WebSocket Sinyalleşme Mimarisi

### 6.1. Sinyalleşme Sunucusu

- Sinyalleşme sunucusu ayrı bir Node.js process olarak çalışacaktır.
- Dosya yolu: `server/ws-server.ts`
- WebSocket için `ws` kütüphanesi kullanılacaktır.
- Next.js bunu `child_process.fork()` ile başlatabilir.
- Alternatif olarak `docker-compose` içinde ayrı servis olarak çalıştırılabilir.

### 6.2. WebSocket Mesajları

#### create-room

Oda kodu döner.

```json
{
  "type": "create-room"
}
```

#### join-room

Diğer eşe bağlantı isteği bildirir.

```json
{
  "type": "join-room",
  "code": "X7K2P"
}
```

#### signal

SDP/ICE adaylarını iletir.

```json
{
  "type": "signal",
  "to": "peer-id",
  "data": {}
}
```

### 6.3. Client-side `useWebRTC` Hook

`useWebRTC` hook’u aşağıdaki sorumluluklara sahip olacaktır:

- `RTCPeerConnection` oluşturma
- STUN sunucusu kullanma: `stun:stun.l.google.com:19302`
- Data channel yönetimi
- Binary ve text mesaj desteği
- Bağlantı durumlarını yönetme:
  - `idle`
  - `connecting`
  - `connected`
  - `disconnected`
- Clipboard API izin yönetimi
- Dosya transferi yönetimi

### 6.4. Dosya Transferi Mantığı

- Dosya FileReader ile okunur.
- ArrayBuffer’a çevrilir.
- Chunk’lara bölünür.
- Chunk’lar data channel üzerinden gönderilir.
- Alıcıda chunk’lar birleştirilir.
- Chunk’lar ayrıca Service Worker’a kaydedilir.
- Cache API veya IndexedDB kullanılabilir.

### 6.5. Bağlantı Kopması ve Sekme Kapanması

- Bağlantı kopunca transfer otomatik olarak Service Worker’a devredilir.
- Sekme kapanırken `beforeunload` ile kullanıcı bilgilendirilir.
- Transfer sürüyorsa ana thread, Service Worker’a `postMessage` ile transfer bilgisini gönderir.

---

## 7. PWA ve Arka Plan Transferi

PWA ve arka plan transferi MVP’ye tam entegre olacaktır.

### 7.1. PWA Kurulumu

`public/manifest.json` aşağıdaki temel bilgileri içerecektir:

```json
{
  "name": "ClipBridge",
  "short_name": "Köprü",
  "theme_color": "#4f46e5",
  "display": "standalone",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

`next-pwa` ile otomatik Service Worker oluşturulacaktır. Workbox kullanılacaktır.

### 7.2. Service Worker

`sw.js` aşağıdaki event’leri yönetecektir:

#### install

- Önbelleğe alınacak temel varlıklar hazırlanır.

#### fetch

- Ağ istekleri gerektiğinde önbellekten karşılanır.

#### sync

- Arka plan transferi için kuyruğa alınan chunk’lar işlenir.
- BackgroundSyncPlugin kullanılabilir.

#### message

- Ana thread’den gelen transfer başlatma/durdurma mesajları dinlenir.

### 7.3. Arka Plan Transfer Akışı

1. Kullanıcı dosyayı göndermeye başlar.
2. `useWebRTC` hook’u chunk’ları hem data channel’a hem de Service Worker’a gönderir.
3. Service Worker, gelen her chunk’ı IndexedDB veya Cache API’de depolar.
4. Service Worker transfer durumunu takip eder.
5. Ana sayfa kapanırsa veya bağlantı koparsa Service Worker transferi devralır.
6. Kullanıcıya **“Transfer arka planda sürüyor”** bildirimi gösterilir.
7. Alıcı cihaz tekrar çevrimiçi olduğunda veya sayfa açıldığında, Service Worker biriken chunk’ları ana thread’e `postMessage` ile iletir.
8. Ana thread chunk’ları birleştirir, dosyayı oluşturur ve otomatik indirme başlatır.

### 7.4. Deneysel Background Fetch Desteği

Eğer tarayıcı BackgroundFetchManager’ı destekliyorsa, bu API kullanılarak daha sağlam bir arka plan indirme yapılabilir.

Destek kontrolü aşağıdaki şekilde yapılacaktır:

```ts
if ("BackgroundFetchManager" in self) {
  // Background Fetch destekleniyor.
} else {
  // Background Sync / Service Worker tabanlı yönteme düş.
}
```

Bu yapı opsiyonel olarak yer alacak; desteklenmiyorsa sistem yukarıdaki senkronizasyon yöntemine düşecektir.

---

## 8. Geliştirme Notları

- İlk sürümde sunucuya dosya yüklenmeyecektir.
- Dosya transferi mümkün olduğunca peer-to-peer kurgulanacaktır.
- Premium özellikler pasif olsa bile ilgili DB şeması ve bağlantı mantığı hazır tutulacaktır.
- Kod yapısı temiz, modüler ve üretim ortamına uygun hazırlanacaktır.
- TypeScript strict moddan taviz verilmeyecektir.
- shadcn/ui bileşenleri dışında özel UI bileşeni gerektiğinde Tailwind ile oluşturulacaktır.
- Tüm kullanıcıya görünen metinler `next-intl` mesaj dosyalarından beslenecektir.
