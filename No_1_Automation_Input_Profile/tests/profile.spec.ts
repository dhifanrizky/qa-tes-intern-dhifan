import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

const URL = pathToFileURL(path.resolve(__dirname, '../profile.html')).href;
const BULAN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// data default yang valid, tiap test cukup menimpa field yang mau diuji
const valid = { first: 'Joel', middle: 'K', last: 'Osteen', nick: 'joel01', birth: '17 Aug 1995' };

async function isiForm(page: Page, data: Partial<typeof valid> = {}) {
  const d = { ...valid, ...data };
  await page.locator('#firstName').fill(d.first);
  await page.locator('#middleName').fill(d.middle);
  await page.locator('#lastName').fill(d.last);
  await page.locator('#nickname').fill(d.nick);
  await page.locator('#birthDate').fill(d.birth);
}

const klikSave = (page: Page) => page.locator('#save').click();
const error = (page: Page, field: string) => page.locator(`#${field}-err`);
const sukses = (page: Page) => expect(page.locator('#msg')).toHaveText('Profile saved successfully');
const gagal = (page: Page) => expect(page.locator('#msg')).toHaveText('');

test.beforeEach(async ({ page }) => {
  await page.goto(URL);
});

// TC Tampilan 
test('TC-01 Tampilan awal form', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Input your profile');
  await expect(page.locator('#firstName')).toHaveAttribute('placeholder', 'e.g Joel');
  await expect(page.locator('#middleName')).toHaveAttribute('placeholder', 'e.g K');
  await expect(page.locator('#lastName')).toHaveAttribute('placeholder', 'e.g Osteen');
  await expect(page.locator('#nickname')).toHaveAttribute('placeholder', 'Nickname');
  await expect(page.locator('#birthDate')).toHaveAttribute('placeholder', 'DD MMM YYYY');
  await expect(page.locator('#save')).toBeVisible();
});

test('TC-02 Label (Optional) hanya di Middle dan Last Name', async ({ page }) => {
  await expect(page.locator('.opt')).toHaveCount(2);
  await expect(page.locator('label[for=middleName] .opt')).toBeVisible();
  await expect(page.locator('label[for=lastName] .opt')).toBeVisible();
});

test('TC-03 Gender default Male', async ({ page }) => {
  await expect(page.locator('input[value=Male]')).toBeChecked();
  await expect(page.locator('input[value=Female]')).not.toBeChecked();
});

// TC Kolom First Name 
test('TC-04 First Name valid', async ({ page }) => {
  await isiForm(page, { first: 'Joel' });
  await klikSave(page);
  await sukses(page);
});

test('TC-05 First Name kosong', async ({ page }) => {
  await isiForm(page, { first: '' });
  await klikSave(page);
  await expect(error(page, 'firstName')).toHaveText('First Name is required');
  await gagal(page);
});

test('TC-06 First Name berisi angka', async ({ page }) => {
  await isiForm(page, { first: 'Joel123' });
  await klikSave(page);
  await expect(error(page, 'firstName')).toContainText('letters only');
  await gagal(page);
});

test('TC-07 First Name berisi simbol', async ({ page }) => {
  await isiForm(page, { first: 'Joel@#' });
  await klikSave(page);
  await expect(error(page, 'firstName')).toContainText('letters only');
  await gagal(page);
});

test('TC-08 First Name tepat 30 karakter', async ({ page }) => {
  await isiForm(page, { first: 'A'.repeat(30) });
  await klikSave(page);
  await sukses(page);
});

test('TC-09 First Name 31 karakter', async ({ page }) => {
  await isiForm(page, { first: 'A'.repeat(31) });
  await klikSave(page);
  await expect(error(page, 'firstName')).toContainText('max 30');
  await gagal(page);
});

test('TC-10 First Name hanya spasi', async ({ page }) => {
  await isiForm(page, { first: '   ' });
  await klikSave(page);
  await expect(error(page, 'firstName')).toHaveText('First Name is required');
});

// TC Kolom Middle Name 
test('TC-11 Middle Name kosong tetap bisa disimpan', async ({ page }) => {
  await isiForm(page, { middle: '' });
  await klikSave(page);
  await sukses(page);
});

test('TC-12 Middle Name berisi angka', async ({ page }) => {
  await isiForm(page, { middle: 'K9' });
  await klikSave(page);
  await expect(error(page, 'middleName')).toContainText('letters only');
  await gagal(page);
});

// TC kolom Last Name 
test('TC-13 Last Name kosong tetap bisa disimpan', async ({ page }) => {
  await isiForm(page, { last: '' });
  await klikSave(page);
  await sukses(page);
});

test('TC-14 Last Name berisi simbol', async ({ page }) => {
  await isiForm(page, { last: 'Osteen!' });
  await klikSave(page);
  await expect(error(page, 'lastName')).toContainText('letters only');
  await gagal(page);
});

// TC Kolom Nickname
test('TC-15 Nickname valid', async ({ page }) => {
  await isiForm(page, { nick: 'joel01' });
  await klikSave(page);
  await sukses(page);
});

