import * as THREE from 'three'
import type { SpiritKind } from '../types'

/** Uncanny procedural horror meshes — dread over gore. Meaner every stage. */

function ashMaterial(color: number, opacity = 0.72): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity,
    flatShading: true,
    depthWrite: false,
  })
}

function wetMaterial(color: number, opacity = 0.65): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.35,
    transparent: true,
    opacity,
    depthWrite: false,
  })
}

function limb(len: number, thick: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(thick * 0.6, thick, len, 5)
  const m = new THREE.Mesh(geo, mat)
  m.geometry.translate(0, -len / 2, 0)
  return m
}

function storeBaseOpacity(group: THREE.Group) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material && 'opacity' in obj.material) {
      const m = obj.material as THREE.Material & { opacity: number; userData: Record<string, unknown> }
      m.userData.baseOpacity = m.opacity
    }
  })
}

/** Stage from aggression: 0 calm → 1 wrong → 2 nightmare */
export function horrorStage(aggression: number): 0 | 1 | 2 {
  if (aggression >= 0.66) return 2
  if (aggression >= 0.33) return 1
  return 0
}

/** Tombstone → grave-dirt figure, jaw wrong, cemetery wrongness */
function buildGraveDirt(): THREE.Group {
  const g = new THREE.Group()
  const dirt = ashMaterial(0x3a3428, 0.82)
  const bone = ashMaterial(0x8a8478, 0.78)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.11, 1, 1, 1), dirt)
  torso.position.y = 0.3
  torso.rotation.z = 0.1
  torso.name = 'torso'
  g.add(torso)

  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.085, 0), bone)
  skull.position.set(0.03, 0.54, 0.04)
  skull.scale.set(1.05, 1.25, 0.8)
  skull.name = 'head'
  g.add(skull)

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.06), bone)
  jaw.position.set(0.02, 0.46, 0.08)
  jaw.rotation.x = 0.55
  jaw.rotation.z = -0.25
  jaw.name = 'jaw'
  g.add(jaw)

  const armL = limb(0.48, 0.028, dirt)
  armL.position.set(-0.12, 0.4, 0)
  armL.rotation.z = 0.65
  armL.rotation.x = 0.35
  armL.name = 'armL'
  const armR = limb(0.55, 0.024, dirt)
  armR.position.set(0.12, 0.38, 0.02)
  armR.rotation.z = -0.85
  armR.rotation.x = -0.25
  armR.name = 'armR'
  g.add(armL, armR)

  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), dirt)
  spike.position.set(-0.08, 0.46, -0.02)
  spike.rotation.z = 0.95
  g.add(spike)

  // Asymmetric tracking eyes — one huge, one slit
  const pitMat = new THREE.MeshBasicMaterial({ color: 0x020201, transparent: true, opacity: 0.95 })
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x3a1010, transparent: true, opacity: 0.9 })
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), pitMat)
  eyeL.position.set(-0.025, 0.56, 0.07)
  eyeL.name = 'eyeL'
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), irisMat)
  pupilL.position.set(-0.025, 0.56, 0.085)
  pupilL.name = 'pupilL'
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 6), pitMat)
  eyeR.position.set(0.055, 0.55, 0.075)
  eyeR.scale.set(1.5, 0.55, 1)
  eyeR.name = 'eyeR'
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), irisMat)
  pupilR.position.set(0.055, 0.548, 0.09)
  pupilR.name = 'pupilR'
  g.add(eyeL, pupilL, eyeR, pupilR)

  // Face that resolves too close — hidden until nightmare
  const closeFace = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), ashMaterial(0x6a6054, 0))
  closeFace.position.set(0.02, 0.52, 0.18)
  closeFace.scale.set(0.9, 1.3, 0.4)
  closeFace.name = 'closeFace'
  closeFace.visible = false
  g.add(closeFace)

  g.userData.kind = 'tombstone'
  storeBaseOpacity(g)
  return g
}

