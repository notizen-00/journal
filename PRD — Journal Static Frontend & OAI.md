```
PRD — Journal Static Frontend & OAI Publisher
```

```
Versi: 1.0
```

```
Model: Tata Kelola OJS Model 2 — Pemisahan Frontend Static dan Backend Editorial
OJS
```

```
Target: Universitas Jember
Status: Draft
```

# `1. Ringkasan Produk` 

```
Sistem ini merupakan platform Journal Publisher yang memisahkan fungsi editorial
OJS dengan frontend publik jurnal.
```

```
OJS tetap menjadi sistem utama untuk:
```

```
Manuscript submission
Peer review
Editorial workflow
Issue
Article
Author
DOI
Publication
```

```
Sementara platform Journal Publisher digunakan untuk:
```

```
Mengelola homepage jurnal
Mengelola halaman statis
Mengelola menu
Mengelola banner
Mengelola theme
Mengelola konten dengan rich editor
Mengambil metadata artikel dari OJS
Menghasilkan website statis
Melakukan deployment frontend
```

```
Website publik tidak terhubung langsung ke database OJS maupun database
Publisher.
```

```
2. Tujuan
Tujuan utama
```

```
Membangun arsitektur publikasi jurnal yang:
```

```
Lebih aman.
Lebih stabil.
Tidak bergantung langsung pada OJS saat visitor mengakses website.
Mendukung OJS dengan versi berbeda.
Memungkinkan OJS lama diarsipkan.
Memiliki frontend yang dapat dikustomisasi oleh pengelola jurnal.
Mendukung rich text editor.
Mendukung static site generation.
Mempertahankan URL publik artikel.
Mendukung pengelolaan banyak jurnal dari satu platform.
3. Non-Goals
```

```
Sistem tidak menggantikan OJS.
```

```
Tidak termasuk:
```

```
Manuscript submission
Peer review
Editorial workflow
Reviewer management
```

```
Editorial decision
DOI registration
Production workflow OJS
```

```
Semua fungsi tersebut tetap menjadi tanggung jawab OJS.
```

# `4. Konsep Arsitektur` 

```
                         ┌─────────────────────┐
                         │        OJS          │
                         │                     │
                         │ Editorial System    │
                         │ Article             │
                         │ Issue               │
                         │ Author              │
                         │ DOI                 │
                         └──────────┬──────────┘
                                    │
                              OAI-PMH / API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    OAI Gateway      │
                         │                     │
                         │ Harvesting           │
                         │ Normalization        │
                         │ Cache                │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Journal Publisher   │
                         │      NestJS         │
                         │                     │
                         │ Pages               │
                         │ Rich Editor         │
                         │ Menu                │
                         │ Theme               │
                         │ Media               │
                         │ Build               │
                         └──────────┬──────────┘
                                    │
                              Build Job
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Svelte Static       │
                         │ Builder             │
                         └──────────┬──────────┘
                                    │
                              Static Output
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Nginx / CDN / MinIO │
                         └──────────┬──────────┘
                                    │
                                    ▼
                              Public User
```

```
5. Prinsip Utama
```

```
5.1 Separation of Concerns
```

```
OJS:
```

```
Editorial
```

```
Publisher:
```

```
Presentation
```

```
Static frontend:
Public delivery
5.2 Static First
```

```
Website publik harus dapat berjalan tanpa:
```

```
PostgreSQL
NestJS
Redis
OJS
PHP
```

```
Setelah build selesai, website hanya membutuhkan:
```

```
HTML
CSS
JavaScript
Images
PDF
6. Modul Sistem
```

```
6.1 Journal Management
```

```
Admin dapat membuat dan mengelola jurnal.
```

```
Data:
```

```
Journal
├── Name
├── Acronym
├── ISSN
├── EISSN
├── Description
├── Logo
├── Domain
├── OJS URL
├── OAI Endpoint
├── Theme
└── Status
Contoh:
```

```
Journal of Public Health
JPH
eISSN: xxxx-xxxx
7. OAI Gateway
Fungsi
Harvest metadata
Normalisasi metadata
Cache metadata
Menyimpan synchronization state
Menangani resumptionToken
Incremental harvesting
Multi-OJS support
Metadata minimal
Article
```

