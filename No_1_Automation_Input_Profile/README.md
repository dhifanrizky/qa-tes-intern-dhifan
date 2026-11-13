# Automation Testing - Input Your Profile

Soal hanya memberikan gambar (tidak ada aplikasi/URL), jadi saya buat halaman
tiruan `profile.html` yang mengikuti gambar, lalu di-test pakai Playwright.
Aturan validasi (maks karakter, format, dll.) adalah asumsi, daftarnya ada di
sheet "Asumsi" pada file test case.

## Cara menjalankan
    npm install
    npx playwright install chromium
    npx playwright test
    npx playwright show-report

ID di `tests/profile.spec.ts` (TC-01 dst.) sama dengan ID di file test case.