/** Ring → intimate/wrong wedding echo, hand lunges at lens */
function buildWeddingEcho(): THREE.Group {
  const g = new THREE.Group()
  const flesh = ashMaterial(0x6b5a52, 0.8)
  const pale = ashMaterial(0x9a8e86, 0.75)

  const handRoot = new THREE.Group()
  handRoot.name = 'handRoot'
  handRoot.position.set(0, 0.2, 0.05)

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.2), flesh)
  palm.rotation.x = -0.45
  palm.name = 'palm'
  handRoot.add(palm)

  const lengths = [0.18, 0.24, 0.28, 0.22, 0.14]
  lengths.forEach((len, i) => {
    const f = limb(len, 0.013 + (i % 2) * 0.005, flesh)
    f.position.set(-0.06 + i * 0.03, 0.02, 0.08)
    f.rotation.x = -1.0 - i * 0.06
    f.rotation.z = (i - 2) * 0.1
    f.name = `finger${i}`
    handRoot.add(f)
  })

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.006, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1,
      roughness: 0.12,
      emissive: 0x886611,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.98,
    }),
  )
  ring.position.set(0.035, 0.06, 0.16)
  ring.rotation.y = 0.5
  ring.name = 'ringGlint'
  handRoot.add(ring)
  g.add(handRoot)

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), pale)
  face.position.set(0.02, 0.38, -0.08)
  face.scale.set(0.85, 1.35, 0.45)
  face.name = 'head'
  g.add(face)

  const voidEye = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 10),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
  )
  voidEye.position.set(-0.01, 0.42, -0.01)
  voidEye.name = 'eyeL'
  g.add(voidEye)

  const voidEye2 = voidEye.clone()
  voidEye2.position.set(0.05, 0.4, 0)
  voidEye2.scale.set(0.6, 1.4, 1)
  voidEye2.name = 'eyeR'
  g.add(voidEye2)

  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.4),
    new THREE.MeshBasicMaterial({
      color: 0xe8e0d8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  veil.position.set(-0.06, 0.42, -0.1)
  veil.rotation.y = 0.35
  g.add(veil)

  g.userData.kind = 'ring'
  storeBaseOpacity(g)
  return g
}

/** Doll → porcelain/vacant, neck clicks, stares through camera */
function buildPorcelainDoll(): THREE.Group {
  const g = new THREE.Group()
  const porcelain = ashMaterial(0xd8cfc4, 0.88)
  const crack = ashMaterial(0x2a2218, 0.9)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.1, 6), porcelain)
  neck.position.y = 0.36
  neck.name = 'neck'
  g.add(neck)

  const head = new THREE.Group()
  head.position.y = 0.46
  head.name = 'head'

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), porcelain)
  skull.scale.set(1, 1.15, 0.95)
  head.add(skull)

  const iris = new THREE.MeshBasicMaterial({ color: 0x0a1820 })
  const white = new THREE.MeshBasicMaterial({ color: 0xf8f4ee })
  ;[-1, 1].forEach((side) => {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), white)
    sclera.position.set(side * 0.04, 0.015, 0.078)
    sclera.name = side < 0 ? 'eyeL' : 'eyeR'
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), iris)
    pupil.position.set(side * 0.038, 0.012, 0.1)
    pupil.name = side < 0 ? 'pupilL' : 'pupilR'
    head.add(sclera, pupil)
  })

  const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.12, 0.012), crack)
  crackMesh.position.set(0.015, 0, 0.095)
  crackMesh.rotation.z = 0.35
  head.add(crackMesh)

  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.005, 6, 12, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x6a2030 }),
  )
  smile.position.set(0, -0.04, 0.09)
  smile.rotation.x = Math.PI
  smile.rotation.z = 0.2
  smile.name = 'jaw'
  head.add(smile)
  g.add(head)

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.2, 6), porcelain)
  torso.position.y = 0.24
  torso.name = 'torso'
  g.add(torso)

  const jointMat = ashMaterial(0x4a4038, 0.92)
  ;[
    [-0.08, 0.3, 0.4, 0.65],
    [0.08, 0.3, -0.55, 0.45],
    [-0.045, 0.14, 0.25, 1.0],
    [0.045, 0.14, -0.2, -0.85],
  ].forEach(([x, y, rz, rx], i) => {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), jointMat)
    joint.position.set(x, y, 0)
    const arm = limb(i < 2 ? 0.22 : 0.24, 0.02, porcelain)
    arm.position.copy(joint.position)
    arm.rotation.z = rz
    arm.rotation.x = rx
    arm.name = i < 2 ? (i === 0 ? 'armL' : 'armR') : `leg${i}`
    g.add(joint, arm)
  })

  g.userData.kind = 'doll'
  storeBaseOpacity(g)
  return g
}