```
OAI Gateway menjadi lapisan antara OJS dan Publisher.
```

```
├── title
├── abstract
├── authors
├── keywords
├── publicationDate
├── DOI
├── volume
├── issue
├── pages
├── URL
├── PDF URL
└── OAI identifier
8. OAI Synchronization
Sistem mendukung:
```

```
Manual
[Sync Now]
Scheduled
Every 10 minutes
Event/Webhook
```

```
Jika OJS mendukung mekanisme yang diperlukan:
```

```
OJS
 ↓
Webhook
 ↓
Publisher
9. Incremental Synchronization
```

```
Sistem tidak mengambil seluruh data setiap kali.
```

```
Contoh:
```

```
Last Sync:
2026-08-19 10:00
```

```
Current:
2026-08-19 10:10
Publisher meminta:
from=2026-08-19T10:00:00
Hanya data baru/perubahan yang diproses.
```

```
10. Content Management
Publisher memiliki CMS ringan untuk konten frontend.
Content Type
Pages
Posts/Announcements
Menus
Blocks
Settings
11. Rich Text Editor
Admin dapat mengedit halaman menggunakan rich editor.
Fitur minimal:
```

```
Bold
Italic
Heading
Paragraph
List
Ordered list
Link
Image
Quote
Table
Code
Alignment
Undo/redo
```

```
Rekomendasi:
Tiptap
```

```
12. Penyimpanan Rich Content
```

```
Konten tidak disarankan hanya disimpan sebagai HTML.
Gunakan struktur JSON:
content_json
Contoh:
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": {
        "level": 2
      },
      "content": [
        {
          "type": "text",
          "text": "About Our Journal"
        }
      ]
    }
  ]
}
```

```
Svelte kemudian melakukan rendering JSON tersebut.
13. Page Builder
```

```
MVP dapat menggunakan model block sederhana.
Block:
```

```
Hero
RichText
Image
ArticleList
IssueList
EditorialTeam
Callout
Button
HTML
```

```
Contoh homepage:
```

```
Homepage
│
├── Hero
├── RichText
├── LatestArticles
├── LatestIssues
├── EditorialTeam
└── RichText
14. Theme System
```

```
Theme bertanggung jawab terhadap:
```

```
Layout
Typography
Colors
Header
Footer
Navigation
Block rendering
Article layout
Issue layout
Contoh:
themes/
├── default
├── modern
└── journal
```

```
Admin dapat memilih:
```

```
Journal
 ↓
Theme
 ↓
Theme Settings
15. Theme Settings
Admin dapat mengatur:
```

```
Logo
Primary Color
Secondary Color
Font
Header
Footer
Social Media
Hero
Navigation
Tanpa mengubah source code theme.
```

```
16. Static Builder
```

```
Static Builder bertugas menggabungkan:
```

```
OAI Data
+
CMS Content
+
Theme
+
```

```
Settings
menjadi:
Static Website
```

```
Flow:
```

```
Database
   ↓
Fetch Data
   ↓
Load Theme
   ↓
Render Svelte
   ↓
Generate HTML
   ↓
Copy Assets
   ↓
Deploy
17. Struktur Output
```

```
Contoh:
```

```
dist/
├── index.html
├── about/
│   └── index.html
├── editorial-team/
│   └── index.html
├── issues/
│   ├── index.html
│   └── volume-21-no-3/
│       └── index.html
├── articles/
│   ├── article-a/
│   │   └── index.html
│   └── article-b/
│       └── index.html
├── assets/
└── files/
18. Publish Workflow
```

```
Admin:
```

```
Edit
 ↓
Save Draft
 ↓
Preview
 ↓
Publish
```

```
Publish:
```

```
Create Build Job
       ↓
Build
       ↓
Validate
       ↓
Upload
       ↓
```

```
Activate Release
19. Atomic Deployment
```

```
Setiap build memiliki release.
```

```
releases/
├── 100/
├── 101/
└── 102/
```

```
Production:
current → 102
Jika build 103 gagal:
current → 102
Website tidak berubah.
20. Incremental Build
Sistem harus menentukan halaman yang terdampak.
Misalnya artikel baru:
Article A
maka rebuild:
```

