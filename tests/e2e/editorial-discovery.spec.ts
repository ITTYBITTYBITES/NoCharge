import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { CONSENT_KEY, denyOptionalServices } from './helpers/consent';

const platformSlugs=['what-quiet-arcade-means-at-nocharge','how-nocharge-saves-scores-without-an-account','designing-browser-games-for-more-ways-to-play','how-nocharge-tests-browser-games','five-new-single-player-games-for-quiet-arcade','pass-and-play-two-players-one-device','no-charge-games-free-browser-games-with-no-charge'] as const;
const collectionSlugs=['keyboard-friendly-browser-games','untimed-or-reduced-pressure-browser-games','browser-games-without-accounts','games-for-a-short-break','pass-and-play','no-charge-games','word-games','logic-and-number','originals-only','one-thumb-mobile-friendly','large-tap-targets-low-complexity'] as const;
test.beforeEach(async({page})=>denyOptionalServices(page));

test('publishes platform articles without fake game controls and with accurate metadata',async({page,request})=>{
 await page.goto('/articles/');await expect(page.getByRole('heading',{name:'Platform articles'})).toBeVisible();await expect(page.locator('.articles-grid .article-card')).toHaveCount(47);
 for(const slug of platformSlugs){const path=`/articles/${slug}/`;expect((await request.get(path)).status()).toBe(200);await page.goto(path);await expect(page.locator('.breadcrumbs')).toBeVisible();await expect(page.locator('.article-play').getByRole('link',{name:/Play /})).toHaveCount(0);await expect(page.getByText(/Reviewed by NoCharge/)).toBeVisible();await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://nocharge.net${path}`);const json=(await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');expect(json).toContain('"@type":"Article"');expect(json).toContain('"@type":"BreadcrumbList"');expect(json).not.toContain('"@type":"VideoGame"');}
});

test('recently played is hidden for page views and appears only after meaningful play',async({page})=>{
 await page.goto('/');const emptyRecent=page.locator('[data-recently-played="home"]');await expect(emptyRecent).toBeHidden();await expect(emptyRecent.getByRole('heading',{name:'Recently Played'})).toBeHidden();await page.goto('/games/memory-match/');expect(await page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).toBeNull();await page.locator('[data-game-root="memory-match"] .mm__card').first().click();await expect.poll(()=>page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).not.toBeNull();await page.goto('/');const recent=page.locator('[data-recently-played="home"]');await expect(recent).toBeVisible();const memoryCard=recent.locator('[data-recent-game="memory-match"]');await expect(memoryCard).toHaveCount(1);await expect(memoryCard).toBeVisible();await expect(page.locator('#games .game-card',{hasText:'Memory Match'})).toHaveCount(1);await expect(memoryCard.getByRole('heading',{name:'Memory Match',exact:true})).toBeVisible();await expect(memoryCard.locator('.game-card__meta span').filter({hasText:/^Memory$/})).toHaveText('Memory');await expect(memoryCard.locator('.game-card__meta span').filter({hasText:/^2–5 min$/})).toHaveText('2–5 min');
});

test('Recently Played reuses the canonical game artwork metadata',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>localStorage.setItem('nocharge:pref:recently-played','[{"gameId":"memory-match","playedAt":1}]'));
 await page.reload();
 const recentCard=page.locator('[data-recently-played="home"] [data-recent-game="memory-match"]');
 await expect(recentCard).toHaveCount(1);
 await expect(recentCard.locator('source[type="image/webp"]')).toHaveAttribute('srcset','/game-art/memory-match/cover-square.webp');
 const image=recentCard.locator('img');
 await expect(image).toHaveAttribute('src','/game-art/memory-match/cover-square.jpg');
 await expect(image).toHaveAttribute('alt',/overlapping dark cards.*matching emerald diamonds/i);
});

test('page, mode, start, and shared controls do not count as gameplay',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(document,'fullscreenEnabled',{configurable:true,get:()=>false}));
 await page.goto('/games/color-flip/');
 const recent=()=>page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'));
 const root=page.locator('[data-game-root="color-flip"]');
 await expect(root).toHaveClass(/is-game-mounted/);
 expect(await recent()).toBeNull();
 await root.getByRole('button',{name:'Turn-based mode',exact:true}).click();
 expect(await recent()).toBeNull();
 await root.getByRole('button',{name:'Visual mode',exact:true}).click();
 await root.getByRole('button',{name:'Start',exact:true}).click();
 expect(await recent()).toBeNull();
 await page.getByRole('button',{name:'Mute game sound'}).click();
 const pauseControl=page.locator('[data-game-toolbar="pause"]');
 await pauseControl.click();
 await expect(pauseControl).toHaveAccessibleName('Resume game');
 await pauseControl.click();
 await page.getByRole('button',{name:'Game settings'}).click();
 await page.getByRole('button',{name:'New game'}).click();
 expect(await recent()).toBeNull();
 await page.getByRole('button',{name:'Focus mode'}).click();
 await page.getByRole('button',{name:'Exit focus mode'}).click();
 expect(await recent()).toBeNull();
 await page.getByRole('button',{name:'Analytics choices'}).click();
 await expect(page.locator('[data-consent-modal]')).toBeVisible();
 expect(await recent()).toBeNull();
 await page.getByRole('button',{name:'Close privacy choices'}).click();
 expect(await recent()).toBeNull();
 // Advertising is outside the game root and is never clicked by the test suite.
});

