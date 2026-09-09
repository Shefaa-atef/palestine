import { useEffect, useMemo, useState } from 'react'
import * as T from 'three'
import { assetUrl } from '../utils/assets'
import { useTexture } from '@react-three/drei'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import outline from '../assets/palestine-outline.svg?raw'
import { surface, oldIronTextures, rindTextures, leafTextures, noise, random } from '../three/textures'

type V3 = [number, number, number]
const v3 = (p: V3) => new T.Vector3(...p)
function configureTexture(value: T.Texture | T.Texture[]) {
  for (const t of Array.isArray(value) ? value : [value]) {
    t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.needsUpdate = true
  }
}
function useAsset<TValue extends Record<string, T.Texture> | T.Texture>(factory: () => TValue): TValue {
  const [asset] = useState(factory)
  useEffect(() => () => { if (asset instanceof T.Texture) asset.dispose(); else Object.values(asset).forEach(t => t.dispose()) }, [asset])
  return asset
}
function tube(points: V3[] | T.CatmullRomCurve3, radius: number, segments = 24) {
  const curve = points instanceof T.CatmullRomCurve3 ? points : new T.CatmullRomCurve3(points.map(v3))
  const g = new T.TubeGeometry(curve, segments, radius, 7, false)
  // Taper every branch toward its living tip.
  const p = g.attributes.position
  for (let i = 0; i <= segments; i++) {
    const center = curve.getPointAt(i / segments), scale = 1 - i / segments * .65
    for (let j = 0; j <= 7; j++) { const k = i * 8 + j; p.setXYZ(k, center.x + (p.getX(k) - center.x) * scale, center.y + (p.getY(k) - center.y) * scale, center.z + (p.getZ(k) - center.z) * scale) }
  }
  g.computeVertexNormals(); return g
}
function weatherGeometry(g: T.BufferGeometry, strength: number) {
  const p = g.attributes.position, n = g.attributes.normal
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const d = (noise(x * 21 + z * 7, y * 23) - .5) * strength
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d)
  }
  g.computeVertexNormals(); return g
}
export function Key() {
  const maps = useAsset(oldIronTextures)
  const bow = useMemo(() => {
    const s = new T.Shape()
    s.moveTo(0, -.30); s.bezierCurveTo(-.68, -.43, -.67, .36, -.24, .43)
    s.bezierCurveTo(-.1, .48, .04, .43, .1, .34); s.bezierCurveTo(.40, .49, .67, .21, .49, -.11); s.bezierCurveTo(.37, -.33, .14, -.35, 0, -.30)
    const hole = new T.Path(); hole.moveTo(.015, -.18); hole.bezierCurveTo(.29, -.23, .40, -.10, .40, .07); hole.bezierCurveTo(.4, .25, .23, .31, .08, .20); hole.bezierCurveTo(-.13, .42, -.41, .28, -.43, .07); hole.bezierCurveTo(-.48, -.18, -.22, -.28, .015, -.18); s.holes.push(hole)
    const aged = new T.Shape(), rand = random(187)
    s.getPoints(130).forEach((p, i) => { const x = p.x + (rand() - .5) * .009, y = p.y + (rand() - .5) * .017; if (i) aged.lineTo(x, y); else aged.moveTo(x, y) })
    const oldHole = new T.Path(); hole.getPoints(110).forEach((p, i) => { const x = p.x + (rand() - .5) * .006, y = p.y + (rand() - .5) * .006; if (i) oldHole.lineTo(x, y); else oldHole.moveTo(x, y) })
    aged.holes.push(oldHole)
    return new T.ExtrudeGeometry(aged, { depth: .11, bevelEnabled: true, bevelSize: .011, bevelThickness: .016, bevelSegments: 3 })
  }, [])
  const shaft = useMemo(() => weatherGeometry(new T.CylinderGeometry(.077, .103, 2.18, 36, 90), .011), [])
  const bit = useMemo(() => {
    const s = new T.Shape(); const pts = [[0, 0], [-.45, 0], [-.45, .15], [-.33, .15], [-.33, .08], [-.23, .08], [-.23, .23], [-.46, .23], [-.46, .41], [-.33, .41], [-.33, .32], [-.23, .32], [-.23, .43], [0, .43]]
    pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath()
    return new T.ExtrudeGeometry(s, { depth: .13, bevelEnabled: true, bevelSize: .013, bevelThickness: .01, bevelSegments: 2 })
  }, [])
  return <group rotation={[.09, -.22, -.30]}>
    <mesh name="key-shaft" geometry={shaft} position={[0, 1.13, 0]} castShadow><meshStandardMaterial {...maps} metalness={.9} roughness={.95} bumpScale={.013} /></mesh>
    <mesh name="key-bow" geometry={bow} scale={[.83, .83, 1]} position={[.025, 2.43, -.055]} castShadow><meshStandardMaterial {...maps} metalness={.9} roughness={.93} bumpScale={.014} /></mesh>
    <mesh geometry={bit} position={[-.03, .23, -.06]} castShadow><meshStandardMaterial {...maps} metalness={.85} roughness={.97} bumpScale={.013} /></mesh>
    {[.77, 1.99, 2.07, 2.16].map((y, i) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[i ? .094 : .11, i ? .028 : .021, 8, 32]} /><meshStandardMaterial {...maps} color="#c0b8a1" metalness={.85} roughness={.9} bumpScale={.01} /></mesh>)}
  </group>
}
function leafGeometry(length: number, width: number, curl: number) {
  const p: number[] = [], uv: number[] = [], idx: number[] = [], rows = 16, cols = 6
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, w = width * Math.pow(Math.sin(Math.PI * t), .83) * (.8 + .2 * t)
    for (let j = 0; j <= cols; j++) {
      const s = j / cols * 2 - 1
      p.push(s * w, t * length, Math.sin(t * Math.PI) * curl + Math.abs(s) * w * .27 + Math.sin(t * 8) * s * .013)
      uv.push(j / cols, t)
      if (i < rows && j < cols) { const a = i * (cols + 1) + j; idx.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1) }
    }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g
}
const fruits: { p: V3, color: string, scale: number }[] = [
  { p: [.56, 1.78, .36], color: '#25251d', scale: 1 }, { p: [.13, 1.34, .38], color: '#e0d99c', scale: 1.08 },
  { p: [-.20, 1.52, .39], color: '#e9e0a5', scale: 1 }, { p: [.38, 2.16, .22], color: '#1d201c', scale: .94 },
  { p: [-.40, .78, .32], color: '#d1ce89', scale: .93 }, { p: [.0, .95, .4], color: '#302c20', scale: .87 },
]