/** Lake → drowned surge from below */
function buildDrowned(): THREE.Group {
  const g = new THREE.Group()
  const pale = wetMaterial(0x7a9a9a, 0.78)
  const weed = wetMaterial(0x1a3028, 0.85)

  const plane = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({
      color: 0x1a3040,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = 0.01
  plane.name = 'waterPlane'
  g.add(plane)

  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.3, 24),
    new THREE.MeshBasicMaterial({
      color: 0x4a7080,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ripple.rotation.x = -Math.PI / 2
  ripple.position.y = 0.015
  ripple.name = 'ripple'
  g.add(ripple)

  const body = new THREE.Group()
  body.name = 'surgeBody'
  body.position.y = 0.02

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.16, 4, 8), pale)
  torso.position.set(0.01, 0.18, 0)
  torso.rotation.z = 0.14
  torso.rotation.x = 0.2
  torso.name = 'torso'
  body.add(torso)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), pale)
  head.position.set(0.025, 0.36, 0.03)
  head.rotation.x = 0.4
  head.name = 'head'
  body.add(head)

  for (let i = 0; i < 10; i++) {
    const strand = limb(0.22 + Math.random() * 0.14, 0.007, weed)
    strand.position.set((Math.random() - 0.5) * 0.12, 0.38, (Math.random() - 0.5) * 0.1)
    strand.rotation.x = 0.9 + Math.random() * 0.7
    strand.rotation.z = (Math.random() - 0.5) * 0.9
    body.add(strand)
  }

  const arm = limb(0.32, 0.022, pale)
  arm.position.set(-0.1, 0.1, 0.06)
  arm.rotation.z = 1.2
  arm.rotation.x = -0.5
  arm.name = 'armL'
  body.add(arm)

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.012, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x050a0c }),
  )
  mouth.position.set(0.025, 0.34, 0.075)
  mouth.name = 'jaw'
  body.add(mouth)

  const eyeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.012, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x102028 }),
  )
  eyeL.position.set(-0.01, 0.38, 0.08)
  eyeL.name = 'eyeL'
  const eyeR = eyeL.clone()
  eyeR.position.set(0.05, 0.375, 0.082)
  eyeR.scale.set(1.6, 0.6, 1)
  eyeR.name = 'eyeR'
  body.add(eyeL, eyeR)

  g.add(body)
  g.userData.kind = 'lake'
  storeBaseOpacity(g)
  return g
}

