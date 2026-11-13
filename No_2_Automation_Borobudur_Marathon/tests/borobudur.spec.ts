import { test, expect, Page } from '@playwright/test';

/*
  Automation untuk https://borobudurmarathon.com
  - Hanya pengujian read-only (tidak mendaftar / membayar / kirim data).
  - ID test (TW-xx) sama dengan sheet "Test Case" di file Excel.
  - Test yang bertanda BUG-xx memang diharapkan GAGAL sementara bug belum diperbaiki
    (detailnya ada di sheet "Bug Report").
*/

const MENU = {
  'The Race': ['Race Category', 'Rules & Regulations', 'Prizes', 'Course Map', 'FAQ', 'Race Results'],
  'Program': ['Bank Jateng Friendship Run', 'Bank Jateng Young Talent'],
  'Media': ['Gallery', 'Race Guide'],
  'Contact': ['Sponsors', 'Contact Us'],
};

const HALAMAN = [
  ['Race Category', '/bank-jateng-borobudur-marathon-2026/'],
  ['Rules & Regulations', '/rules-regulations/'],
  ['Prizes', '/prizes-2026/'],
  ['Course Map', '/course-map/'],
  ['FAQ', '/faq/'],
  ['Race Results', '/race-results/'],
  ['Friendship Run', '/friendship-run-program/'],
  ['Young Talent', '/id/young-talent-2026/'],
  ['Gallery', '/gallery/'],
  ['Race Guide', '/race-guide/'],
  ['Sponsors', '/sponsors/'],
  ['Contact Us', '/contact/'],
  ['Apps', '/apps/'],
  ['Merchandise', '/official-merchandise/'],
];

const link = (page: Page, nama: string) =>
  page.getByRole('link', { name: nama, exact: true }).first();

async function bukaSubmenu(page: Page, induk: string) {
  await page.getByRole('link', { name: induk, exact: true }).first().hover();
}

