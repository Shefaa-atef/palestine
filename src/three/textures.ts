import * as T from 'three'

export function random(seed = 17) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}
export function noise(x: number, y: number) {
  const a = Math.floor(x), b = Math.floor(y)
  let u = x - a, v = y - b; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v)
  return T.MathUtils.lerp(T.MathUtils.lerp(hash(a, b), hash(a + 1, b), u), T.MathUtils.lerp(hash(a, b + 1), hash(a + 1, b + 1), u), v)
}
function canvas(size: number) {
  const c = document.createElement('canvas'); c.width = c.height = size
  return { c, ctx: c.getContext('2d')! }
}
function tex(c: HTMLCanvasElement, color = true) {
  const t = new T.CanvasTexture(c); t.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace
  t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8
  return t
}
export function surface(kind: 'iron' | 'stone' | 'olive' | 'bark') {
  const size = 512, { c, ctx } = canvas(size), height = canvas(size)
  const p = ctx.createImageData(size, size), b = height.ctx.createImageData(size, size), r = random(43)
  const base = kind === 'iron' ? [125, 88, 47] : kind === 'stone' ? [161, 144, 114] : kind === 'bark' ? [100, 80, 47] : [112, 118, 40]
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4
    const n = noise(x / 53, y / 53), detail = noise(x / 6, y / 6), fine = r()
    const pits = Math.max(0, (noise(x / 3, y / 3) - .56)) * 2.5
    const mottling = kind === 'iron' ? .33 + n * .8 + detail * .25 - pits * .4 : .65 + n * .45 + detail * .16 - pits * .3
    for (let k = 0; k < 3; k++) p.data[i + k] = base[k] * mottling + (fine - .5) * 17
    p.data[i + 3] = 255
    const h = 120 + detail * 70 + (fine - .5) * 35 - pits * 160
    b.data[i] = b.data[i + 1] = b.data[i + 2] = h; b.data[i + 3] = 255
  }
  ctx.putImageData(p, 0, 0); height.ctx.putImageData(b, 0, 0)
  return { map: tex(c), bumpMap: tex(height.c, false) }
}
export function rindTextures() {
  const { c, ctx } = canvas(1024), pixels = ctx.createImageData(1024, 1024), r = random(71)
  for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) {
    const n = noise(x / 50, y / 75), wave = Math.sin(x / 1024 * Math.PI * 22 + n * 2.7 + Math.sin(y / 180) * .6)
    const s = T.MathUtils.smoothstep(wave, -.15, .35), detail = noise(x / 8, y / 14), v = r() * 9
    const i = (y * 1024 + x) * 4
    pixels.data[i] = 20 + s * 43 + detail * 13 + v
    pixels.data[i + 1] = 37 + s * 47 + detail * 17 + v
    pixels.data[i + 2] = 16 + s * 15 + detail * 8
    pixels.data[i + 3] = 255
  }
  ctx.putImageData(pixels, 0, 0)
  return tex(c)
}
export function leafTextures() {
  const { c, ctx } = canvas(256), r = random(15)
  ctx.fillStyle = '#596039'; ctx.fillRect(0, 0, 256, 256)
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  g.addColorStop(0, '#85855a'); g.addColorStop(.47, '#697044'); g.addColorStop(.5, '#a2a273'); g.addColorStop(.54, '#474f2e'); g.addColorStop(1, '#737b48')
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256)
  for (let y = 5; y < 256; y += 17) {
    ctx.strokeStyle = '#b6ae7350'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(128, y); ctx.quadraticCurveTo(80, y + 10, 12, y + 40); ctx.moveTo(128, y); ctx.quadraticCurveTo(180, y + 12, 244, y + 42); ctx.stroke()
  }
  for (let i = 0; i < 6000; i++) { ctx.fillStyle = `rgba(222,217,165,${r() * .12})`; ctx.fillRect(r() * 256, r() * 256, 1, 1) }
  return tex(c)
}

export function oldIronTextures() {
  const size = 768, color = canvas(size), height = canvas(size), rough = canvas(size), metal = canvas(size)
  const a = color.ctx.createImageData(size, size), b = height.ctx.createImageData(size, size)
  const c = rough.ctx.createImageData(size, size), d = metal.ctx.createImageData(size, size), r = random(934)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4, broad = noise(x / 37, y / 49), grain = noise(x / 4, y / 4)
    const rust = T.MathUtils.smoothstep(broad + noise(x / 17, y / 19) * .30, .57, .90)
    const pit = Math.max(0, (noise(x / 2.4, y / 2.4) - .59)) * 3
    const base = [77, 68, 53], oxide = [121, 82, 43]
    for (let k = 0; k < 3; k++) a.data[i + k] = T.MathUtils.lerp(base[k], oxide[k], rust) * (.65 + grain * .7) - pit * 13 + r() * 9
    const h = 142 + grain * 48 + rust * 28 - pit * 165
    b.data[i] = b.data[i + 1] = b.data[i + 2] = h
    c.data[i] = c.data[i + 1] = c.data[i + 2] = 130 + rust * 115 + pit * 60
    d.data[i] = d.data[i + 1] = d.data[i + 2] = 210 - rust * 150
    a.data[i + 3] = b.data[i + 3] = c.data[i + 3] = d.data[i + 3] = 255
  }
  color.ctx.putImageData(a, 0, 0); height.ctx.putImageData(b, 0, 0); rough.ctx.putImageData(c, 0, 0); metal.ctx.putImageData(d, 0, 0)
  // Short, uneven abrasions interrupt the rust like decades of handling.
  for (let i = 0; i < 230; i++) {
    const x = r() * size, y = r() * size
    color.ctx.strokeStyle = `rgba(166,151,121,${.08 + r() * .18})`; color.ctx.lineWidth = .4 + r()
    color.ctx.beginPath(); color.ctx.moveTo(x, y); color.ctx.lineTo(x + r() * 17, y + r() * 4); color.ctx.stroke()
  }
  return { map: tex(color.c), bumpMap: tex(height.c, false), roughnessMap: tex(rough.c, false), metalnessMap: tex(metal.c, false) }
}
