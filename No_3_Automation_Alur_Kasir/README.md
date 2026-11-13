# Automation Testing - Alur Kasir (Flowchart)

Soal nomor 3 hanya berisi flowchart tanpa aplikasi, jadi dibuat halaman kasir
tiruan `pos.html` yang mengikuti alur flowchart:
pilih barang -> (opsional) diskon -> hitung total -> proses pembayaran ->
transaksi selesai -> cetak / kirim struk digital.

Aturan bisnis (diskon 10%, split 40% tunai : 60% QRIS, produk dan harga)
adalah asumsi; daftarnya ada di sheet "Asumsi" pada file test case.

## Cara menjalankan
    npm install
    npx playwright install chromium
    npx playwright test
    npx playwright show-report

ID di `tests/pos.spec.ts` sama dengan ID di file test case.