/** Boss → amalgam — taller, wronger */
function buildThresholdWarden(): THREE.Group {
  const g = new THREE.Group()
  const ash = ashMaterial(0x1a1814, 0.92)
  const bone = ashMaterial(0x6a6458, 0.8)
  const wet = wetMaterial(0x3a5058, 0.6)
  const gold = new THREE.MeshStandardMaterial({
    color: 0xa89030,
    metalness: 0.95,
    roughness: 0.18,
    emissive: 0x554400,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.95,
  })
  const porcelain = ashMaterial(0xc8c0b4, 0.75)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.48, 0.18, 1, 1, 1), ash)
  torso.position.y = 0.42
  torso.rotation.z = -0.08
  torso.name = 'torso'
  g.add(torso)

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.07), bone)
  spine.position.set(0.02, 0.44, -0.1)
  g.add(spine)

  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.11, 0), bone)
  skull.position.set(-0.05, 0.76, 0.05)
  skull.scale.set(1.15, 1.35, 0.95)
  skull.name = 'head'
  g.add(skull)

  const dollFace = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), porcelain)
  dollFace.position.set(0.1, 0.7, 0.08)
  dollFace.scale.set(0.9, 1.1, 0.65)
  dollFace.name = 'closeFace'
  g.add(dollFace)

  const pitMat = new THREE.MeshBasicMaterial({ color: 0x010100, transparent: true, opacity: 0.98 })
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x4a0808 })
  ;[
    [-0.08, 0.8, 0.12, 'eyeL', 'pupilL'],
    [0.02, 0.78, 0.13, 'eyeR', 'pupilR'],
    [0.12, 0.72, 0.14, '', ''],
    [0.08, 0.74, 0.14, '', ''],
  ].forEach(([x, y, z, en, pn], i) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(i < 2 ? 0.022 : 0.026, 6, 6), pitMat)
    eye.position.set(x as number, y as number, z as number)
    if (en) eye.name = en as string
    g.add(eye)
    if (pn) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), irisMat)
      p.position.set((x as number) + 0.005, y as number, (z as number) + 0.015)
      p.name = pn as string
      g.add(p)
    }
  })

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.07), bone)
  jaw.position.set(-0.03, 0.64, 0.12)
  jaw.rotation.x = 0.65
  jaw.rotation.z = 0.3
  jaw.name = 'jaw'
  g.add(jaw)

  const armL = limb(0.62, 0.035, ash)
  armL.position.set(-0.18, 0.55, 0)
  armL.rotation.z = 0.95
  armL.rotation.x = 0.45
  armL.name = 'armL'
  const armR = limb(0.7, 0.032, wet)
  armR.position.set(0.18, 0.52, 0.03)
  armR.rotation.z = -1.15
  armR.rotation.x = -0.4
  armR.name = 'armR'
  g.add(armL, armR)

  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.16), ash)
  palm.position.set(0.26, 0.12, 0.22)
  palm.rotation.x = -0.7
  palm.name = 'palm'
  g.add(palm)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 20), gold)
  ring.position.set(0.3, 0.16, 0.32)
  ring.name = 'ringGlint'
  g.add(ring)

  const plane = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 24),
    new THREE.MeshBasicMaterial({
      color: 0x0a1820,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = 0.01
  plane.name = 'waterPlane'
  g.add(plane)

  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.34, 24),
    new THREE.MeshBasicMaterial({
      color: 0x3a6070,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ripple.rotation.x = -Math.PI / 2
  ripple.position.y = 0.015
  ripple.name = 'ripple'
  g.add(ripple)

  for (let i = 0; i < 8; i++) {
    const strand = limb(0.2 + Math.random() * 0.12, 0.008, wetMaterial(0x1a3028, 0.9))
    strand.position.set((Math.random() - 0.5) * 0.22, 0.8, (Math.random() - 0.5) * 0.12)
    strand.rotation.x = 0.95 + Math.random() * 0.5
    strand.rotation.z = Math.random() - 0.5
    g.add(strand)
  }

  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), ash)
  spike.position.set(-0.14, 0.64, -0.05)
  spike.rotation.z = 1.05
  g.add(spike)

  const voidCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x180606, transparent: true, opacity: 0.95 }),
  )
  voidCore.position.set(0, 0.44, 0.12)
  voidCore.name = 'voidCore'
  g.add(voidCore)

  g.scale.setScalar(1.45)
  g.userData.kind = 'boss'
  storeBaseOpacity(g)
  return g
}

