import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Editable source for the Memory Match raster package. The illustration and
// gameplay-preview SVG strings remain vector until Sharp creates final exports.
const out = fileURLToPath(new URL('../public/game-art/memory-match/', import.meta.url));

function art(w,h,mode='landscape') {
  const square = mode === 'square';
  const cx = square ? w*0.52 : w*0.65;
  const cy = h*0.49;
  const cardW = square ? w*0.31 : h*0.34;
  const cardH = cardW*1.25;
  const x1 = cx-cardW*0.78, y1=cy-cardH*0.56;
  const x2 = cx-cardW*0.20, y2=cy-cardH*0.42;
  const stroke=Math.max(2,w/450);
  const small = Math.min(w,h);
  const extra = mode === 'guide' ? `
    <g opacity=".82">
      <rect x="${w*.10}" y="${h*.21}" width="${cardW*.48}" height="${cardH*.48}" rx="${cardW*.06}" fill="#1c241f" stroke="#3b4c42" stroke-width="${stroke}"/>
      <rect x="${w*.19}" y="${h*.50}" width="${cardW*.48}" height="${cardH*.48}" rx="${cardW*.06}" fill="#1c241f" stroke="#3b4c42" stroke-width="${stroke}"/>
      <path d="M${w*.16} ${h*.40} C${w*.23} ${h*.31},${w*.31} ${h*.37},${x1} ${y1+cardH*.55}" fill="none" stroke="#12b66a" stroke-opacity=".44" stroke-width="${stroke}" stroke-dasharray="7 12"/>
    </g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg" cx="72%" cy="42%" r="76%"><stop stop-color="#203229"/><stop offset=".42" stop-color="#171e1a"/><stop offset="1" stop-color="#101210"/></radialGradient>
    <linearGradient id="c1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#27372f"/><stop offset="1" stop-color="#171d19"/></linearGradient>
    <linearGradient id="c2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#31483a"/><stop offset="1" stop-color="#19221d"/></linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${small/180}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="grain"><feTurbulence baseFrequency=".72" numOctaves="2" seed="17" stitchTiles="stitch"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .035 0"/></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="${cx+cardW*.18}" cy="${cy}" r="${small*.31}" fill="#12b66a" opacity=".055"/>
  <path d="M${w*.06} ${h*.77} C${w*.25} ${h*.55}, ${w*.31} ${h*.89}, ${x1+cardW*.15} ${y1+cardH*.72}" fill="none" stroke="#12b66a" stroke-opacity=".24" stroke-width="${stroke}"/>
  <path d="M${w*.08} ${h*.82} C${w*.27} ${h*.62}, ${w*.36} ${h*.94}, ${x1+cardW*.31} ${y1+cardH*.88}" fill="none" stroke="#91e8ba" stroke-opacity=".12" stroke-width="${stroke*.55}"/>
  ${extra}
  <g transform="rotate(-8 ${x1+cardW/2} ${y1+cardH/2})">
    <rect x="${x1}" y="${y1}" width="${cardW}" height="${cardH}" rx="${cardW*.095}" fill="#141815" stroke="#35473d" stroke-width="${stroke}"/>
    <path d="M${x1+cardW*.18} ${y1+cardH*.20}H${x1+cardW*.82}M${x1+cardW*.18} ${y1+cardH*.80}H${x1+cardW*.82}" stroke="#91e8ba" stroke-opacity=".12" stroke-width="${stroke}"/>
    <path d="m${x1+cardW*.5} ${y1+cardH*.33} ${cardW*.18} ${cardW*.18}-${cardW*.18} ${cardW*.18}-${cardW*.18}-${cardW*.18}Z" fill="none" stroke="#12b66a" stroke-width="${stroke*1.5}"/>
  </g>
  <g transform="rotate(7 ${x2+cardW/2} ${y2+cardH/2})">
    <rect x="${x2}" y="${y2}" width="${cardW}" height="${cardH}" rx="${cardW*.095}" fill="url(#c2)" stroke="#12b66a" stroke-opacity=".66" stroke-width="${stroke*1.2}"/>
    <rect x="${x2+cardW*.09}" y="${y2+cardW*.09}" width="${cardW*.82}" height="${cardH-cardW*.18}" rx="${cardW*.06}" fill="none" stroke="#91e8ba" stroke-opacity=".09" stroke-width="${stroke}"/>
    <path d="m${x2+cardW*.5} ${y2+cardH*.36} ${cardW*.2} ${cardW*.2}-${cardW*.2} ${cardW*.2}-${cardW*.2}-${cardW*.2}Z" fill="none" stroke="#91e8ba" stroke-width="${stroke*1.7}" filter="url(#glow)"/>
  </g>
  <g fill="#91e8ba"><circle cx="${w*.12}" cy="${h*.18}" r="${stroke*1.2}" opacity=".7"/><circle cx="${w*.23}" cy="${h*.31}" r="${stroke*.8}" opacity=".42"/><circle cx="${w*.88}" cy="${h*.77}" r="${stroke}" opacity=".5"/></g>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".65"/>
  </svg>`;
}
const jobs=[
 ['cover-square.webp',800,800,'square',76],
 ['cover-landscape.webp',1280,720,'landscape',76],
 ['social-card.webp',1200,630,'landscape',78],
 ['guide-header.webp',1280,640,'guide',76],
];
for (const [name,w,h,mode,q] of jobs) {
  await sharp(Buffer.from(art(w,h,mode))).webp({quality:q, effort:6}).toFile(`${out}${name}`);
}