export function Olive() {
  const leafMap = useAsset(leafTextures), bark = useAsset(() => surface('bark')), olive = useAsset(() => surface('olive'))
  const assets = useMemo(() => {
    const r = random(74), branches: T.BufferGeometry[] = [], leaves: { geometry: T.BufferGeometry, position: T.Vector3, quaternion: T.Quaternion, color: string }[] = []
    const main = new T.CatmullRomCurve3([v3([-.6, .05, .12]), v3([-.24, .78, .03]), v3([.20, 1.64, -.12]), v3([.50, 2.48, -.17]), v3([.67, 3.35, -.22])])
    const curves = [main]
    branches.push(tube(main, .041, 38))
    for (let i = 0; i < 11; i++) {
      const t = .16 + i * .063 + (r() - .5) * .034, start = main.getPoint(t), side = i % 2 ? -1 : 1
      const end = start.clone().add(new T.Vector3(side * (.36 + r() * .49), .54 + r() * .32, (r() - .5) * .55))
      const curve = new T.CatmullRomCurve3([start, start.clone().lerp(end, .45).add(new T.Vector3(0, -.07, .04)), end])
      curves.push(curve)
      branches.push(tube(curve, .016, 18))
      for (let j = 0; j < 4; j++) {
        const p = curve.getPoint(.2 + j * .24)
        const direction = new T.Vector3(side * (.18 + r() * .55) * (j % 2 ? .2 : 1), .55 + r() * .25, (r() - .5) * .5).normalize()
        const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction)
        q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), (r() - .5) * 1.9))
        leaves.push({ geometry: leafGeometry(.48 + r() * .30, .084 + r() * .046, (r() - .5) * .18), position: p, quaternion: q, color: j % 3 ? '#e1e6bd' : '#fbefd7' })
      }
    }
    leaves.push({ geometry: leafGeometry(.69, .08, .06), position: main.getPoint(.92), quaternion: new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), -.15), color: '#b9bf92' })
    const stems = fruits.map((f, i) => {
      const tip = new T.Vector3(0, .19 * f.scale, 0).applyEuler(new T.Euler(.2, .2, i * .7)).add(v3(f.p))
      let anchor = main.getPoint(0), distance = Infinity
      for (const curve of curves) for (let j = 0; j <= 100; j++) {
        const point = curve.getPoint(j / 100), d = point.distanceToSquared(tip)
        if (d < distance) { distance = d; anchor = point }
      }
      const middle = anchor.clone().lerp(tip, .55).add(new T.Vector3(0, .045, 0))
      return tube([anchor.toArray() as V3, middle.toArray() as V3, tip.toArray() as V3], .018, 20)
    })
    return { branches, leaves, stems }
  }, [])
  return <group rotation={[0, -.1, -.1]}>
    {assets.branches.map((g, i) => <mesh key={i} geometry={g} castShadow><meshStandardMaterial {...bark} roughness={.87} bumpScale={.015} /></mesh>)}
    {assets.leaves.map((l, i) => <mesh key={i} geometry={l.geometry} position={l.position} quaternion={l.quaternion} castShadow><meshStandardMaterial map={leafMap} color={l.color} roughness={.59} side={T.DoubleSide} /></mesh>)}
    {fruits.map((f, i) => <group key={i}><mesh name={`olive-stem-${i}`} geometry={assets.stems[i]}><meshStandardMaterial color="#9a8753" roughness={.8} /></mesh><mesh position={f.p} rotation={[.2, .2, i * .7]} scale={[.145 * f.scale, .20 * f.scale, .14 * f.scale]} castShadow><sphereGeometry args={[1, 24, 20]} /><meshPhysicalMaterial map={olive.map} color={f.color} bumpMap={olive.bumpMap} bumpScale={.013} roughness={.25} clearcoat={.35} clearcoatRoughness={.22} /></mesh></group>)}

  </group>
}
export function FallenOlives() {
  return <group rotation={[0, -.1, -.1]}>
    {[[-.65, .12, .45], [-.9, .10, .30]].map((p, i) => <mesh key={i} position={p as V3} scale={[.13, .16, .13]} castShadow><sphereGeometry args={[1, 20, 16]} /><meshPhysicalMaterial color={i ? '#737b2d' : '#2b291f'} roughness={.3} clearcoat={.3} /></mesh>)}
  </group>
}
// A spherical sector: two radial cut faces meet along the cut edge, and a
// curved rind encloses a real volume. This is not a stack of extruded discs.
const melonRadius = 1.08, cutAngle = .78
function melonPoint(theta: number, radius: number, phi: number): V3 {
  return [Math.cos(theta) * radius, Math.sin(theta) * radius * Math.cos(phi), Math.sin(theta) * radius * Math.sin(phi)]
}
function melonSurface(kind: 'rind' | 'front' | 'back', inner = 0, outer = melonRadius) {
  const p: number[] = [], uv: number[] = [], indices: number[] = [], nx = 100, ny = kind === 'rind' ? 32 : 30
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const theta = Math.PI + i / nx * Math.PI, t = j / ny
    const radius = kind === 'rind' ? melonRadius : T.MathUtils.lerp(inner, outer, t)
    const phi = kind === 'rind' ? T.MathUtils.lerp(-cutAngle, cutAngle, t) : kind === 'front' ? -cutAngle - .001 : cutAngle + .001
    const pt = melonPoint(theta, radius, phi)
    if (kind !== 'rind' && outer < .94) {
      const grain = (noise(pt[0] * 69, pt[1] * 67) - .5) * .007
      pt[2] += kind === 'front' ? grain : -grain
    }
    p.push(...pt); uv.push(kind === 'rind' ? i / nx : pt[0] / 2 + .5, kind === 'rind' ? j / ny : -pt[1])
    if (j < ny && i < nx) { const a = j * (nx + 1) + i; indices.push(a, a + 1, a + nx + 1, a + 1, a + nx + 2, a + nx + 1) }
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals(); return g
}
export function Watermelon() {
  const fleshImage = useTexture(assetUrl('textures/watermelon-flesh.png'), configureTexture)
  const rind = useAsset(rindTextures)
  const geometries = useMemo(() => ({ rind: melonSurface('rind'), front: melonSurface('front', 0, 1.01), back: melonSurface('back', 0, 1.01), frontPith: melonSurface('front', 1.009, 1.075), backPith: melonSurface('back', 1.009, 1.075) }), [])
  const seeds = useMemo(() => { const r = random(84); return Array.from({ length: 16 }, (_, i) => { const theta = Math.PI + .23 + r() * (Math.PI - .46), radius = .35 + r() * .42; const p = melonPoint(theta, radius, -cutAngle); p[2] += .013; return { p, theta, scale: .8 + r() * .4, pale: i > 13 } }) }, [])
  return <group position={[0, 1.01, 0]} rotation={[.36, -.61, .16]}>
    <mesh geometry={geometries.rind} castShadow><meshPhysicalMaterial map={rind} roughness={.35} clearcoat={.22} side={T.DoubleSide} /></mesh>
    {[geometries.frontPith, geometries.backPith].map((g, i) => <mesh key={i} geometry={g} castShadow><meshStandardMaterial color="#dcd7ae" roughness={.52} side={T.DoubleSide} /></mesh>)}
    {[geometries.front, geometries.back].map((g, i) => <mesh key={i} geometry={g} castShadow><meshPhysicalMaterial map={fleshImage} color="#cfaaa0" bumpMap={fleshImage} bumpScale={.012} roughness={.52} specularIntensity={.35} clearcoat={.03} clearcoatRoughness={.4} side={T.DoubleSide} /></mesh>)}
    {seeds.map((s, i) => <mesh key={i} position={s.p} rotation={[-cutAngle, 0, s.theta + Math.PI / 2]} scale={[.025 * s.scale, .049 * s.scale, .012]} castShadow><sphereGeometry args={[1, 12, 16]} /><meshPhysicalMaterial color={s.pale ? '#e2ba85' : '#23190f'} roughness={.22} clearcoat={.35} /></mesh>)}
  </group>
}
export function MapStone() {
  const limestone = useTexture(assetUrl('textures/limestone.png'), configureTexture)
  const geo = useMemo(() => {
    // Hstoops, Mandatory Palestine Silhouette Template, CC BY-SA 4.0.
    // The sourced outline is preserved; only its depth and surface are adapted.
    const shapes = new SVGLoader().parse(outline).paths.flatMap(p => p.toShapes())
    const g = new T.ExtrudeGeometry(shapes, { depth: 5.6, bevelEnabled: true, bevelSize: .23, bevelThickness: .38, bevelSegments: 3, curveSegments: 7 })
    g.scale(3.19 / 89, -3.19 / 89, 3.19 / 89); g.translate(-.50, 3.19, -.06)
    const uv = g.attributes.uv, pos = g.attributes.position
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + .52) * 1.7, pos.getY(i) * .7)
    g.computeVertexNormals(); return g
  }, [])
  return <mesh geometry={geo} rotation={[.015, -.14, -.09]} castShadow><meshStandardMaterial map={limestone} bumpMap={limestone} color="#bbb099" roughness={.95} bumpScale={.041} side={T.DoubleSide} /></mesh>
}
// One continuous gathered sheet. The entire fringe is sampled from its edge,
// so it stays physically attached even where the border rises over a fold.
const clothProfile = new T.CatmullRomCurve3([
  new T.Vector3(0, .13, -.88), new T.Vector3(0, .69, -.68),
  new T.Vector3(0, .88, -.33), new T.Vector3(0, .74, -.04),
  new T.Vector3(0, .52, -.25), new T.Vector3(0, .35, -.06),
  new T.Vector3(0, .43, .31), new T.Vector3(0, .26, .70),
  new T.Vector3(0, .09, 1.03),
])
function clothPoint(u: number, v: number): V3 {
  const x = (u - .5) * 2.24, profile = clothProfile.getPoint(v)
  const rise = .30 + .70 * Math.exp(-((x + .36) ** 2) / .85)
  const fold = Math.sin(u * 15 + v * 10 + Math.sin(v * 6)) * .046
  const ripple = Math.sin(u * 30 - v * 7) * .014
  const y = .035 + profile.y * rise + (fold + ripple) * Math.sin(Math.PI * v)
  return [x + .19 * Math.sin(v * 5) * Math.sin(Math.PI * u) + .18 * u * u * Math.sin(v * Math.PI), y, profile.z + .14 * Math.sin(u * 8 + v * 2)]
}
export function Cloth() {
  const woven = useTexture(assetUrl('textures/keffiyeh-woven.png'), configureTexture)
  const assets = useMemo(() => {
    const g = new T.PlaneGeometry(1, 1, 160, 120), p = g.attributes.position, uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) { const u = uv.getX(i), v = 1 - uv.getY(i); p.setXYZ(i, ...clothPoint(u, v)); uv.setXY(i, u, v) }
    g.computeVertexNormals()
    const fringes: { knots: V3[], cords: T.BufferGeometry[] } = { knots: [], cords: [] }
    const r = random(85)
    for (let i = 0; i < 31; i++) {
      const u = .016 + i * .032, start = clothPoint(u, 1), length = .15 + r() * .08
      const knot: V3 = [start[0] + .014, Math.max(.045, start[1] - .06), start[2] + .12]
      fringes.knots.push(knot)
      for (let j = 0; j < 2; j++) fringes.cords.push(tube([[start[0] + (j - .5) * .022, start[1], start[2]], [start[0], start[1] - .025, start[2] + .065], knot], .011, 10))
      for (let j = 0; j < 7; j++) {
        const x = (j - 3) * .008
        fringes.cords.push(tube([knot, [knot[0] + x, Math.max(.025, knot[1] - .06), knot[2] + length * .5], [knot[0] + x * 1.9 + (r() - .5) * .02, .025, knot[2] + length]], .006, 8))
      }
    }
    const fringeGeometry = mergeGeometries(fringes.cords)!
    fringes.cords.forEach(c => c.dispose())
    const knotParts = fringes.knots.map(p => { const k = new T.SphereGeometry(1, 8, 8); k.scale(.025, .031, .025); k.translate(...p); return k })
    const knotGeometry = mergeGeometries(knotParts)!; knotParts.forEach(k => k.dispose())
    return { g, fringeGeometry, knotGeometry }
  }, [])
  return <group rotation={[0, -.12, 0]}>
    <mesh geometry={assets.g} castShadow receiveShadow><meshPhysicalMaterial map={woven} bumpMap={woven} roughness={.97} bumpScale={.007} side={T.DoubleSide} sheen={.65} sheenColor="#e2d8bd" sheenRoughness={.9} /></mesh>
    <mesh geometry={assets.knotGeometry} castShadow><meshStandardMaterial color="#c1b79e" roughness={1} /></mesh>
    <mesh geometry={assets.fringeGeometry} castShadow><meshStandardMaterial color="#bdb39b" roughness={1} /></mesh>
  </group>
}



