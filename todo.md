🚀 Project Roadmap: High-Scale Blog Platform (Medium Clone)

Bu belge, binlerce anlık kullanıcıyı destekleyecek, mikroservis mimarisine geçişe uygun (Modular Monolith), Python FastAPI ve Next.js (TypeScript) tabanlı blog platformunun geliştirme adımlarını içerir.

🏗️ Faz 0: Altyapı ve Hazırlık (Infrastructure & Setup)

Projenin temellerinin atıldığı, CI/CD ve geliştirme ortamının kurulduğu aşama.

[x] Repo ve Versiyon Kontrol

[x] Monorepo yapısının kurulması (/backend, /frontend, /infrastructure).

[x] .gitignore ve .editorconfig dosyalarının ayarlanması.

[x] Branch stratejisinin belirlenmesi (Gitflow veya Trunk Based).

[x] Docker Ortamı (Local Dev)

[x] docker-compose.yml hazırlanması (PostgreSQL, Redis, MinIO/S3 Mock).

[x] Backend ve Frontend için Dockerfile optimizasyonu (Multi-stage builds).

[x] Veritabanı Tasarımı

[x] ER Diyagramının çizilmesi (Users, Posts, Comments, Tags, Bookmarks).

[x] PostgreSQL yapılandırması (UTF-8, Timezone).

🎯 Faz 1: MVP (Minimum Viable Product) - Core & Auth

Hedef: Tam güvenli üyelik sistemi, içerik oluşturma ve yayınlama.

🔐 Backend: Kimlik ve Yetkilendirme (Auth & RBAC)

Teknolojiler: FastAPI, Pydantic, JWT, OAuth2, Passlib

[x] Kullanıcı Modeli ve Migrations (SQLAlchemy, Alembic)

[x] User tablosu (UUID, email, hashed_password, role, is_active).

[x] Role Enum (Admin, Editor, Author, Subscriber, Reader).

[x] JWT Authentication

[x] Access Token ve Refresh Token mekanizması.

[x] Dependency Injection ile get_current_user ve get_current_active_user.

[x] OAuth2 Entegrasyonu

[x] Google Login entegrasyonu.

[x] GitHub Login entegrasyonu.

[x] RBAC (Role Based Access Control)

[x] Role checker dependency'si (Örn: Sadece 'Author' ve üzeri post atabilir).

[x] Middleware ile yetki kontrolü.

💾 Backend: Depolama ve İçerik Yönetimi (Storage & Content)

Teknolojiler: Boto3 (AWS SDK), MinIO (Local S3), FastAPI UploadFile

[x] Object Storage Servisi

[x] S3/MinIO bağlantı modülü (Boto3).

[x] Dosya yükleme endpoint'i (Resim, Ses, Video ayrımı yaparak).

[x] Dosya doğrulama (Mime-type, Magic numbers, Boyut limiti).

[x] Kritik: Public erişim için Presigned URL veya CDN URL oluşturma mantığı.

[x] Blog Post API

[x] CRUD işlemleri (Create, Read, Update, Delete).

[x] Slug oluşturma (Başlıktan otomatik URL dostu isim).

[x] İçerik yapısı: JSONB olarak tutulacak (Block-based editor çıktısı için).

🎨 Frontend: Arayüz ve Editör (Next.js & TypeScript)

Teknolojiler: Next.js 15 (App Router), TypeScript (TSX), TailwindCSS, TipTap/Editor.js, React Query

[x] Next.js & TypeScript Kurulumu

[x] create-next-app ile TypeScript projesinin oluşturulması.

[x] tsconfig.json yapılandırması (Strict mode aktif).

[x] App Router yapısı, Layouts (layout.tsx) ve Font optimizasyonu.

[x] NextAuth.js Type tanımlamaları ve Backend JWT entegrasyonu.

[x] Block-Based Editör Entegrasyonu (En Kritik Kısım)

[x] TipTap kurulumu ve TypeScript entegrasyonu.

[x] Custom bloklar (Resim, Kod bloğu, Quote) geliştirilmesi.

[x] İçeriğin JSON olarak kaydedilmesi ve Frontend'de render edilmesi.

[x] Custom Image Block (.tsx): Sürükle-bırak yapıldığında Backend'e upload edip S3 URL'ini editöre gömen hook.

[x] Custom Audio/Video Block (.tsx): Ses dosyaları için özel oynatıcı bileşeni.

[x] İçeriğin JSON olarak kaydedilmesi ve tiplerin (interface) tanımlanması.

[x] Sayfalar ve Bileşenler (TSX)

[x] Ana Sayfa (page.tsx) - Trendler ve Son Yazılar (SSR).

[x] Yan Menü/Navbar - Gelişmiş Navigasyon.

[x] Frontend Sosyal Özellikleri (Tamamlandı)
[x] Arama Sayfası (Search Page)
[x] Yorum Sistemi (Comments)
[x] Dashboard (Bookmarks & Stats)
[x] Takip Sistemi (Follow Button)