const glyphs=['diamond','circle','triangle','square','circle','diamond','square','triangle','triangle','circle','diamond','square','square','triangle','circle','diamond'];
function glyph(type,cx,cy,s,color){
 if(type==='circle') return `<circle cx="${cx}" cy="${cy}" r="${s*.18}" fill="none" stroke="${color}" stroke-width="${s*.055}"/>`;
 if(type==='triangle') return `<path d="M${cx} ${cy-s*.22} ${cx+s*.22} ${cy+s*.2} ${cx-s*.22} ${cy+s*.2}Z" fill="none" stroke="${color}" stroke-width="${s*.055}"/>`;
 if(type==='square') return `<rect x="${cx-s*.18}" y="${cy-s*.18}" width="${s*.36}" height="${s*.36}" rx="${s*.04}" fill="none" stroke="${color}" stroke-width="${s*.055}"/>`;
 return `<path d="m${cx} ${cy-s*.23} ${s*.23} ${s*.23}-${s*.23} ${s*.23}-${s*.23}-${s*.23}Z" fill="none" stroke="${color}" stroke-width="${s*.055}"/>`;
}
function screenshot(w,h,mobile=false){
 const pageW=mobile?w-48:1180, pageX=(w-pageW)/2;
 const stageW=mobile?pageW:760, stageX=mobile?pageX:pageX+30;
 const top=mobile?66:50;
 const titleY=mobile?178:166;
 const stageY=mobile?300:255;
 const pad=mobile?22:34;
 const boardW=stageW-pad*2;
 const gap=mobile?12:16;
 const cell=(boardW-gap*3)/4;
 const boardY=stageY+(mobile?120:105);
 let cards='';
 const colors=['#91e8ba','#7ec9e8','#d6ae69','#c2a0e8'];
 glyphs.forEach((g,i)=>{const row=Math.floor(i/4),col=i%4,x=stageX+pad+col*(cell+gap),y=boardY+row*(cell+gap); const open=[1,4,9,12].includes(i); cards+=`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${mobile?14:18}" fill="${open?'#292d2a':'#202923'}" stroke="${open?'#445149':'#12b66a'}" stroke-opacity="${open?'.8':'.35'}" stroke-width="2"/>${open?glyph(g,x+cell/2,y+cell/2,cell,colors[i%4]):`<path d="m${x+cell/2} ${y+cell*.34} ${cell*.14} ${cell*.16}-${cell*.14} ${cell*.16}-${cell*.14}-${cell*.16}Z" fill="none" stroke="#12b66a" stroke-width="${mobile?3:4}" opacity=".8"/>`}`});
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="bg" cx="15%" cy="10%" r="75%"><stop stop-color="#183026"/><stop offset=".45" stop-color="#151816"/><stop offset="1" stop-color="#111211"/></radialGradient><filter id="grain"><feTurbulence baseFrequency=".8" numOctaves="2" seed="9"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .025 0"/></filter></defs><rect width="${w}" height="${h}" fill="url(#bg)"/><g font-family="ui-sans-serif,system-ui,sans-serif"><g transform="translate(${pageX} ${top})"><rect width="38" height="38" rx="11" fill="#12b66a"/><text x="19" y="26" text-anchor="middle" fill="#05130d" font-size="20" font-weight="800">N</text><text x="52" y="27" fill="#e0e0e0" font-size="22" font-weight="720">NoCharge</text><text x="${pageW-108}" y="26" fill="#9a9a9a" font-size="17">Arcade</text></g><text x="${pageX}" y="${titleY-46}" fill="#91e8ba" font-size="14" font-weight="700" letter-spacing="2">QUIET ARCADE · MEMORY MATCH</text><text x="${pageX}" y="${titleY}" fill="#e0e0e0" font-size="${mobile?46:58}" font-weight="780" letter-spacing="-2">Memory Match</text><text x="${pageX}" y="${titleY+38}" fill="#9a9a9a" font-size="${mobile?20:22}">Flip cards. Find pairs.</text><rect x="${stageX}" y="${stageY}" width="${stageW}" height="${mobile?860:590}" rx="20" fill="#1c1c1c" stroke="#323733"/><text x="${stageX+pad}" y="${stageY+58}" fill="#9a9a9a" font-size="18">Moves  <tspan fill="#e0e0e0" font-weight="700">2</tspan>    Best  <tspan fill="#e0e0e0" font-weight="700">14</tspan></text><rect x="${stageX+stageW-pad-128}" y="${stageY+28}" width="128" height="46" rx="23" fill="#242424" stroke="#3b403d"/><text x="${stageX+stageW-pad-64}" y="${stageY+58}" fill="#e0e0e0" font-size="16" text-anchor="middle" font-weight="650">New game</text>${cards}</g><rect width="${w}" height="${h}" filter="url(#grain)"/></svg>`;
}
await sharp(Buffer.from(screenshot(720,1280,true))).webp({quality:77,effort:6}).toFile(`${out}screenshot-mobile.webp`);
await sharp(Buffer.from(screenshot(1440,900,false))).webp({quality:78,effort:6}).toFile(`${out}screenshot-desktop.webp`);

for (const name of ['cover-square', 'cover-landscape', 'guide-header']) {
  await sharp(`${out}${name}.webp`)
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(`${out}${name}.jpg`);
}

await sharp(`${out}social-card.webp`)
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(`${out}social-card.jpg`);

console.log('Regenerated Memory Match raster artwork.');