// ===== Navigasi =====
  test.describe('Navigasi', () => {
  test('TW-01 Halaman utama terbuka', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/Borobudur Marathon/);
    await expect(page.getByRole('heading', { name: 'DECADE OF LEGACY' })).toBeVisible();
  });

  for (const [induk, anak] of Object.entries(MENU)) {
    const id = { 'The Race': 'TW-02', Program: 'TW-03', Media: 'TW-04', Contact: 'TW-05' }[induk];
    test(`${id} Submenu "${induk}" tampil saat di-hover`, async ({ page }) => {
      await page.goto('/');
      await bukaSubmenu(page, induk);
      for (const nama of anak) {
        await expect(link(page, nama)).toBeVisible();
      }
    });
  }

  test('TW-06 Klik FAQ dari menu The Race', async ({ page }) => {
    await page.goto('/');
    await bukaSubmenu(page, 'The Race');
    await link(page, 'FAQ').click();
    await expect(page).toHaveURL(/\/faq\/?$/);
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
  });

  test('TW-07 Klik logo kembali ke halaman utama', async ({ page }) => {
  await page.goto('/contact/');
  await page
    .locator(
      'a[href="https://borobudurmarathon.com/"]:has(img):visible, ' +
      'a[href="https://www.borobudurmarathon.com/"]:has(img):visible, ' +
      'a[href="/"]:has(img):visible'
    )
    .first()
    .click();
  await expect(page).toHaveURL(/^https:\/\/(www\.)?borobudurmarathon\.com\/?$/);
  });

  for (const [nama, path] of HALAMAN) {
    test(`TW-08 Halaman bisa dibuka: ${nama}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status(), `status ${path}`).toBeLessThan(400);
      await expect(page).not.toHaveTitle(/404|not found/i);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  }
});

// ===== Isi halaman =====
test.describe('Isi halaman', () => {
  test('TW-09 Race Category: tanggal dan 3 jarak lomba', async ({ page }) => {
    await page.goto('/bank-jateng-borobudur-marathon-2026/');
    await expect(page.getByRole('heading', { name: 'Bank Jateng Borobudur Marathon 2026', level: 1 })).toBeVisible();
    await expect(page.getByText('Sunday, November 15th 2026').first()).toBeVisible();
    await expect(page.getByText('42.195 kilometer')).toBeVisible();
    await expect(page.getByText('21.097 kilometers')).toBeVisible();
    await expect(page.getByText('10 kilometers distance')).toBeVisible();
  });

  test('TW-10 FAQ: 5 kategori pertanyaan tampil', async ({ page }) => {
  await page.goto('/faq/');
  const kategori: [RegExp, string][] = [
    [/^Bank Jateng Borobudur Marathon 2026$/, 'FAQ Bank Jateng Borobudur Marathon 2026'],
    [/^Shu(t+)l?e Bus/, 'FAQ Shuttle Bus Bank Jateng Borobudur Marathon 2026'], // judul memang typo "Shutte" (BUG-04)
    [/^Bank Jateng Friendship Run 2026$/, 'FAQ Bank Jateng Friendship Run 2026'],
    [/^Saveduit Bank Jateng Program$/, 'FAQ Saveduit Bank Jateng Program'],
    [/^Apps$/, 'FAQ Apps'],
  ];

  for (const [judul, teksFaq] of kategori) {
    const tombol = page.locator('a', { hasText: teksFaq }).first();
    if (!(await tombol.isVisible())) {
      await page.getByRole('heading', { level: 4 }).filter({ hasText: judul }).getByRole('link').click();
    }
    await expect(tombol).toBeVisible();
  }
  });

  test('TW-11 FAQ: setiap link kategori bisa dibuka', async ({ page }) => {
    await page.goto('/faq/');
    const hrefs = await page.locator('a[href*="faq-"], a[href*="frequently-asked-questions"]').evaluateAll(
      els => [...new Set(els.map(e => (e as HTMLAnchorElement).href))]
    );
    expect(hrefs.length).toBeGreaterThanOrEqual(5);
    for (const h of hrefs) {
      const res = await page.request.get(h);
      expect(res.status(), h).toBeLessThan(400);
    }
  });

  test('TW-12 Contact Us: email dan Instagram', async ({ page }) => {
    await page.goto('/contact/');
    await expect(page.getByRole('heading', { name: 'Contact Us', level: 1 })).toBeVisible();
    await expect(page.locator('a[href="mailto:info@borobudurmarathon.com"]')).toBeVisible();
    await expect(page.getByRole('link', { name: '@borobudur.marathon' })).toBeVisible();
  });
});

// ===== Bahasa =====
test.describe('Bahasa', () => {
  test('TW-13 Ganti bahasa EN ke ID di halaman Contact', async ({ page }) => {
    await page.goto('/contact/');
    await page.getByRole('link', { name: 'Bahasa Indonesia' }).first().click();
    await expect(page).toHaveURL(/\/id\/kontak\/?$/);
  });

  test('TW-14 Ganti bahasa ID ke EN', async ({ page }) => {
    await page.goto('/id/kontak/');
    await page.getByRole('link', { name: 'English' }).first().click();
    await expect(page).toHaveURL(/\/contact\/?$/);
  });

  test('TW-15 Halaman utama versi Indonesia terbuka', async ({ page }) => {
    const res = await page.goto('/id/');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

// ===== Registrasi (hanya cek link, tidak mendaftar) =====
test('TW-16 Tombol registrasi mengarah ke my.borobudurmarathon.com', async ({ page, request }) => {
  await page.goto('/');
  const a = page.locator('a[href^="https://my.borobudurmarathon.com"]').first();
  await expect(a).toHaveCount(1);
  const href = await a.getAttribute('href');
  const res = await request.get(href!);
  expect(res.status()).toBeLessThan(400);
});

// ===== Link dan konten =====
test.describe('Link dan konten', () => {
  test('TW-18 Smoke test: link internal di halaman utama tidak rusak', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href]').evaluateAll(els =>
      [...new Set(els.map(e => (e as HTMLAnchorElement).href))].filter(
        h => /^https?:\/\/(www\.)?borobudurmarathon\.com/.test(h) && !h.includes('#')
      )
    );
    const rusak: string[] = [];
    for (const h of hrefs) {
      const res = await request.get(h);
      if (res.status() >= 400) rusak.push(`${res.status()} ${h}`);
    }
    expect(rusak, 'link rusak').toEqual([]);
  });

  test('TW-19 Link sosial media di footer', async ({ page }) => {
    await page.goto('/');
    for (const kunci of ['facebook.com/BorobudurMarathon', 'twitter.com/borobudurmrthn', 'instagram.com/borobudur.marathon', 'youtube.com/c/BorobudurMarathon']) {
      await expect(page.locator(`footer a[href*="${kunci}"], a[href*="${kunci}"]`).first()).toHaveCount(1);
    }
  });

  
  test('TW-20 Semua logo sponsor punya tujuan link', async ({ page }) => {
    await page.goto('/');
    const tanpaLink = await page.locator('a[href="#"] img').evaluateAll(els =>
      els.map(e => (e as HTMLImageElement).src.split('/').pop())
    );
    expect(tanpaLink, 'logo dengan link "#"').toEqual([]);
  });


  test('TW-21 Nama situs di meta tag memakai tahun 2026', async ({ page }) => {
    await page.goto('/');
    const nama = await page.locator('meta[property="og:site_name"]').getAttribute('content');
    expect(nama).toContain('2026');
  });

  test('TW-22 Menu Young Talent di versi English tidak mengarah ke halaman /id/', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator('a[href*="young-talent"]').first().getAttribute('href');
    expect(href).not.toContain('/id/');
  });

  test('TW-23 Tidak ada typo "Shutte" di halaman FAQ', async ({ page }) => {
    await page.goto('/faq/');
    await expect(page.getByText('Shutte Bus')).toHaveCount(0);
  });

    test('TW-24 Gambar di halaman utama termuat', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 150));
      }
    });
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);
    const rusak = await page.evaluate(() =>
      Array.from(document.images)
        .filter(i =>
          i.getAttribute('src') &&             
          i.offsetParent !== null &&            
          i.complete && i.naturalWidth === 0 &&
          !i.src.endsWith('.svg') && !i.src.startsWith('data:'))
        .map(i => i.outerHTML.slice(0, 200))
    );
    expect(rusak, 'gambar gagal dimuat').toEqual([]);
    });
  });

// ===== Responsif =====
test.describe('Responsif (375px)', () => {
  for (const [id, path] of [['TW-25', '/'], ['TW-26', '/contact/']]) {
    test(`${id} Tidak ada horizontal scroll di ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow).toBe(false);
    });
  }
});