[x] Yazı Detay Sayfası ([slug]/page.tsx) - SEO uyumlu, Meta taglar dinamik.

[x] Profil Sayfası ve Ayarlar.

[x] Reusable UI Components (Button, Card, Modal vb. .tsx olarak).

🚀 Faz 2: Etkileşim ve Performans (Mid-Level)

Hedef: Kullanıcı etkileşimi, sosyal özellikler ve yüksek hız.

💬 Backend: Sosyal Özellikler

[x] Yorum Sistemi

[x] Nested (İç içe) yorum yapısı (Self-referencing table).

[x] Yorumlar için Soft-Delete mekanizması.

[x] Etkileşimler

[x] Beğeni (Clap/Like) sistemi (Redis Set yapısı ile unique sayım).

[x] Okuma listesine kaydetme (Bookmark).

[x] Takip etme (Follow) sistemi (User-to-User relation).

🔍 Backend: Arama ve Keşfet

Teknolojiler: Elasticsearch, Logstash/Custom Script

[x] Elasticsearch Entegrasyonu

[x] PostgreSQL verisini Elasticsearch'e senkronize eden bir servis/worker.

[x] Full-text search endpoint'i (Typos, fuzzy search destekli).

[x] Kategori ve Etiket bazlı filtreleme.

⚡ Performans ve Caching

Teknolojiler: Redis

[x] Caching Stratejisi

[x] FastAPI-Cache veya custom decorator ile endpoint caching.

[ ] Sık erişilen verilerin (Trendler) Redis'te tutulması.

[ ] Cache invalidation (Yeni yazı eklenince cache temizleme) mantığı.

🔔 Bildirimler (Asenkron)

Teknolojiler: Celery, RabbitMQ/Redis Broker

[x] Celery Worker Kurulumu

[x] E-posta gönderimi (Hoşgeldin, Şifre sıfırlama) - Asenkron.

[ ] "Yazın beğenildi" bildirimi oluşturma.

[ ] WebSocket (Opsiyonel)

[ ] Anlık bildirimler için Socket bağlantısı.

💰 Faz 3: Full Scale & Monetization (High-Level)

Hedef: Gelir modeli, analitik ve production ölçeklendirme.

💳 Ödeme ve Üyelik (Monetization)

Teknolojiler: Stripe API

[ ] Abonelik Sistemi

[ ] Stripe Checkout entegrasyonu.

[ ] Webhook dinleyicisi (Ödeme başarılı/başarısız durumları için).

[ ] "Member-Only" içerik kilidi (Middleware seviyesinde kontrol).

📊 Analitik ve Raporlama

[ ] Yazar Paneli

[x] Görüntülenme sayıları (Redis HyperLogLog ile unique counter).

[ ] Okuma süresi hesaplama algoritması.

[ ] Grafiksel gösterim (Recharts/Chart.js - TS destekli).

📱 Mobil Uyumluluk

[ ] API Versioning

[ ] /api/v2/ namespace'i.

[ ] Mobil uygulamalar için hafifletilmiş JSON yanıtları.

🛠️ Faz 4: DevOps & Production (The "Heavy" Lifting)

Hedef: Kesintisiz yayım, otomatik ölçeklenme ve gözlemlenebilirlik.

[ ] CI/CD Pipeline (GitHub Actions)

[ ] Backend: Code Linting (Ruff/Black) & Type Checking (MyPy).

[ ] Frontend: ESLint & TypeScript Checking (tsc --noEmit).

[ ] Unit & Integration Tests (Pytest & Jest/Vitest) koşulması.

[ ] Docker Image Build & Push to Registry (ECR/DockerHub).

[ ] Container Orchestration (Kubernetes/K8s)

[ ] Deployment ve Service manifestlerinin yazılması (Helm chart önerilir).

[ ] Ingress Controller (Nginx) yapılandırması.

[ ] Horizontal Pod Autoscaler (CPU yüküne göre pod sayısını artırma).

[ ] Monitoring & Logging (Observability)

[ ] Prometheus: Metrik toplama (Request count, Latency, Memory usage).

[ ] Grafana: Dashboard oluşturma (Sistem sağlığını izleme).

[ ] ELK Stack (veya Loki): Merkezi log yönetimi.

[ ] CDN & Security

[ ] Cloudflare entegrasyonu (DDoS koruması, SSL, Cache).

[ ] Rate Limiting (Nginx veya Uygulama seviyesinde sıkılaştırma).

📝 Notlar

Resim/Ses Depolama: Kesinlikle veritabanına Binary (BLOB) olarak kaydetme. S3'e at, URL'i veritabanına kaydet.

Editör: Frontend'de en çok vakit harcanacak kısım burasıdır. TipTap esneklik açısından en iyisidir.

Database: JSONB veri tipi (PostgreSQL) içerik bloklarını tutmak için NoSQL esnekliği sağlar, bunu kullan.