```
/articles/article-a/
/issues/volume-21-no-3/
/articles/
/index.html
Tidak perlu rebuild seluruh website.
```

```
21. Preview
```

```
Admin dapat melihat draft sebelum publish.
Flow:
Draft
 ↓
Preview Build
 ↓
Private Preview URL
Contoh:
preview.journal.unej.ac.id/build/123
Preview tidak mengubah production.
```

```
22. Versioning
```

```
Konten sebaiknya memiliki:
```

```
Draft
Published
Archived
Setiap publish menghasilkan:
```

```
Content Version
```

```
Sehingga admin dapat melakukan:
```

```
Rollback
```

```
ke versi sebelumnya.
```

```
23. Article Mirror
```

```
Artikel yang berasal dari OJS akan memiliki halaman static.
```

```
Contoh:
```

```
/articles/strategi-keamanan-ojs/
```

```
Menampilkan:
```

```
Title
Authors
Abstract
Keywords
DOI
Volume
Issue
Pages
Publication Date
Download PDF
24. OJS Independence
```

```
Frontend tidak boleh melakukan request langsung ke OJS.
```

```
Tidak boleh:
```

```
Browser
 ↓
OJS
```

```
Yang diperbolehkan:
```

```
OJS
 ↓
OAI Gateway
 ↓
Publisher
 ↓
Static Build
 ↓
Browser
25. Ketika OJS Mati
```

```
Jika OJS mengalami downtime:
```

```
OJS ❌
```

```
website tetap:
```

```
Frontend ❌
Articles ❌
Issues ❌
Pages ❌
PDF ❌
```

```
Hanya:
Sync baru ❌
yang tertunda.
26. Ketika OJS Diganti
```

```
Contoh:
```

```
OJS 3.x lama
       ↓
Archive
       ↓
OJS LTS baru
Publisher tetap menggunakan model metadata internal:
NormalizedArticle
```

```
Sehingga frontend tidak perlu mengetahui apakah sumbernya:
OJS lama
OJS baru
OJS berbeda
27. Multi-Journal
```

```
Satu Publisher dapat menangani banyak jurnal:
```

```
Publisher
│
├── Journal A
│   └── OJS A
│
├── Journal B
│   └── OJS B
│
├── Journal C
│   └── OJS C
│
└── Journal D
    └── OJS D
```

```
Setiap jurnal memiliki:
```

```
OJS connection
OAI configuration
Domain
Theme
Content
Menu
Build
Static storage
28. Multi-Domain
```

```
Contoh:
```

```
journal-a.unej.ac.id
journal-b.unej.ac.id
journal-c.unej.ac.id
```

```
Masing-masing diarahkan ke static output jurnal.
```

```
29. Dashboard
```

```
Dashboard minimal:
```

```
Dashboard
├── Journals
├── Pages
├── Articles
├── Issues
├── Menus
├── Media
├── Theme
├── OAI Sync
├── Builds
├── Deployments
└── Settings
30. Build Monitoring
Dashboard menampilkan:
Build #102
```

```
Status: SUCCESS
```

```
Pages:       124
Articles:    1,254
Assets:      532
Duration:    43 sec
Started:     10:20
Finished:    10:21
Jika gagal:
Build #103
```

```
Status: FAILED
```

```
Error:
Theme rendering failed
```

```
[View Logs]
[Retry]
[Rollback]
31. Security
OJS
```

```
OJS tidak diekspos sebagai frontend utama.
```

```
Publisher API
```

```
Wajib:
```

```
Authentication
Authorization
Rate limiting
Audit log
```

```
Input validation
CORS restriction
Static frontend
Tidak memiliki:
```

```
Database credential
API secret
OJS credential
Admin credential
32. OAI Credential Security
```

```
Jika OJS membutuhkan credential:
OJS Credential
       ↓
Secret Storage
       ↓
NestJS Worker
Credential tidak boleh masuk:
frontend
static HTML
JavaScript
Git repository
33. Media
```

```
Media frontend disimpan terpisah dari OJS.
```

```
Contoh:
```

```
MinIO
└── journals/
    └── journal-a/
        ├── logo/
        ├── banner/
        └── pages/
```