test('TC-16 Nickname kosong', async ({ page }) => {
  await isiForm(page, { nick: '' });
  await klikSave(page);
  await expect(error(page, 'nickname')).toHaveText('Nickname is required');
  await gagal(page);
});

test('TC-17 Nickname tepat 15 karakter', async ({ page }) => {
  await isiForm(page, { nick: 'a'.repeat(15) });
  await klikSave(page);
  await sukses(page);
});

test('TC-18 Nickname 16 karakter', async ({ page }) => {
  await isiForm(page, { nick: 'a'.repeat(16) });
  await klikSave(page);
  await expect(error(page, 'nickname')).toContainText('max 15');
  await gagal(page);
});

test('TC-19 Nickname berisi spasi dan simbol', async ({ page }) => {
  await isiForm(page, { nick: 'jo el!' });
  await klikSave(page);
  await expect(error(page, 'nickname')).toContainText('letters or numbers only');
  await gagal(page);
});

// TC Kolom Gender
test('TC-20 Pilih Female', async ({ page }) => {
  await page.locator('input[value=Female]').check();
  await expect(page.locator('input[value=Female]')).toBeChecked();
  await expect(page.locator('input[value=Male]')).not.toBeChecked();
});

test('TC-21 Pindah pilihan Female ke Male', async ({ page }) => {
  await page.locator('input[value=Female]').check();
  await page.locator('input[value=Male]').check();
  await expect(page.locator('input[value=Male]')).toBeChecked();
  await expect(page.locator('input[value=Female]')).not.toBeChecked();
});

// TC Birth Date
test('TC-22 Birth Date valid', async ({ page }) => {
  await isiForm(page, { birth: '17 Aug 1995' });
  await klikSave(page);
  await sukses(page);
});

test('TC-23 Birth Date kosong', async ({ page }) => {
  await isiForm(page, { birth: '' });
  await klikSave(page);
  await expect(error(page, 'birthDate')).toHaveText('Birth Date is required');
  await gagal(page);
});

test('TC-24 Birth Date format salah', async ({ page }) => {
  await isiForm(page, { birth: '1995-08-17' });
  await klikSave(page);
  await expect(error(page, 'birthDate')).toContainText('DD MMM YYYY');
  await gagal(page);
});

test('TC-25 Birth Date tidak ada di kalender (31 Feb)', async ({ page }) => {
  await isiForm(page, { birth: '31 Feb 2000' });
  await klikSave(page);
  await expect(error(page, 'birthDate')).toContainText('not valid');
  await gagal(page);
});

test('TC-26 Birth Date di masa depan', async ({ page }) => {
  await isiForm(page, { birth: '01 Jan 2099' });
  await klikSave(page);
  await expect(error(page, 'birthDate')).toContainText('future');
  await gagal(page);
});

test('TC-27 Birth Date hari ini', async ({ page }) => {
  const t = new Date();
  const hariIni = `${String(t.getDate()).padStart(2, '0')} ${BULAN[t.getMonth()]} ${t.getFullYear()}`;
  await isiForm(page, { birth: hariIni });
  await klikSave(page);
  await sukses(page);
});

test('TC-28 29 Feb tahun kabisat (2000)', async ({ page }) => {
  await isiForm(page, { birth: '29 Feb 2000' });
  await klikSave(page);
  await sukses(page);
});

test('TC-29 29 Feb bukan tahun kabisat (2001)', async ({ page }) => {
  await isiForm(page, { birth: '29 Feb 2001' });
  await klikSave(page);
  await expect(error(page, 'birthDate')).toContainText('not valid');
  await gagal(page);
});

// TC Tombol Save 
test('TC-30 Semua field valid', async ({ page }) => {
  await isiForm(page);
  await page.locator('input[value=Female]').check();
  await klikSave(page);
  await sukses(page);
});

test('TC-31 Hanya field wajib yang diisi', async ({ page }) => {
  await isiForm(page, { middle: '', last: '' });
  await klikSave(page);
  await sukses(page);
});

test('TC-32 Semua field kosong', async ({ page }) => {
  await isiForm(page, { first: '', middle: '', last: '', nick: '', birth: '' });
  await klikSave(page);
  await expect(error(page, 'firstName')).toHaveText('First Name is required');
  await expect(error(page, 'nickname')).toHaveText('Nickname is required');
  await expect(error(page, 'birthDate')).toHaveText('Birth Date is required');
  await expect(error(page, 'middleName')).toHaveText('');
  await expect(error(page, 'lastName')).toHaveText('');
  await gagal(page);
});

test('TC-33 Error hilang setelah data diperbaiki', async ({ page }) => {
  await isiForm(page, { first: '' });
  await klikSave(page);
  await expect(error(page, 'firstName')).toHaveText('First Name is required');
  await page.locator('#firstName').fill('Joel');
  await klikSave(page);
  await expect(error(page, 'firstName')).toHaveText('');
  await sukses(page);
});

// TC Navigasi 
test('TC-34 Tombol back', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto(URL);
  await page.locator('#back').click();
  await expect(page).toHaveURL('about:blank');
});
