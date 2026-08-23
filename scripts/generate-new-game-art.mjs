import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const slug=process.argv[2]; if(!['word-search','mini-sudoku'].includes(slug)) throw new Error('unknown game');
const dir=path.join('public','game-art',slug);fs.mkdirSync(dir,{recursive:true});
const accent=slug==='word-search'?'#38bdf8':'#a78bfa';const title=slug==='word-search'?'WORD SEARCH':'MINI SUDOKU';
const svg=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#101b19"/><circle cx="${w*.78}" cy="${h*.2}" r="${Math.min(w,h)*.28}" fill="${accent}" opacity=".16"/><path d="M8% 65%h84%" stroke="${accent}" stroke-width="6"/><text x="8%" y="55%" fill="white" font-family="sans-serif" font-size="${Math.min(w,h)*.09}" font-weight="700">${title}</text></svg>`;
for(const [name,w,h] of [['cover-square',800,800],['cover-landscape',1280,720],['hero-square',1200,1200],['social-card',1200,630],['guide-header',1280,500]]){const input=Buffer.from(svg(w,h));fs.writeFileSync(path.join(dir,`${name}.svg`),input);await sharp(input).webp({quality:82}).toFile(path.join(dir,`${name}.webp`));await sharp(input).jpeg({quality:86}).toFile(path.join(dir,`${name}.jpg`));}
for(const w of [800,1200,1600]){const h=Math.round(w*9/16),input=Buffer.from(svg(w,h));await sharp(input).webp({quality:82}).toFile(path.join(dir,`landscape-${w}.webp`));await sharp(input).jpeg({quality:86}).toFile(path.join(dir,`landscape-${w}.jpg`));}
fs.writeFileSync(path.join(dir,'icon.svg'),svg(256,256)); console.log(`Generated raster and SVG art for ${slug}.`);