```
PDF artikel dapat:
```

```
Tetap dilayani dari OJS; atau
Dimirror ke storage universitas.
```

```
Untuk keberlanjutan jangka panjang, mirroring PDF lebih ideal jika kebijakan
penyimpanan dan hak akses memungkinkan.
```

```
34. Teknologi
Backend
NestJS
TypeScript
PostgreSQL
Redis
BullMQ
Frontend
Svelte
SvelteKit / Svelte Static Adapter
TypeScript
Editor
Tiptap
Storage
MinIO
Web Server
Nginx
```

```
Deployment
Docker
35. Database Utama
```

```
Minimal:
```

```
journals
journal_sources
pages
page_versions
menus
menu_items
media
themes
theme_settings
articles
issues
authors
builds
build_pages
deployments
sync_runs
sync_items
```

```
Relasi utama:
```

```
Journal
 ├── Source
 ├── Pages
 ├── Menus
 ├── Theme
 ├── Articles
 ├── Issues
 └── Builds
36. API Utama
Journal
GET    /journals
POST   /journals
GET    /journals/:id
PUT    /journals/:id
DELETE /journals/:id
Pages
GET    /journals/:id/pages
POST   /journals/:id/pages
GET    /pages/:id
PUT    /pages/:id
DELETE /pages/:id
POST   /pages/:id/publish
OAI
POST /journals/:id/sync
GET  /journals/:id/sync/runs
GET  /journals/:id/sync/status
Build
POST /journals/:id/build
GET  /journals/:id/builds
GET  /builds/:id
POST /builds/:id/retry
POST /builds/:id/rollback
37. Acceptance Criteria MVP
Journal
Admin dapat membuat jurnal.
Admin dapat memasukkan OAI endpoint.
Sistem dapat melakukan OAI harvesting.
Metadata artikel tersimpan secara normalized.
```

```
Content
Admin dapat membuat halaman.
Admin dapat menggunakan rich editor.
Admin dapat menyimpan draft.
Admin dapat preview.
Admin dapat publish.
Static
Publisher dapat menghasilkan static HTML.
Website dapat berjalan tanpa API.
Website dapat berjalan tanpa database.
Artikel dapat diakses secara static.
Issue dapat diakses secara static.
Deployment
Build memiliki version.
Build gagal tidak merusak production.
Admin dapat rollback.
Build dapat dilakukan secara asynchronous.
38. MVP Scope
Phase 1
Journal Management
OAI Harvesting
Article Metadata
Page Management
Rich Editor
Theme
Static Build
Nginx Deployment
Phase 2
Incremental Build
Preview
Versioning
Rollback
MinIO
Multi-Journal
Multi-Domain
Phase 3
Central OAI Gateway
Automatic Synchronization
OJS Version Migration Support
Analytics
Advanced Page Builder
CDN
Automated Disaster Recovery
39. Target Akhir
```

```
Target arsitektur final:
```

```
                       UNIVERSITAS JEMBER
                              │
                  ┌───────────┴───────────┐
                  │                       │
              OJS Cluster            Publisher
                  │                       │
        ┌─────────┼─────────┐             │
        │         │         │             │
      OJS LTS   OJS LTS   OJS LTS        │
        │         │         │             │
        └─────────┼─────────┘             │
                  │                       │
                  ▼                       │
             OAI Gateway ◄───────────────┘
                  │
                  ▼
           Normalized Metadata
```

```
                  │
                  ▼
           Svelte Static Builder
                  │
                  ▼
             Static Releases
                  │
                  ▼
              MinIO / Nginx
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
     Journal A Journal B Journal C
Prinsip akhirnya
```

```
OJS adalah sumber editorial. Publisher adalah pengelola presentasi. Svelte
adalah mesin publikasi. Static frontend adalah layanan publik.
```

```
Dengan model ini, admin tetap mendapatkan pengalaman CMS modern dengan rich
editor, tetapi pengunjung tidak pernah perlu terhubung ke database atau OJS.
Perubahan dari OJS maupun perubahan frontend admin sama-sama masuk ke build
pipeline, kemudian menghasilkan release static baru.
```

