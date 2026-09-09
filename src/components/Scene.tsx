import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, Html, useGLTF, useTexture } from '@react-three/drei'
import { EffectComposer, Vignette } from '@react-three/postprocessing'
import * as T from 'three'
import gsap from 'gsap'
import { Key, Olive, FallenOlives, Watermelon, Cloth, MapStone } from './Models'
import GroundDetails from './GroundDetails'
import { artifacts } from '../data/artifacts'
import { assetUrl } from '../utils/assets'

type SceneProps = { active: number | null; onSelect: (index: number) => void; reduced: boolean }
type V3 = [number, number, number]
const positions: V3[] = [[-1.46, .025, .4], [-.62, .015, -.44], [-.32, .03, .90], [.91, .015, .39], [.95, .025, -.58]]
const centers: V3[] = [[.35, 1.44, 0], [.2, 1.85, 0], [0, .53, .12], [0, .39, .1], [.12, 1.60, 0]]
const focusScales = [1.03, .90, 1.55, 1.4, 1.02]
const models = [Key, Olive, Watermelon, Cloth, MapStone]
// Start image requests together, then hold the full tableau until all are ready.
for (const path of ['textures/watermelon-flesh.png', 'textures/keffiyeh-woven.png', 'textures/limestone.png']) useTexture.preload(assetUrl(path))

function LoadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => { if (o instanceof T.Mesh) { o.castShadow = true; o.receiveShadow = true; o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone() } })
    return c
  }, [scene])
  return <primitive object={clone} />
}

function applyOpacity(material: T.MeshStandardMaterial, opacity: number) {
  material.opacity = opacity
  const transparent = opacity < .999
  if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
  material.depthWrite = !transparent
}

