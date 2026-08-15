import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const esc = (value) => value.replaceAll('&', '&amp;');

export async function generatePackage({ slug, accent, highlight, motif, secondary = 'diagram' }) {
  const dirUrl = new URL(`../public/game-art/${slug}/`, import.meta.url);
  const dir = fileURLToPath(dirUrl);
  await mkdir(dir, { recursive: true });
  const art = (w, h) => {
    const tiles = Array.from({ length: motif === 'letters' ? 12 : 8 }, (_, i) => {
      const x = w * (0.48 + (i % 4) * 0.09), y = h * (0.24 + Math.floor(i / 4) * 0.18);
      const label = motif === 'letters' ? ['W','O','R','D','P','A','T','H','R','I','S','E'][i] : motif === 'cards' ? ['A♠','K♥','Q♦','J♣'][i % 4] : ['G','B','A','R'][i % 4];
      const colors = motif === 'letters' ? [accent, highlight] : motif === 'cards' ? ['#79d9b2','#dc6f7d','#6ba7e8','#c9874f'] : ['#12b66a','#60a5fa','#f59e0b','#e56b7f'];
      return `<rect x="${x}" y="${y}" width="${w*.075}" height="${w*.075}" rx="${w*.012}" fill="#202823" stroke="${colors[i%colors.length]}" stroke-width="${w/500}"/><text x="${x+w*.0375}" y="${y+w*.050}" text-anchor="middle" font-family="system-ui" font-size="${w*.027}" font-weight="700" fill="${colors[i%colors.length]}">${label}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="b" cx="70%" cy="45%" r="75%"><stop stop-color="${accent}" stop-opacity=".18"/><stop offset=".45" stop-color="#17201c"/><stop offset="1" stop-color="#101210"/></radialGradient><filter id="g"><feTurbulence baseFrequency=".7" seed="21"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .025 0"/></filter></defs><rect width="${w}" height="${h}" fill="url(#b)"/><path d="M${w*.05} ${h*.8} C${w*.25} ${h*.55},${w*.38} ${h*.9},${w*.58} ${h*.58}" fill="none" stroke="${accent}" stroke-opacity=".35" stroke-width="${w/500}"/>${tiles}<circle cx="${w*.82}" cy="${h*.25}" r="${Math.min(w,h)*.18}" fill="${highlight}" opacity=".055"/><rect width="${w}" height="${h}" filter="url(#g)"/></svg>`;
  };
  const jobs=[['cover-square',800,800,'square'],['cover-landscape',1280,720,'landscape'],['guide-header',1280,640,'guide'],['social-card',1200,630,'landscape']];
  await writeFile(new URL('source.svg',dirUrl), art(1280,720));
  for(const [name,w,h,mode] of jobs){const input=Buffer.from(art(w,h));await sharp(input).webp({quality:78,effort:6}).toFile(`${dir}${name}.webp`);await sharp(input).jpeg({quality:80,mozjpeg:true}).toFile(`${dir}${name}.jpg`);}
  const icon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#151b18"/><path d="M18 70C38 44 53 70 78 24" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><circle cx="30" cy="55" r="9" fill="${highlight}"/><circle cx="65" cy="38" r="9" fill="none" stroke="${accent}" stroke-width="4"/></svg>`;await writeFile(new URL('icon.svg',dirUrl),icon);
  const diagram=(title,labels)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" role="img"><rect width="960" height="520" rx="28" fill="#121412"/>${labels.map((l,i)=>`<g transform="translate(${45+i*300} 60)"><text fill="${highlight}" font-family="system-ui" font-size="18" font-weight="700">0${i+1} · ${esc(l[0])}</text><rect y="60" width="250" height="230" rx="20" fill="#1d231f" stroke="${accent}" stroke-opacity=".55"/><path d="M45 205C95 120 150 255 205 125" fill="none" stroke="${accent}" stroke-width="5"/><text x="125" y="340" text-anchor="middle" fill="#e0e0e0" font-family="system-ui" font-size="20">${esc(l[1])}</text></g>`).join('')}<text x="48" y="475" fill="#9a9a9a" font-family="system-ui" font-size="18">${esc(title)}</text></svg>`;
  await writeFile(new URL('controls-diagram.svg',dirUrl),diagram('Controls remain available to touch, pointer, and keyboard players.',[['CHOOSE','Select'],['CONNECT','Build'],['CONFIRM','Continue']]));
  await writeFile(new URL(`${secondary}.svg`,dirUrl),diagram('The mechanic is explained with labels as well as color.',[['READ','Observe'],['DECIDE','Choose'],['RESULT','Resolve']]));
}
