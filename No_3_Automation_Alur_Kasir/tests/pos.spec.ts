import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const URL = pathToFileURL(path.resolve(__dirname, '../pos.html')).href;
const rp = (n: number) => 'Rp' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ----- helper -----
async function tambah(page: Page, item: string, qty = 1) {
  for (let i = 0; i < qty; i++) await page.locator(`[data-add="${item}"]`).click();
}
const pilihMetode = (page: Page, m: 'tunai' | 'qris' | 'split') => page.selectOption('#metode', m);
const pakaiDiskon = (page: Page) => page.locator('#cb-diskon').check();
const isiTunai = (page: Page, n: number) => page.locator('#cash-in').fill(String(n));
const qrisBerhasil = (page: Page) => page.locator('#qris-ok').click();
const proses = (page: Page) => page.locator('#btn-proses').click();

const expectTotal = async (page: Page, subtotal: number, diskon: number) => {
  await expect(page.locator('#subtotal')).toHaveText(rp(subtotal));
  await expect(page.locator('#diskon')).toHaveText(rp(diskon));
  await expect(page.locator('#total')).toHaveText(rp(subtotal - diskon));
};
const expectSelesai = (page: Page) =>
  expect(page.locator('#status-sale')).toHaveText('Pembayaran disetujui, transaksi selesai');
const expectGagal = async (page: Page, pesan: string) => {
  await expect(page.locator('#pesan-error')).toHaveText(pesan);
  await expect(page.locator('#status-sale')).toHaveText('');
};

test.beforeEach(async ({ page }) => {
  await page.goto(URL);
});

// ===== A. Split payment 40:60 (tunai + QRIS) =====
test.describe('Split payment 40:60', () => {
  test('SP-01 Split payment total Rp100.000', async ({ page }) => {
    await tambah(page, 'kopi', 4); // 100.000
    await pilihMetode(page, 'split');
    await expect(page.locator('#cash-due')).toHaveText('Rp40.000');
    await expect(page.locator('#qris-due')).toHaveText('Rp60.000');
    await isiTunai(page, 40000);
    await qrisBerhasil(page);
    await proses(page);
    await expectSelesai(page);
    await expect(page.locator('#kembalian')).toHaveText('Rp0');
  });

  test('SP-02 Split payment dengan diskon (total Rp108.000)', async ({ page }) => {
    await tambah(page, 'susu', 4); // 120.000
    await pakaiDiskon(page);
    await pilihMetode(page, 'split');
    await expectTotal(page, 120000, 12000);
    await expect(page.locator('#cash-due')).toHaveText('Rp43.200');
    await expect(page.locator('#qris-due')).toHaveText('Rp64.800');
    await isiTunai(page, 43200);
    await qrisBerhasil(page);
    await proses(page);
    await expectSelesai(page);
  });

  test('SP-03 Uang tunai lebih besar, kembalian dihitung', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await isiTunai(page, 50000);
    await qrisBerhasil(page);
    await proses(page);
    await expectSelesai(page);
    await expect(page.locator('#kembalian')).toHaveText('Rp10.000');
  });

  test('SP-04 Uang tunai kurang dari bagian tunai', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await isiTunai(page, 30000);
    await qrisBerhasil(page);
    await proses(page);
    await expectGagal(page, 'Uang tunai kurang');
  });

  test('SP-05 Uang tunai tidak diisi', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await qrisBerhasil(page);
    await proses(page);
    await expectGagal(page, 'Uang tunai kurang');
  });

  test('SP-06 Pembayaran QRIS gagal', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await isiTunai(page, 40000);
    await page.locator('#qris-fail').click();
    await expect(page.locator('#qris-status')).toHaveText('QRIS gagal');
    await proses(page);
    await expectGagal(page, 'Pembayaran QRIS belum berhasil');
  });

  test('SP-07 QRIS belum dibayar', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await isiTunai(page, 40000);
    await proses(page);
    await expectGagal(page, 'Pembayaran QRIS belum berhasil');
  });

  test('SP-08 Nominal split ikut berubah saat keranjang berubah', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await expect(page.locator('#cash-due')).toHaveText('Rp40.000');
    await tambah(page, 'roti'); // total 115.000
    await expect(page.locator('#cash-due')).toHaveText('Rp46.000');
    await expect(page.locator('#qris-due')).toHaveText('Rp69.000');
  });

  test('SP-09 Struk menampilkan kedua metode pembayaran', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await isiTunai(page, 40000);
    await qrisBerhasil(page);
    await proses(page);
    await expect(page.locator('#struk')).toContainText('Tunai: Rp40.000');
    await expect(page.locator('#struk')).toContainText('QRIS: Rp60.000');
    await expect(page.locator('#struk')).toContainText('Total: Rp100.000');
  });

  test('SP-10 Ganti metode dari split ke tunai penuh', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pilihMetode(page, 'split');
    await pilihMetode(page, 'tunai');
    await expect(page.locator('#cash-due')).toHaveText('Rp100.000');
    await expect(page.locator('#qris-section')).toBeHidden();
  });

  test('SP-11 Bayar dengan keranjang kosong', async ({ page }) => {
    await pilihMetode(page, 'split');
    await proses(page);
    await expectGagal(page, 'Keranjang kosong');
  });
});

