import * as THREE from 'three'
import type { FinaleSceneHandle } from './DemonFinaleScene'

/**
 * Stylized uncanny werewolf — scary Keller transformation + lunge for WebXR.
 * Procedural ash-mesh figure; not cute.
 */
type Phase = 'form' | 'howl' | 'lunge' | 'eat' | 'blackout' | 'done'

const T = {
  formEnd: 1.8,
  howlEnd: 3.0,
  lungeEnd: 3.9,
  eatEnd: 5.0,
  blackoutEnd: 5.8,
} as const

export function createWerewolfScene(
  onPhase?: (name: string) => void,
): FinaleSceneHandle {
  const root = new THREE.Group()
  root.name = 'kellerWerewolf'

  const fur = new THREE.MeshStandardMaterial({
    color: 0x1a1410,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity: 0,
    flatShading: true,
    depthWrite: false,
  })
  const snoutMat = fur.clone()
  snoutMat.color = new THREE.Color(0x2a1c16)
  const fangMat = new THREE.MeshBasicMaterial({
    color: 0xd8d0c0,
    transparent: true,
    opacity: 0,
  })
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0xc45a1a,
    transparent: true,
    opacity: 0,
  })
  const manMat = new THREE.MeshStandardMaterial({
    color: 0x4a4038,
    roughness: 0.9,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
    depthWrite: false,
  })

  const man = new THREE.Group()
  const manTorso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.12), manMat)
  manTorso.position.y = 0.95
  const manHead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), manMat)
  manHead.position.y = 1.22
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 8), manMat)
  hat.position.y = 1.32
  man.add(manTorso, manHead, hat)
  root.add(man)

  const wolf = new THREE.Group()
  wolf.visible = false

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.2), fur)
  torso.position.y = 0.85
  torso.rotation.x = 0.15
  wolf.add(torso)

  const chestSpike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), fur)
  chestSpike.position.set(0, 1.05, 0.08)
  chestSpike.rotation.x = -0.8
  wolf.add(chestSpike)

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.18), fur)
  head.position.set(0, 1.28, 0.06)
  wolf.add(head)
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), snoutMat)
  snout.position.set(0, 1.2, 0.22)
  wolf.add(snout)

  const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.06, 4), fangMat)
  fangL.position.set(-0.03, 1.14, 0.3)
  fangL.rotation.x = Math.PI
  const fangR = fangL.clone()
  fangR.position.x = 0.03
  wolf.add(fangL, fangR)

  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 3), fur)
  earL.position.set(-0.08, 1.4, 0)
  earL.rotation.z = 0.35
  const earR = earL.clone()
  earR.position.x = 0.08
  earR.rotation.z = -0.35
  wolf.add(earL, earR)

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), eyeMat)
  eyeL.position.set(-0.045, 1.3, 0.14)
  const eyeR = eyeL.clone()
  eyeR.position.x = 0.045
  wolf.add(eyeL, eyeR)

  function leg(side: 1 | -1): THREE.Group {
    const lg = new THREE.Group()
    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.28, 5),
      fur,
    )
    thigh.position.set(side * 0.09, 0.55, 0)
    thigh.rotation.z = side * 0.2
    const shin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.035, 0.32, 5),
      fur,
    )
    shin.position.set(side * 0.12, 0.28, 0.04)
    shin.rotation.x = 0.35
    const paw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.12), fur)
    paw.position.set(side * 0.12, 0.1, 0.1)
    lg.add(thigh, shin, paw)
    return lg
  }
  wolf.add(leg(-1), leg(1))

  function arm(side: 1 | -1): THREE.Group {
    const a = new THREE.Group()
    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.35, 5),
      fur,
    )
    upper.geometry.translate(0, -0.175, 0)
    upper.position.set(side * 0.16, 1.0, 0)
    upper.rotation.z = side * 0.9
    upper.rotation.x = -0.4
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.1, 4), fangMat)
    claw.position.set(side * 0.38, 0.72, 0.1)
    claw.rotation.x = Math.PI / 2
    a.add(upper, claw)
    for (let i = 0; i < 3; i++) {
      const c = claw.clone()
      c.position.x += side * (i - 1) * 0.025
      c.position.y -= i * 0.01
      c.scale.setScalar(0.7 + i * 0.1)
      a.add(c)
    }
    return a
  }
  wolf.add(arm(-1), arm(1))

  for (let i = 0; i < 5; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 3), fur)
    spike.position.set(0, 0.7 + i * 0.08, -0.1)
    spike.rotation.x = 0.9
    wolf.add(spike)
  }

  root.add(wolf)

  let t = 0
  let lastPhase = ''
  let playing = true

  const setPhase = (name: Phase) => {
    if (name !== lastPhase) {
      lastPhase = name
      onPhase?.(name)
    }
  }

  const update = (dt: number, _elapsed: number): boolean => {
    if (!playing) return false
    t += dt

    if (t < T.formEnd) {
      setPhase('form')
      const u = t / T.formEnd
      manMat.opacity = 0.85 * (1 - u)
      fur.opacity = u * 0.9
      snoutMat.opacity = fur.opacity
      fangMat.opacity = u * 0.95
      eyeMat.opacity = u
      wolf.visible = u > 0.15
      wolf.scale.setScalar(0.4 + u * 0.7)
      wolf.position.y = -0.1 + u * 0.1
      man.visible = u < 0.95
      man.scale.setScalar(1 - u * 0.5)
      man.position.y = u * -0.2
    } else if (t < T.howlEnd) {
      setPhase('howl')
      const u = (t - T.formEnd) / (T.howlEnd - T.formEnd)
      man.visible = false
      wolf.visible = true
      fur.opacity = 0.92
      snoutMat.opacity = 0.92
      fangMat.opacity = 1
      eyeMat.opacity = 1
      wolf.scale.setScalar(1.1 + Math.sin(u * Math.PI) * 0.08)
      wolf.rotation.y = Math.sin(u * 6) * 0.08
      if (Math.random() < 0.12) wolf.rotation.z = (Math.random() - 0.5) * 0.2
      wolf.position.z = Math.random() < 0.08 ? 0.08 : 0
    } else if (t < T.lungeEnd) {
      setPhase('lunge')
      const u = (t - T.howlEnd) / (T.lungeEnd - T.howlEnd)
      const ease = u * u
      wolf.position.z = ease * 2.1
      wolf.position.y = ease * 0.35
      wolf.scale.setScalar(1.15 + ease * 1.85)
      wolf.rotation.x = -ease * 0.5
    } else if (t < T.eatEnd) {
      setPhase('eat')
      const u = (t - T.lungeEnd) / (T.eatEnd - T.lungeEnd)
      wolf.position.z = 2.1 + u * 0.55
      wolf.scale.setScalar(3.0 + u * 0.7)
      fur.opacity = 0.95 * (1 - u * 0.3)
      snout.rotation.x = Math.sin(u * 40) * 0.25
    } else if (t < T.blackoutEnd) {
      setPhase('blackout')
      fur.opacity = 0
      snoutMat.opacity = 0
      fangMat.opacity = 0
      eyeMat.opacity = 0
      wolf.visible = false
    } else {
      setPhase('done')
      playing = false
      return false
    }
    return true
  }

  const dispose = () => {
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const m = obj.material
        if (Array.isArray(m)) m.forEach((x) => x.dispose())
        else m.dispose()
      }
    })
  }

  return { root, update, dispose }
}
