import * as THREE from 'three'

/**
 * World-anchored endgame climax props for WebXR:
 * polaroid plane falls → fissure opens → hell hands pull it under → seal.
 */
export interface FinaleSceneHandle {
  root: THREE.Group
  update: (dt: number, elapsed: number) => boolean // true while playing
  dispose: () => void
}

export function createDemonFinaleScene(
  polaroidDataUrl: string | null,
  onPhase?: (name: string) => void,
): FinaleSceneHandle {
  const root = new THREE.Group()
  root.name = 'demonFinale'

  const ash = (color: number, opacity = 0.75) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity,
      depthWrite: false,
      flatShading: true,
    })

  // Ground disk (fissure host)
  const groundMat = ash(0x1a1410, 0.55)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.002
  root.add(ground)

  // Crack — two plates that separate
  const crackMat = new THREE.MeshBasicMaterial({
    color: 0x050302,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const crackL = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.08), crackMat.clone())
  const crackR = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.08), crackMat.clone())
  crackL.rotation.x = -Math.PI / 2
  crackR.rotation.x = -Math.PI / 2
  crackL.position.set(-0.02, 0.004, 0)
  crackR.position.set(0.02, 0.004, 0)
  root.add(crackL, crackR)

  // Hell hands
  const handMat = ash(0x2a1c16, 0.85)
  function makeHand(side: 1 | -1): THREE.Group {
    const h = new THREE.Group()
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.1), handMat)
    palm.position.y = 0.02
    h.add(palm)
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.01, 0.12, 5),
        handMat,
      )
      f.geometry.translate(0, 0.06, 0)
      f.position.set((i - 1.5) * 0.022, 0.03, 0.04)
      f.rotation.x = -0.5 - i * 0.05
      h.add(f)
    }
    const thumb = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.01, 0.07, 5),
      handMat,
    )
    thumb.geometry.translate(0, 0.035, 0)
    thumb.position.set(side * 0.05, 0.02, 0)
    thumb.rotation.z = side * 0.9
    h.add(thumb)
    h.position.set(side * 0.12, -0.35, 0.05)
    h.visible = false
    return h
  }
  const handL = makeHand(-1)
  const handR = makeHand(1)
  root.add(handL, handR)

  // Polaroid plane
  const photoMat = new THREE.MeshBasicMaterial({
    color: 0xebe4d6,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.22), photoMat)
  photo.position.set(0, 0.55, 0.05)
  photo.rotation.z = -0.08
  root.add(photo)

  if (polaroidDataUrl) {
    const loader = new THREE.TextureLoader()
    loader.load(
      polaroidDataUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        photoMat.map = tex
        photoMat.needsUpdate = true
      },
      undefined,
      () => {
        /* keep blank card */
      },
    )
  }

  // Smoke wisps
  const smokeMat = ash(0x2a2218, 0)
  const smokes: THREE.Mesh[] = []
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.04 + i * 0.01, 6, 6), smokeMat.clone())
    s.position.set((Math.random() - 0.5) * 0.15, 0.02, (Math.random() - 0.5) * 0.1)
    s.visible = false
    root.add(s)
    smokes.push(s)
  }

  // Timeline (seconds) — longer, scare-forward climax
  const T = {
    dropEnd: 1.6,
    crackEnd: 3.0,
    reachEnd: 4.6,
    pullEnd: 6.4,
    sealEnd: 8.0,
    silenceEnd: 10.8,
    endcardEnd: 15.0,
  }

  let t = 0
  let lastPhase = ''
  let playing = true

  const setPhase = (name: string) => {
    if (name !== lastPhase) {
      lastPhase = name
      onPhase?.(name)
    }
  }

  const update = (dt: number, _elapsed: number): boolean => {
    if (!playing) return false
    t += dt

    if (t < T.dropEnd) {
      setPhase('drop')
      const u = t / T.dropEnd
      photoMat.opacity = Math.min(1, u * 2.2)
      photo.position.y = 0.55 - u * 0.42
      photo.rotation.z = -0.08 + u * 0.04
      photo.rotation.x = u * 0.35
    } else if (t < T.crackEnd) {
      setPhase('crack')
      const u = (t - T.dropEnd) / (T.crackEnd - T.dropEnd)
      photo.position.y = 0.13
      ;(crackL.material as THREE.MeshBasicMaterial).opacity = 0.3 + u * 0.7
      ;(crackR.material as THREE.MeshBasicMaterial).opacity = 0.3 + u * 0.7
      crackL.scale.set(1, 1 + u * 4, 1)
      crackR.scale.set(1, 1 + u * 4, 1)
      crackL.position.x = -0.02 - u * 0.08
      crackR.position.x = 0.02 + u * 0.08
      ground.scale.setScalar(1 + u * 0.08)
    } else if (t < T.reachEnd) {
      setPhase('reach')
      handL.visible = true
      handR.visible = true
      const u = (t - T.crackEnd) / (T.reachEnd - T.crackEnd)
      handL.position.y = -0.35 + u * 0.48
      handR.position.y = -0.35 + u * 0.48
      handL.rotation.z = -0.2 + u * 0.15
      handR.rotation.z = 0.2 - u * 0.15
    } else if (t < T.pullEnd) {
      setPhase('pull')
      const u = (t - T.reachEnd) / (T.pullEnd - T.reachEnd)
      const y = 0.13 - u * 0.55
      photo.position.y = y
      handL.position.y = 0.13 - u * 0.5
      handR.position.y = 0.13 - u * 0.5
      photoMat.opacity = 1 - u * 0.85
      photo.scale.setScalar(1 - u * 0.45)
      crackL.position.x = -0.1 - u * 0.02
      crackR.position.x = 0.1 + u * 0.02
    } else if (t < T.sealEnd) {
      setPhase('seal')
      photo.visible = false
      handL.visible = false
      handR.visible = false
      const u = (t - T.pullEnd) / (T.sealEnd - T.pullEnd)
      crackL.position.x = THREE.MathUtils.lerp(-0.12, 0, u)
      crackR.position.x = THREE.MathUtils.lerp(0.12, 0, u)
      ;(crackL.material as THREE.MeshBasicMaterial).opacity = 1 - u
      ;(crackR.material as THREE.MeshBasicMaterial).opacity = 1 - u
      for (const s of smokes) {
        s.visible = true
        const m = s.material as THREE.MeshStandardMaterial
        m.opacity = (1 - u) * 0.45
        s.position.y += dt * 0.08
        s.scale.multiplyScalar(1 + dt * 0.4)
      }
    } else if (t < T.silenceEnd) {
      setPhase('silence')
      for (const s of smokes) {
        const m = s.material as THREE.MeshStandardMaterial
        m.opacity *= 0.96
      }
      groundMat.opacity = 0.35
    } else if (t < T.endcardEnd) {
      setPhase('endcard')
    } else {
      setPhase('done')
      playing = false
      root.visible = false
      return false
    }
    return true
  }

  const dispose = () => {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of mats) {
          if ('map' in m && m.map) (m.map as THREE.Texture).dispose()
          m.dispose()
        }
      }
    })
  }

  return { root, update, dispose }
}