test('orders multiple meaningful game interactions on home and Arcade',async({page})=>{
 await page.goto('/games/memory-match/');
 await page.locator('[data-game-root="memory-match"] .mm__card').first().click();
 await page.waitForTimeout(5);
 await page.goto('/games/color-flip/');
 const colorFlip=page.locator('[data-game-root="color-flip"]');
 await expect(colorFlip).toHaveClass(/is-game-mounted/);
 expect(await page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).not.toContain('color-flip');
 await colorFlip.getByRole('button',{name:'Start',exact:true}).click();
 expect(await page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).not.toContain('color-flip');
 const blue=colorFlip.getByRole('button',{name:'Pick Blue',exact:true});
 await expect(blue).toBeEnabled();
 await blue.click();
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).toContain('color-flip');
 for(const path of ['/','/arcade/']){await page.goto(path);const section=page.locator('[data-recently-played]:visible');await expect(section).toBeVisible();const ids=await section.locator('[data-recent-game]:visible').evaluateAll(items=>items.map(item=>item.getAttribute('data-recent-game')));expect(ids.slice(0,2)).toEqual(['color-flip','memory-match']);}
});

test('each game appears once per Recently Played and catalog section',async({page})=>{
 const gameIds=['memory-match','word-tile-rush','color-flip','beacon-lattice'];
 await page.goto('/');
 await page.evaluate((ids)=>localStorage.setItem('nocharge:pref:recently-played',JSON.stringify(ids.map((gameId,index)=>({gameId,playedAt:index+1})))),gameIds);
 await page.reload();
 for(const gameId of gameIds){
  await expect(page.locator(`[data-recently-played="home"] [data-recent-game="${gameId}"]`)).toHaveCount(1);
  await expect(page.locator(`#games .game-card[href="/games/${gameId}/"]`)).toHaveCount(1);
 }
 await page.goto('/arcade/');
 for(const gameId of gameIds){
  await expect(page.locator(`[data-recently-played="arcade"] [data-recent-game="${gameId}"]`)).toHaveCount(1);
  await expect(page.locator(`.arcade-grid .game-card[href="/games/${gameId}/"]`)).toHaveCount(1);
 }
});

test('Privacy clear removes recently played and preserves consent',async({page})=>{
 await page.goto('/privacy/');const before=await page.evaluate(key=>localStorage.getItem(key),CONSENT_KEY);await page.evaluate(()=>localStorage.setItem('nocharge:pref:recently-played','[{"gameId":"memory-match","playedAt":1}]'));await page.getByRole('button',{name:'Clear game data'}).click();expect(await page.evaluate(()=>localStorage.getItem('nocharge:pref:recently-played'))).toBeNull();expect(await page.evaluate(key=>localStorage.getItem(key),CONSENT_KEY)).toBe(before);await expect(page.locator('[data-game-status]')).toContainText('Recently Played');
});

test('publishes reviewed non-thin collections, sitemap data, and footer navigation',async({page,request})=>{
 await page.goto('/collections/');await expect(page.locator('.collection-grid article')).toHaveCount(11);await expect(page.locator('.site-footer').getByRole('link',{name:'Collections'})).toHaveAttribute('href','/collections/');
 for(const slug of collectionSlugs){const path=`/collections/${slug}/`;await page.goto(path);await expect(page.getByRole('heading',{name:'Inclusion method'})).toBeVisible();expect(await page.locator('.members article').count()).toBeGreaterThanOrEqual(3);const json=(await page.locator('script[type="application/ld+json"]').allTextContents()).join('\n');expect(json).toContain('"@type":"CollectionPage"');expect(json).toContain('"@type":"ItemList"');expect(json).toContain('"@type":"BreadcrumbList"');await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',`https://nocharge.net${path}`);}
 const xml=await (await request.get('/sitemap.xml')).text();for(const slug of [...platformSlugs,...collectionSlugs])expect(xml).toContain(`/${slug}/`);
});

test('new discovery surfaces reflow at mobile and practical 200% zoom and pass axe',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('nocharge:pref:recently-played','[{"gameId":"memory-match","playedAt":2},{"gameId":"color-flip","playedAt":1}]'));
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/','/arcade/','/articles/','/articles/how-nocharge-tests-browser-games/','/collections/','/collections/keyboard-friendly-browser-games/']){await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);const results=await new AxeBuilder({page}).analyze();expect(results.violations,`${path}: ${JSON.stringify(results.violations)}`).toEqual([]);}
 await page.setViewportSize({width:320,height:760});
 for(const path of ['/','/collections/keyboard-friendly-browser-games/']){await page.goto(path);await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);}
 await page.setViewportSize({width:640,height:800});
 for(const path of ['/','/collections/keyboard-friendly-browser-games/']){await page.goto(path);await page.evaluate(()=>{document.documentElement.style.zoom='2'});await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.getByRole('link',{name:/Enter the arcade|Browse all collections/})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);}
});

test('eligible new content keeps the AdSense banner separated without ad interaction',async({page})=>{for(const path of ['/articles/how-nocharge-tests-browser-games/','/collections/','/collections/keyboard-friendly-browser-games/']){await page.goto(path);const banner=page.locator('[data-ad-banner]');await expect(banner).toHaveCount(1);const separated=await page.evaluate(()=>{const main=document.querySelector('main')!.getBoundingClientRect();const ad=document.querySelector('[data-ad-banner]')!.getBoundingClientRect();return ad.top>=main.bottom;});expect(separated).toBe(true);}});
