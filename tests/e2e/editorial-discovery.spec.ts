import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CONSENT_KEY, denyOptionalServices } from './helpers/consent';

const platformSlugs=['what-quiet-arcade-means-at-nocharge','how-nocharge-saves-scores-without-an-account','designing-browser-games-for-more-ways-to-play','how-nocharge-tests-browser-games'] as const;
const collectionSlugs=['keyboard-friendly-browser-games','untimed-or-reduced-pressure-browser-games','browser-games-without-accounts','games-for-a-short-break'] as const;
test.beforeEach(async({page})=>denyOptionalServices(page));

test('publishes platform articles without fake game controls and with accurate metadata',async({page,request})=>{
 await page.goto('/articles/');await expect(page.getByRole('heading',{name:'Platform articles'})).toBeVisible();await expect(page.locator('.articles-grid .article-card')).toHaveCount(16);
 for(const slug of platformSlugs){const path=`/articles/${slug}/`;expect((await request.get(path)).status()).toBe(200);await page.goto(path);await expect(page.locator('.breadcrumbs')).toBeVisible();await expect(page.locator('.article-play').getByRole('link',{name:/Play /})).toHaveCount(0);await expect(page.getByText(/Reviewed by NoCharge/)).toBeVisible();await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://nocharge.net${path}`);const json=(await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');expect(json).toContain('"@type":"Article"');expect(json).toContain('"@type":"BreadcrumbList"');expect(json).not.toContain('"@type":"VideoGame"');}
});

test('recently played is hidden for page views and appears only after meaningful play',async({page})=>{
 await page.goto('/');await expect(page.locator('[data-recently-played]')).toBeHidden();await page.goto('/games/memory-match/');expect(await page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).toBeNull();await page.locator('.mm__card').first().click();await expect.poll(()=>page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).not.toBeNull();await page.goto('/');const recent=page.locator('[data-recently-played="home"]');await expect(recent).toBeVisible();await expect(recent.locator('[data-recent-game="memory-match"]')).toBeVisible();await expect(recent.getByText('Memory')).toBeVisible();await expect(recent.getByText('2–5 min')).toBeVisible();
});

test('orders multiple meaningful game interactions on home and Arcade',async({page})=>{
 await page.goto('/games/memory-match/');await page.locator('.mm__card').first().click();await page.waitForTimeout(5);await page.goto('/games/color-flip/');await page.locator('[data-cf-color]').first().click();
 for(const path of ['/','/arcade/']){await page.goto(path);const section=page.locator('[data-recently-played]:visible');await expect(section).toBeVisible();const ids=await section.locator('[data-recent-game]:visible').evaluateAll(items=>items.map(item=>item.getAttribute('data-recent-game')));expect(ids.slice(0,2)).toEqual(['color-flip','memory-match']);}
});

test('Privacy clear removes recently played and preserves consent',async({page})=>{
 await page.goto('/privacy/');const before=await page.evaluate(key=>localStorage.getItem(key),CONSENT_KEY);await page.evaluate(()=>localStorage.setItem('nocharge:pref:recently-played','[{"gameId":"memory-match","playedAt":1}]'));await page.getByRole('button',{name:'Clear game data'}).click();expect(await page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).toBeNull();expect(await page.evaluate(key=>localStorage.getItem(key),CONSENT_KEY)).toBe(before);await expect(page.locator('[data-game-status]')).toContainText('Recently Played');
});

test('publishes reviewed non-thin collections, sitemap data, and footer navigation',async({page,request})=>{
 await page.goto('/collections/');await expect(page.locator('.collection-grid article')).toHaveCount(4);await expect(page.locator('.site-footer').getByRole('link',{name:'Collections'})).toHaveAttribute('href','/collections/');
 for(const slug of collectionSlugs){const path=`/collections/${slug}/`;await page.goto(path);await expect(page.getByRole('heading',{name:'Inclusion method'})).toBeVisible();expect(await page.locator('.members article').count()).toBeGreaterThanOrEqual(3);const json=(await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');expect(json).toContain('"@type":"CollectionPage"');expect(json).toContain('"@type":"ItemList"');expect(json).toContain('"@type":"BreadcrumbList"');await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://nocharge.net${path}`);}
 const xml=await (await request.get('/sitemap.xml')).text();for(const slug of [...platformSlugs,...collectionSlugs])expect(xml).toContain(`/${slug}/`);
});

test('new discovery surfaces reflow at mobile and practical 200% zoom and pass axe',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('nocharge:pref:recently-played','[{"gameId":"memory-match","playedAt":2},{"gameId":"color-flip","playedAt":1}]'));
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/','/arcade/','/articles/','/articles/how-nocharge-tests-browser-games/','/collections/','/collections/keyboard-friendly-browser-games/']){await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);const results=await new AxeBuilder({page}).analyze();expect(results.violations,`${path}: ${JSON.stringify(results.violations)}`).toEqual([]);}
 await page.setViewportSize({width:640,height:800});await page.goto('/collections/');await page.evaluate(()=>{document.documentElement.style.zoom='2'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('eligible new content keeps the AdSense banner separated without ad interaction',async({page})=>{for(const path of ['/articles/how-nocharge-tests-browser-games/','/collections/','/collections/keyboard-friendly-browser-games/']){await page.goto(path);const banner=page.locator('[data-ad-banner]');await expect(banner).toHaveCount(1);const separated=await page.evaluate(()=>{const main=document.querySelector('main')!.getBoundingClientRect();const ad=document.querySelector('[data-ad-banner]')!.getBoundingClientRect();return ad.top>=main.bottom;});expect(separated).toBe(true);}});