/** Endgame playground demon */
function buildPlaygroundDemon(): THREE.Group {
  const g = new THREE.Group()
  const ash = ashMaterial(0x1c1814, 0.94)
  const pale = ashMaterial(0x8a7e72, 0.85)
  const rust = ashMaterial(0x4a3020, 0.9)
  const chainMat = ashMaterial(0x3a3a38, 0.95)
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x030204, transparent: true, opacity: 0.98 })

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.11, 1, 1, 1), ash)
  torso.position.y = 0.36
  torso.scale.set(0.85, 1.45, 0.9)
  torso.rotation.z = 0.05
  torso.name = 'torso'
  g.add(torso)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.16, 5), pale)
  neck.position.y = 0.62
  neck.name = 'neck'
  g.add(neck)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), pale)
  head.position.set(0.015, 0.74, 0.025)
  head.scale.set(0.9, 1.25, 0.85)
  head.name = 'head'
  g.add(head)

  ;[-1, 1].forEach((side) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), voidMat)
    socket.position.set(side * 0.032, 0.76, 0.05)
    socket.name = side < 0 ? 'eyeL' : 'eyeR'
    g.add(socket)
  })

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), voidMat)
  mouth.position.set(0.015, 0.71, 0.055)
  mouth.rotation.z = 0.15
  mouth.name = 'jaw'
  g.add(mouth)

  const armL = limb(0.55, 0.018, ash)
  armL.position.set(-0.09, 0.5, 0)
  armL.rotation.z = 1.05
  armL.rotation.x = 0.3
  armL.name = 'armL'
  const armR = limb(0.6, 0.016, ash)
  armR.position.set(0.09, 0.48, 0.02)
  armR.rotation.z = -1.15
  armR.rotation.x = -0.25
  armR.name = 'armR'
  g.add(armL, armR)

  const legL = limb(0.42, 0.015, ash)
  legL.position.set(-0.045, 0.16, 0)
  legL.rotation.z = 0.18
  const legR = limb(0.45, 0.014, ash)
  legR.position.set(0.05, 0.16, 0.01)
  legR.rotation.z = -0.25
  g.add(legL, legR)

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.028, 0.11), rust)
  seat.position.set(0, 0.04, 0.02)
  seat.name = 'swingSeat'
  g.add(seat)

  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.013, 0.004, 6, 10), chainMat)
      link.position.set(side * 0.1, 0.08 + i * 0.075, -0.02)
      link.rotation.y = Math.PI / 2
      link.rotation.z = side * 0.06
      if (i === 0) link.name = side < 0 ? 'chainL' : 'chainR'
      g.add(link)
    }
  }

  const seat2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.09), rust)
  seat2.position.set(0.3, 0.02, -0.1)
  seat2.rotation.y = 0.45
  seat2.name = 'emptySeat'
  g.add(seat2)

  const voidCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x140606, transparent: true, opacity: 0.95 }),
  )
  voidCore.position.set(0, 0.4, 0.07)
  voidCore.name = 'voidCore'
  g.add(voidCore)

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 20),
    new THREE.MeshBasicMaterial({
      color: 0x1a1410,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.005
  ground.name = 'sandGround'
  g.add(ground)

  g.scale.setScalar(1.55)
  g.userData.kind = 'demon'
  storeBaseOpacity(g)
  return g
}

function buildTrialEcho(): THREE.Group {
  const g = new THREE.Group()
  const mist = ashMaterial(0x5a6258, 0.48)
  const pale = ashMaterial(0x9aa89a, 0.42)

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.14), mist)
  seat.position.y = 0.12
  g.add(seat)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.06), mist)
  torso.position.set(0, 0.28, -0.02)
  torso.rotation.x = -0.12
  torso.name = 'torso'
  g.add(torso)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.048, 6, 6), pale)
  head.position.set(0.01, 0.42, 0)
  head.scale.set(0.85, 1.1, 0.75)
  head.name = 'head'
  g.add(head)

  const pitMat = new THREE.MeshBasicMaterial({ color: 0x0a100c, transparent: true, opacity: 0.65 })
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 5), pitMat)
  eyeL.position.set(-0.015, 0.43, 0.04)
  eyeL.name = 'eyeL'
  const eyeR = eyeL.clone()
  eyeR.position.x = 0.028
  eyeR.name = 'eyeR'
  g.add(eyeL, eyeR)

  const arm = limb(0.24, 0.013, mist)
  arm.position.set(0.07, 0.3, 0.02)
  arm.rotation.z = -1.15
  arm.rotation.x = 0.4
  arm.name = 'armR'
  g.add(arm)

  g.scale.setScalar(0.85)
  g.userData.kind = 'trial'
  storeBaseOpacity(g)
  return g
}

function buildPaleArchivist(): THREE.Group {
  const g = new THREE.Group()
  const cloth = ashMaterial(0x2a3038, 0.88)
  const bone = ashMaterial(0xb8b0a4, 0.8)
  const ink = ashMaterial(0x0a0c10, 0.92)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.13), cloth)
  torso.position.y = 0.98
  torso.name = 'torso'
  g.add(torso)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.038, 0.22, 5), bone)
  neck.position.y = 1.28
  neck.name = 'neck'
  g.add(neck)

  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), bone)
  skull.position.set(0.015, 1.48, 0.025)
  skull.scale.set(0.85, 1.35, 0.9)
  skull.name = 'head'
  g.add(skull)

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.05), bone)
  jaw.position.set(0.01, 1.38, 0.08)
  jaw.rotation.x = 0.4
  jaw.name = 'jaw'
  g.add(jaw)

  const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.022, 0.2), ink)
  ledger.position.set(0.14, 0.88, 0.12)
  ledger.rotation.z = -0.45
  ledger.rotation.x = 0.35
  g.add(ledger)

  for (const side of [-1, 1] as const) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.6, 5), cloth)
    arm.geometry.translate(0, -0.3, 0)
    arm.position.set(side * 0.13, 1.1, 0)
    arm.rotation.z = side * 0.6
    arm.rotation.x = -0.4
    arm.name = side < 0 ? 'armL' : 'armR'
    g.add(arm)
  }

  const pit = new THREE.MeshBasicMaterial({ color: 0x040408, transparent: true, opacity: 0.98 })
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), pit)
  eyeL.position.set(-0.035, 1.5, 0.08)
  eyeL.name = 'eyeL'
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), pit)
  eyeR.position.set(0.045, 1.48, 0.085)
  eyeR.scale.set(1.3, 0.7, 1)
  eyeR.name = 'eyeR'
  g.add(eyeL, eyeR)

  for (let i = 0; i < 5; i++) {
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 0.004), ashMaterial(0xd8d0c0, 0.6))
    card.position.set(-0.02 + i * 0.012, 0.72 + i * 0.055, -0.09)
    card.rotation.y = 0.25
    g.add(card)
  }

  g.userData.kind = 'secret'
  storeBaseOpacity(g)
  return g
}