function Artifact({ index, active, hovered, onHover, onSelect, reduced }: SceneProps & {
  index: number; hovered: number | null; onHover: (n: number | null) => void
}) {
  const root = useRef<T.Group>(null!), pivot = useRef<T.Group>(null!)
  const fade = useRef({ value: 1 }), entry = useRef({ value: 1 })
  const materialCache = useRef<T.MeshStandardMaterial[]>([])
  const drag = useRef({ held: false, x: 0, yaw: 0 })
  const [url, setUrl] = useState<string | null>(null)
  const Model = models[index], center = centers[index]

  useEffect(() => {
    const controller = new AbortController(), path = assetUrl(`models/${artifacts[index].id}.glb`)
    fetch(path, { signal: controller.signal }).then(async r => {
      if (r.ok) { const b = await r.arrayBuffer(); if (b.byteLength > 4 && new DataView(b).getUint32(0, true) === 0x46546c67) setUrl(path) }
    }).catch(() => { })
    return () => controller.abort()
  }, [index])
  useEffect(() => { materialCache.current = [] }, [url])

  useEffect(() => {
    const selected = active === index, hide = active !== null && !selected
    const scale = selected ? focusScales[index] : 1
    const position: V3 = selected ? [-center[0] * scale, 1.95 - center[1] * scale, .7 - center[2] * scale] : positions[index]
    root.current.visible = !hide
    drag.current.yaw = 0
    const tl = gsap.timeline()
    tl.to(fade.current, { value: hide ? 0 : 1, duration: reduced ? 0 : hide ? .3 : .6 }, 0)
    tl.to(root.current.position, { x: position[0], y: position[1], z: position[2], duration: reduced ? 0 : 1.25, ease: 'power3.inOut' }, 0)
    tl.to(root.current.scale, { x: scale, y: scale, z: scale, duration: reduced ? 0 : 1.25, ease: 'power3.inOut' }, 0)
    tl.to(root.current.rotation, { z: selected && index === 0 ? .19 : 0, duration: reduced ? 0 : 1.25, ease: 'power3.inOut' }, 0)
    if (selected && !reduced) tl.fromTo(entry.current, { value: 0 }, { value: 1, duration: 1.6, ease: 'power2.out' }, 0)

    return () => { tl.kill() }
  }, [active, index, center, reduced])

  useFrame(({ clock, pointer }, dt) => {
    if (!root.current.visible) return
    if (!materialCache.current.length) {
      const materials = new Set<T.MeshStandardMaterial>()
      root.current.traverse(o => { if (o instanceof T.Mesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m instanceof T.MeshStandardMaterial) materials.add(m) }) })
      materialCache.current = [...materials]
    }
    const selected = active === index, t = clock.elapsedTime
    const yaw = reduced ? 0 : selected ? pointer.x * .42 + Math.sin(t * .38) * .18 + drag.current.yaw - (1 - entry.current.value) * 1.05 : Math.sin(t * .25 + index) * .012
    const pitch = reduced || !selected ? 0 : -pointer.y * .12 + Math.sin(t * .3) * .045
    pivot.current.rotation.y = reduced ? 0 : T.MathUtils.damp(pivot.current.rotation.y, yaw, 3, dt)
    pivot.current.rotation.x = reduced ? 0 : T.MathUtils.damp(pivot.current.rotation.x, pitch, 3, dt)
    pivot.current.position.y = center[1] + (reduced ? 0 : selected ? Math.sin(t * .7) * .045 : hovered === index ? .025 : 0)
    for (const m of materialCache.current) applyOpacity(m, fade.current.value)
  })

  return <group ref={root} name={`artifact-${artifacts[index].id}`} visible={active === null || active === index} position={positions[index]}
    onPointerOver={e => { if (active !== null || window.innerWidth < 651) return; e.stopPropagation(); onHover(index); document.body.style.cursor = 'pointer' }}
    onPointerOut={() => { onHover(null); document.body.style.cursor = '' }}
    onClick={e => { if (active !== null) return; e.stopPropagation(); onHover(null); onSelect(index); document.body.style.cursor = '' }}
    onPointerDown={e => { if (active !== index) return; e.stopPropagation(); drag.current.held = true; drag.current.x = e.clientX; (e.target as unknown as HTMLElement).setPointerCapture?.(e.pointerId) }}
    onPointerMove={e => { if (!drag.current.held || reduced) return; drag.current.yaw += (e.clientX - drag.current.x) * .008; drag.current.x = e.clientX }}
    onPointerUp={e => { drag.current.held = false; (e.target as unknown as HTMLElement).releasePointerCapture?.(e.pointerId) }}
    onPointerCancel={() => { drag.current.held = false }}>
    <group ref={pivot} position={center}><group position={[-center[0], -center[1], -center[2]]}>
      <Suspense fallback={null}>{url ? <LoadedModel url={url} /> : <Model />}</Suspense>
    </group></group>
    {active === null && hovered === index && <Html position={[center[0], index === 3 ? .8 : center[1], .8]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}><span className="artifact-label">{artifacts[index].title}<span> ↗</span></span></Html>}
  </group>
}

