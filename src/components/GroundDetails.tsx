import { useEffect, useMemo, useRef } from 'react'
import * as T from 'three'
import { random, surface } from '../three/textures'

export default function GroundDetails() {
  const ref = useRef<T.InstancedMesh>(null!)
  const maps = useMemo(() => surface('stone'), [])
  useEffect(() => {
    const r = random(83), m = new T.Object3D()
    for (let i = 0; i < 170; i++) {
      const angle = r() * Math.PI * 2, radius = .4 + r() * 2.1
      m.position.set(Math.cos(angle) * radius, .012, Math.sin(angle) * radius * .55 + .65)
      const s = .008 + Math.pow(r(), 3) * .035
      m.scale.set(s * (1 + r()), s * .7, s); m.rotation.set(r(), r() * Math.PI, r()); m.updateMatrix()
      ref.current.setMatrixAt(i, m.matrix); ref.current.setColorAt(i, new T.Color().setHSL(.09, .16 + r() * .15, .15 + r() * .16))
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    return () => { maps.map.dispose(); maps.bumpMap.dispose() }
  }, [maps])
  return <instancedMesh ref={ref} args={[undefined, undefined, 170]} castShadow><dodecahedronGeometry args={[1, 0]}/><meshStandardMaterial {...maps} roughness={1} bumpScale={.01}/></instancedMesh>
}