export function createHorrorEntity(target: SpiritKind): THREE.Group {
  switch (target) {
    case 'tombstone':
      return buildGraveDirt()
    case 'ring':
      return buildWeddingEcho()
    case 'doll':
      return buildPorcelainDoll()
    case 'lake':
      return buildDrowned()
    case 'trial':
      return buildTrialEcho()
    case 'boss':
      return buildThresholdWarden()
    case 'demon':
      return buildPlaygroundDemon()
    case 'secret':
      return buildPaleArchivist()
  }
}

export interface EntityAnimState {
  aggression: number
  proximity: number
  stutterClock: number
  lastStutter: number
  frozenUntil: number
  lastTeleport: number
  fakeOutUntil: number
  fakeOutPeak: number
  neckClickAt: number
  jawDrop: number
  lastSilenceCue: number
}

export function createAnimState(): EntityAnimState {
  return {
    aggression: 0,
    proximity: 0,
    stutterClock: 0,
    lastStutter: 0,
    frozenUntil: 0,
    lastTeleport: 0,
    fakeOutUntil: 0,
    fakeOutPeak: 0,
    neckClickAt: 0,
    jawDrop: 0,
    lastSilenceCue: 0,
  }
}

/** Trigger a fake-out lunge (hesitation scare). Returns true if started. */
export function triggerFakeOut(state: EntityAnimState, elapsed: number): boolean {
  if (elapsed < state.fakeOutUntil) return false
  state.fakeOutUntil = elapsed + 0.55
  state.fakeOutPeak = elapsed + 0.18
  return true
}

function trackPupils(group: THREE.Group, intensity: number) {
  const look = intensity * 0.012
  for (const name of ['pupilL', 'pupilR'] as const) {
    const p = group.getObjectByName(name)
    if (p) {
      p.position.x += (look * (name === 'pupilL' ? -0.3 : 0.5) - (p.userData.lookX ?? 0)) * 0.4
      p.userData.lookX = p.position.x
      p.position.z = (p.userData.baseZ as number | undefined) ?? p.position.z
      if (p.userData.baseZ == null) p.userData.baseZ = p.position.z
      p.position.z = (p.userData.baseZ as number) + intensity * 0.008
    }
  }
}