function Atmosphere({ reduced }: { reduced: boolean }) {
  const particles = useRef<T.Points>(null!)
  const vertices = useMemo(() => {
    const a = new Float32Array(130 * 3)
    for (let i = 0; i < 130; i++) { const y = (i / 130) * 5; a[i * 3] = -.35 + Math.sin(i * 34.1) * (1.6 - y * .12); a[i * 3 + 1] = y; a[i * 3 + 2] = Math.cos(i * 8.17) * 1.3 }
    return a
  }, [])
  useFrame((_, dt) => { if (!reduced) particles.current.rotation.y += dt * .006 })
  return <>
    <mesh position={[.1, 2.55, -1.7]}>
      <planeGeometry args={[6, 6.7]} />
      <shaderMaterial transparent depthWrite={false} vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
        void main(){float h=1.-vUv.y;float axis=.32+h*.15;float w=.045+h*.22;float shaft=exp(-pow((vUv.x-axis)/w,2.));float cloud=.75+noise(vUv*8.)*.2+noise(vUv*25.)*.05;float fade=smoothstep(.30,.60,vUv.y)*(1.-smoothstep(.88,1.,vUv.y));gl_FragColor=vec4(vec3(.79,.53,.28),shaft*cloud*fade*.038);}`} />
    </mesh>
    <points ref={particles} position={[.9, 0, 0]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry><pointsMaterial color="#e3bd7f" size={.009} transparent opacity={.27} depthWrite={false} /></points>
  </>
}

function World({ active, onSelect, reduced }: SceneProps) {
  useTexture(assetUrl('textures/watermelon-flesh.png'))
  useTexture(assetUrl('textures/keffiyeh-woven.png'))
  useTexture(assetUrl('textures/limestone.png'))
  const [hovered, setHovered] = useState<number | null>(null)
  const stage = useRef<T.Group>(null!), narrow = useThree(s => s.size.width < 700)
  const lightTarget = useMemo(() => { const o = new T.Object3D(); o.position.set(narrow ? 0 : 1.4, 1.3, 0); return o }, [narrow])
  useFrame(({ camera, pointer, size }, dt) => {
    const zoom = narrow ? active === null ? .86 : 1.08 : 1
    if (Math.abs(camera.zoom - zoom) > .001) { camera.zoom = reduced ? zoom : T.MathUtils.damp(camera.zoom, zoom, 4, dt); camera.updateProjectionMatrix() }
    const stageX = narrow ? 0 : active === null ? 1.12 : 1.65
    stage.current.position.x = reduced ? stageX : T.MathUtils.damp(stage.current.position.x, stageX, 3, dt)
    camera.position.x = T.MathUtils.damp(camera.position.x, reduced || narrow ? 0 : pointer.x * .06, 2, dt)
    camera.position.z = reduced ? (active === null ? 9.3 : 8.8) : T.MathUtils.damp(camera.position.z, active === null ? 9.3 : 8.8, 3, dt)
    camera.lookAt(0, size.width < 700 ? 1.85 : 1.7, 0)
  })
  return <>
    <color attach="background" args={['#080706']} /><fog attach="fog" args={['#080706', 10, 22]} />
    <ambientLight intensity={.075} />
    <Environment resolution={128} environmentIntensity={.26}>
      <Lightformer form="rect" intensity={4.5} color="#ffe1b7" position={[-3, 5, 3]} rotation={[Math.PI / 3, 0, 0]} scale={[3.5, 2, 1]} />
      <Lightformer form="rect" intensity={.6} color="#b6b3a5" position={[4, 2, 2]} rotation={[0, -Math.PI / 3, 0]} scale={[2, 3, 1]} />
    </Environment>
    <primitive object={lightTarget} /><spotLight position={[-1.8, 6.3, 3.1]} target={lightTarget} color="#ffd3a0" intensity={220} angle={.56} penumbra={.85} castShadow shadow-mapSize={narrow ? [1024, 1024] : [2048, 2048]} shadow-radius={4} shadow-normalBias={.012} shadow-bias={-.0002} />
    <spotLight position={[4.5, 4, -2]} color="#e5c392" intensity={25} angle={.65} penumbra={1} />
    <pointLight position={[2, 1.8, 5]} color="#dbc7aa" intensity={2.2} />
    <group ref={stage} position={[narrow ? 0 : 1.12, 0, 0]}>
      {artifacts.map((a, i) => <Artifact key={a.id} index={i} active={active} hovered={narrow ? null : hovered} onHover={setHovered} onSelect={onSelect} reduced={reduced} />)}
      <group visible={active === null}><GroundDetails /><group position={positions[1]}><FallenOlives /></group></group>
      <ContactShadows position={[0, 0, 0]} opacity={active === null ? .8 : .3} scale={11} blur={3} far={5} resolution={256} color="#000000" />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.035, 0]}><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#110e09" roughness={1} /></mesh>
    <Atmosphere reduced={reduced} />
    <EffectComposer multisampling={0}><Vignette eskil={false} offset={.18} darkness={.62} /></EffectComposer>
  </>
}
export default function Scene(props: SceneProps) {
  return <Canvas shadows={{ type: T.PCFShadowMap }} dpr={[1, 1.5]} camera={{ position: [0, 2.45, 8.8], fov: 32, near: .1, far: 100 }} gl={{ antialias: true, toneMapping: T.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}>
    <Suspense fallback={null}><World {...props} /></Suspense>
  </Canvas>
}