// ===== B. Diskon minimal belanja Rp100.000 =====
test.describe('Diskon minimal belanja Rp100.000', () => {
  test('DS-01 Belanja tepat Rp100.000 mendapat diskon', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pakaiDiskon(page);
    await expectTotal(page, 100000, 10000);
    await expect(page.locator('#info-diskon')).toHaveText('Diskon 10% diterapkan');
  });

  test('DS-02 Belanja Rp99.500 (di bawah batas) tidak dapat diskon', async ({ page }) => {
    await tambah(page, 'kopi', 3);
    await tambah(page, 'snack'); // 75.000 + 24.500
    await pakaiDiskon(page);
    await expectTotal(page, 99500, 0);
    await expect(page.locator('#info-diskon')).toContainText('Diskon tidak berlaku');
  });

  test('DS-03 Belanja Rp100.500 (di atas batas) dapat diskon', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await tambah(page, 'permen');
    await pakaiDiskon(page);
    await expectTotal(page, 100500, 10050);
  });

  test('DS-04 Beberapa jenis barang mencapai Rp100.000', async ({ page }) => {
    await tambah(page, 'kopi', 2);
    await tambah(page, 'roti', 2);
    await tambah(page, 'teh', 2); // 50.000 + 30.000 + 20.000
    await pakaiDiskon(page);
    await expectTotal(page, 100000, 10000);
  });

  test('DS-05 Satu jenis barang dengan qty banyak', async ({ page }) => {
    await tambah(page, 'teh', 10);
    await expect(page.locator('tr[data-item=teh] .qty')).toHaveText('10');
    await pakaiDiskon(page);
    await expectTotal(page, 100000, 10000);
  });

  test('DS-06 Belanja di atas batas tapi diskon tidak dipilih', async ({ page }) => {
    await tambah(page, 'kopi', 5);
    await expectTotal(page, 125000, 0);
    await expect(page.locator('#info-diskon')).toHaveText('');
  });

  test('DS-07 Hapus barang sampai di bawah batas, diskon hilang', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pakaiDiskon(page);
    await expectTotal(page, 100000, 10000);
    await page.locator('tr[data-item=kopi] .kurang').click(); // qty 3 = 75.000
    await expectTotal(page, 75000, 0);
  });

  test('DS-08 Tambah barang sampai melewati batas, diskon muncul', async ({ page }) => {
    await tambah(page, 'kopi', 3);
    await tambah(page, 'snack'); // 99.500
    await pakaiDiskon(page);
    await expectTotal(page, 99500, 0);
    await tambah(page, 'permen'); // 100.000
    await expectTotal(page, 100000, 10000);
  });

  test('DS-09 Total beberapa barang tanpa diskon', async ({ page }) => {
    await tambah(page, 'kopi', 2);
    await tambah(page, 'roti');
    await expectTotal(page, 65000, 0);
  });

  test('DS-10 Diskon + bayar tunai, struk menampilkan diskon', async ({ page }) => {
    await tambah(page, 'kopi', 4);
    await pakaiDiskon(page);
    await isiTunai(page, 100000);
    await proses(page);
    await expectSelesai(page);
    await expect(page.locator('#struk')).toContainText('Diskon: Rp10.000');
    await expect(page.locator('#struk')).toContainText('Total: Rp90.000');
    await expect(page.locator('#kembalian')).toHaveText('Rp10.000');
  });
});

// ===== C. Alur transaksi sesuai flowchart =====
test.describe('Alur transaksi', () => {
  test('AL-01 Bayar QRIS penuh', async ({ page }) => {
    await tambah(page, 'kopi', 2);
    await pilihMetode(page, 'qris');
    await expect(page.locator('#cash-section')).toBeHidden();
    await expect(page.locator('#qris-due')).toHaveText('Rp50.000');
    await qrisBerhasil(page);
    await proses(page);
    await expectSelesai(page);
  });

  test('AL-02 Bayar tunai penuh dengan kembalian', async ({ page }) => {
    await tambah(page, 'kopi', 2);
    await isiTunai(page, 100000);
    await proses(page);
    await expectSelesai(page);
    await expect(page.locator('#kembalian')).toHaveText('Rp50.000');
  });

  test('AL-03 Opsi struk belum tampil sebelum pembayaran selesai', async ({ page }) => {
    await tambah(page, 'kopi');
    await expect(page.locator('#btn-cetak')).toBeHidden();
    await expect(page.locator('#btn-digital')).toBeHidden();
  });

  test('AL-04 Cetak struk setelah transaksi selesai', async ({ page }) => {
    await tambah(page, 'kopi');
    await isiTunai(page, 25000);
    await proses(page);
    await page.locator('#btn-cetak').click();
    await expect(page.locator('#struk-msg')).toHaveText('Struk dicetak');
  });

  test('AL-05 Kirim struk digital setelah transaksi selesai', async ({ page }) => {
    await tambah(page, 'kopi');
    await isiTunai(page, 25000);
    await proses(page);
    await page.locator('#btn-digital').click();
    await expect(page.locator('#struk-msg')).toHaveText('Struk digital terkirim');
  });

  test('AL-06 Transaksi baru mengosongkan keranjang', async ({ page }) => {
    await tambah(page, 'kopi');
    await isiTunai(page, 25000);
    await proses(page);
    await page.locator('#btn-baru').click();
    await expect(page.locator('#cart tr')).toHaveCount(0);
    await expect(page.locator('#subtotal')).toHaveText('Rp0');
    await expect(page.locator('#status-sale')).toHaveText('');
  });
});