export function animateHorrorEntity(
  group: THREE.Group,
  state: EntityAnimState,
  dt: number,
  elapsed: number,
): void {
  state.stutterClock += dt
  const agg = state.aggression
  const prox = state.proximity
  const stage = horrorStage(agg)
  const kind = group.userData.kind as SpiritKind

  // Sudden stillness freezes
  if (elapsed < state.frozenUntil) {
    return
  }
  if (Math.random() < 0.012 + agg * 0.035 + (stage === 2 ? 0.02 : 0)) {
    state.frozenUntil = elapsed + 0.12 + Math.random() * (0.35 + stage * 0.15)
    return
  }

  // Micro-teleports closer when aggressive / near
  if (
    elapsed - state.lastTeleport > 0.55 - agg * 0.25 &&
    Math.random() < 0.04 + agg * 0.08 + prox * 0.06
  ) {
    state.lastTeleport = elapsed
    const jump = (0.018 + agg * 0.04 + prox * 0.03) * (Math.random() > 0.35 ? 1 : -0.4)
    group.position.z += jump
    group.position.x += (Math.random() - 0.5) * 0.025 * (1 + agg)
    group.rotation.y += (Math.random() - 0.5) * 0.2 * (1 + stage)
  }

  // Head-tilt snaps
  const stutter = state.stutterClock - state.lastStutter > 0.09 + Math.random() * 0.16
  if (stutter) {
    state.lastStutter = state.stutterClock
    const snap = (0.03 + agg * 0.09) * (Math.random() > 0.5 ? 1 : -1)
    group.rotation.y += snap
    group.rotation.z += snap * 0.35
    group.position.x += (Math.random() - 0.5) * 0.014 * (1 + agg)
  }

  // Fake-out lunge scale/Z spike
  let fakeBoost = 0
  if (elapsed < state.fakeOutUntil) {
    const peak = state.fakeOutPeak
    if (elapsed < peak) {
      fakeBoost = (elapsed - (peak - 0.18)) / 0.18
    } else {
      fakeBoost = 1 - (elapsed - peak) / Math.max(0.01, state.fakeOutUntil - peak)
    }
    fakeBoost = Math.max(0, Math.min(1, fakeBoost))
    group.position.z += fakeBoost * 0.14
    group.scale.setScalar((group.userData.baseScale as number | undefined) ?? 1)
  }

  // Eyes track camera feel
  trackPupils(group, Math.min(1, agg * 0.6 + prox * 0.8))

  // Jaw drop escalates
  const jaw = group.getObjectByName('jaw')
  if (jaw) {
    const targetDrop = stage === 0 ? 0.15 : stage === 1 ? 0.45 : 0.85 + prox * 0.4
    state.jawDrop += (targetDrop - state.jawDrop) * Math.min(1, dt * 4)
    jaw.rotation.x = 0.35 + state.jawDrop * 0.55
    if (stage >= 2 && Math.random() < 0.08) {
      jaw.rotation.x += 0.25
    }
  }

  // Close face resolves too close in nightmare
  const closeFace = group.getObjectByName('closeFace')
  if (closeFace) {
    if (stage >= 2 && prox > 0.55) {
      closeFace.visible = true
      const mat = (closeFace as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (mat.opacity !== undefined) {
        mat.opacity = Math.min(0.9, (mat.opacity || 0) + dt * 2.5)
      }
      closeFace.position.z = 0.12 + prox * 0.15
    } else if (closeFace.name === 'closeFace' && kind === 'tombstone') {
      closeFace.visible = false
    }
  }

  // Limb jitters
  for (const n of ['armL', 'armR']) {
    const a = group.getObjectByName(n)
    if (a && (stage >= 1 || Math.random() < 0.1)) {
      a.rotation.z += (Math.random() - 0.5) * 0.04 * (1 + agg * 2)
      a.rotation.x += (Math.random() - 0.5) * 0.03 * (1 + agg)
    }
  }

  if (kind === 'doll') {
    const head = group.getObjectByName('head')
    const neck = group.getObjectByName('neck')
    if (head) {
      head.rotation.y = Math.sin(elapsed * (0.5 + agg * 1.2)) * (0.2 + agg * 0.55)
      // Neck click snaps
      if (elapsed > state.neckClickAt && Math.random() < 0.015 + agg * 0.04) {
        state.neckClickAt = elapsed + 0.8 + Math.random()
        head.rotation.y += (Math.random() > 0.5 ? 1 : -1) * (0.45 + agg * 0.5)
        if (neck) neck.rotation.z = (Math.random() - 0.5) * 0.3
      }
    }
    // Asymmetric pupils drift toward lens
    const pL = group.getObjectByName('pupilL')
    const pR = group.getObjectByName('pupilR')
    if (pL) pL.position.x = -0.038 - prox * 0.008
    if (pR) pR.position.x = 0.05 + prox * 0.004
  } else if (kind === 'ring') {
    const glint = group.getObjectByName('ringGlint')
    if (glint) {
      glint.rotation.y = elapsed * 3.2
      const mat = (glint as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(elapsed * 10) * 0.4 + agg * 0.55
    }
    const hand = group.getObjectByName('handRoot')
    if (hand) {
      // Hand lunges at lens with aggression / proximity
      const lunge = agg * 0.12 + prox * 0.22 + fakeBoost * 0.2
      hand.position.z = 0.05 + lunge
      hand.position.y = 0.2 + prox * 0.06
      hand.scale.setScalar(1 + agg * 0.2 + prox * 0.35 + fakeBoost * 0.4)
      hand.rotation.x = -0.2 - prox * 0.4
    }
    group.scale.setScalar(1 + agg * 0.18 + fakeBoost * 0.15)
  } else if (kind === 'lake') {
    const ripple = group.getObjectByName('ripple')
    if (ripple) {
      const s = 1 + Math.sin(elapsed * 1.8) * 0.1 + agg * 0.15 + prox * 0.2
      ripple.scale.set(s, s, s)
    }
    const surge = group.getObjectByName('surgeBody')
    if (surge) {
      // Surge from below — rises hard with proximity
      const rise = 0.02 + agg * 0.06 + prox * 0.22 + (stage >= 2 ? 0.08 : 0)
      surge.position.y = rise + Math.sin(elapsed * 1.2) * 0.01
      surge.rotation.x = -prox * 0.25
    }
    group.position.y = agg * 0.05 + fakeBoost * 0.04
  } else if (kind === 'tombstone') {
    group.position.y = Math.abs(Math.sin(elapsed * 1.3)) * 0.025 + agg * 0.04 + fakeBoost * 0.05
    group.rotation.z = Math.sin(elapsed * 0.8) * 0.06 + (Math.random() - 0.5) * 0.004 * agg
    if (stage >= 2) {
      group.scale.setScalar(1 + prox * 0.2 + fakeBoost * 0.12)
    }
  } else if (kind === 'trial') {
    group.position.y = Math.sin(elapsed * 0.65) * 0.01 + agg * 0.02
    group.rotation.y = Math.sin(elapsed * 0.4) * 0.1
    group.scale.setScalar(0.85 + agg * 0.08 + fakeBoost * 0.06)
  } else if (kind === 'boss') {
    const glint = group.getObjectByName('ringGlint')
    if (glint) {
      glint.rotation.y = elapsed * 4
      const mat = (glint as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.6 + Math.sin(elapsed * 12) * 0.45 + agg * 0.6
    }
    const ripple = group.getObjectByName('ripple')
    if (ripple) {
      const s = 1 + Math.sin(elapsed * 2.5) * 0.14 + agg * 0.2
      ripple.scale.set(s, s, s)
    }
    const palm = group.getObjectByName('palm')
    if (palm) {
      palm.position.z = 0.22 + prox * 0.18 + fakeBoost * 0.15
      palm.scale.setScalar(1 + prox * 0.3)
    }
    group.position.y = Math.abs(Math.sin(elapsed * 1.6)) * 0.035 + agg * 0.08 + fakeBoost * 0.06
    group.rotation.y = Math.sin(elapsed * 0.65) * (0.15 + agg * 0.35)
    group.rotation.z = (Math.random() - 0.5) * 0.015 * (1 + agg * 3)
    group.scale.setScalar(1.45 + agg * 0.18 + fakeBoost * 0.2)
  } else if (kind === 'secret') {
    const neck = group.getObjectByName('neck')
    if (neck && elapsed > state.neckClickAt && Math.random() < 0.02 + agg * 0.05) {
      state.neckClickAt = elapsed + 0.6
      neck.rotation.z = (Math.random() - 0.5) * 0.5
    }
    group.position.y = Math.sin(elapsed * 0.75) * 0.015 + agg * 0.05 + fakeBoost * 0.04
    group.rotation.y = Math.sin(elapsed * 0.45) * 0.12
    group.scale.setScalar(1.05 + agg * 0.14 + fakeBoost * 0.12)
  } else if (kind === 'demon') {
    const sway = Math.sin(elapsed * (1.3 + agg)) * (0.1 + agg * 0.18)
    group.rotation.z = sway
    group.position.x = Math.sin(elapsed * 1.1) * 0.03 * (1 + agg)
    group.position.y = Math.abs(Math.sin(elapsed * 1.9)) * 0.03 + agg * 0.1 + fakeBoost * 0.08
    const seat = group.getObjectByName('swingSeat')
    if (seat) seat.rotation.z = Math.sin(elapsed * 2.2) * 0.08
    const empty = group.getObjectByName('emptySeat')
    if (empty) empty.rotation.y = 0.45 + Math.sin(elapsed * 0.9) * 0.25
    const head = group.getObjectByName('head')
    if (head && stage >= 1) {
      head.rotation.y = Math.sin(elapsed * 2) * 0.2 * agg
      head.position.z = 0.025 + prox * 0.06
    }
    group.scale.setScalar(1.55 + agg * 0.25 + fakeBoost * 0.25)
  }

  // Opacity flicker — wronger when nightmare
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material && 'opacity' in obj.material) {
      const m = obj.material as THREE.MeshStandardMaterial
      if (!m.transparent) return
      const base = (m.userData.baseOpacity as number | undefined) ?? m.opacity
      if (agg > 0.35 && Math.random() < 0.06 + stage * 0.04) {
        m.opacity = Math.max(0.15, base * (0.35 + Math.random() * 0.65))
      } else if (Math.random() < 0.02) {
        m.opacity = base
      }
    }
  })
}

export function setEntityAggression(group: THREE.Group, aggression: number): void {
  group.userData.aggression = aggression
}
