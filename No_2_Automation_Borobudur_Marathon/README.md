# Live Testing - borobudurmarathon.com (Playwright)

## Menjalankan
    npm install
    npx playwright install chromium
    npx playwright test
    npx playwright show-report

## Catatan
- Hanya pengujian read-only: tidak ada pendaftaran, pembayaran, atau pengiriman data ke website asli.
- ID test (TW-xx) sama dengan file Excel (sheet "Test Case").
- Test TW-20 s/d TW-23 menguji bug yang ditemukan (BUG-01 s/d BUG-04), jadi akan gagal selama bug belum diperbaiki.
- Selector bisa disesuaikan dengan `npx playwright codegen https://borobudurmarathon.com`.
- Jalankan dengan `workers: 1` agar tidak membebani server.
