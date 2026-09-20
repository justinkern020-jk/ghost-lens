import * as THREE from 'three'
import type { SpiritKind } from '../types'

/** Uncanny procedural horror meshes — dread over gore. */

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

function limb(
  len: number,
  thick: number,
  mat: THREE.Material,
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(thick * 0.6, thick, len, 5)
  const m = new THREE.Mesh(geo, mat)
  m.geometry.translate(0, -len / 2, 0)
  return m
}

/** Tombstone → grave-dirt figure, jaw wrong, cemetery wrongness */
function buildGraveDirt(): THREE.Group {
  const g = new THREE.Group()
  const dirt = ashMaterial(0x3a3428, 0.78)
  const bone = ashMaterial(0x8a8478, 0.7)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.1, 1, 1, 1), dirt)
  torso.position.y = 0.28
  torso.rotation.z = 0.08
  g.add(torso)

  // Head too small, jaw offset
  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 0), bone)
  skull.position.set(0.02, 0.5, 0.02)
  skull.scale.set(1, 1.15, 0.85)
  g.add(skull)

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.05), bone)
  jaw.position.set(0.01, 0.44, 0.06)
  jaw.rotation.x = 0.45
  jaw.rotation.z = -0.2
  g.add(jaw)

  // Too-long arms
  const armL = limb(0.42, 0.025, dirt)
  armL.position.set(-0.1, 0.38, 0)
  armL.rotation.z = 0.55
  armL.rotation.x = 0.3
  const armR = limb(0.48, 0.022, dirt)
  armR.position.set(0.1, 0.36, 0)
  armR.rotation.z = -0.75
  armR.rotation.x = -0.2
  g.add(armL, armR)

  // Broken silhouette — shoulder spike of dirt
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), dirt)
  spike.position.set(-0.06, 0.42, -0.02)
  spike.rotation.z = 0.9
  g.add(spike)

  // Hollow eye pits (darker)
  const pitMat = new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0.9 })
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), pitMat)
  eyeL.position.set(-0.02, 0.52, 0.055)
  const eyeR = eyeL.clone()
  eyeR.position.x = 0.045
  eyeR.scale.set(1.4, 0.7, 1)
  g.add(eyeL, eyeR)

  g.userData.kind = 'tombstone'
  return g
}

/** Ring → intimate/wrong wedding echo, hand-focused, jewelry glint */
function buildWeddingEcho(): THREE.Group {
  const g = new THREE.Group()
  const flesh = ashMaterial(0x6b5a52, 0.75)
  const pale = ashMaterial(0x9a8e86, 0.7)

  // Oversized hand reaching toward camera
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.18), flesh)
  palm.position.set(0, 0.22, 0.05)
  palm.rotation.x = -0.4
  g.add(palm)

  // Fingers too long, uneven
  const lengths = [0.16, 0.2, 0.22, 0.18, 0.12]
  lengths.forEach((len, i) => {
    const f = limb(len, 0.012 + (i % 2) * 0.004, flesh)
    f.position.set(-0.055 + i * 0.028, 0.24, 0.12)
    f.rotation.x = -0.9 - i * 0.05
    f.rotation.z = (i - 2) * 0.08
    g.add(f)
  })

  // Ring glint bait
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.022, 0.005, 8, 24),
    new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1,
      roughness: 0.15,
      emissive: 0x665511,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.95,
    }),
  )
  ring.position.set(0.03, 0.28, 0.2)
  ring.rotation.y = 0.5
  ring.name = 'ringGlint'
  g.add(ring)

  // Half-face behind the hand — unresolved
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pale)
  face.position.set(0.02, 0.35, -0.06)
  face.scale.set(0.9, 1.2, 0.5)
  g.add(face)

  const voidEye = new THREE.Mesh(
    new THREE.CircleGeometry(0.02, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide }),
  )
  voidEye.position.set(0.0, 0.38, -0.02)
  g.add(voidEye)

  // Veil shreds
  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.35),
    new THREE.MeshBasicMaterial({
      color: 0xe8e0d8,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  veil.position.set(-0.05, 0.4, -0.08)
  veil.rotation.y = 0.3
  g.add(veil)

  g.userData.kind = 'ring'
  return g
}

/** Doll → porcelain/vacant, jointed wrong, stares through camera */
function buildPorcelainDoll(): THREE.Group {
  const g = new THREE.Group()
  const porcelain = ashMaterial(0xd8cfc4, 0.82)
  const crack = ashMaterial(0x2a2218, 0.85)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), porcelain)
  head.position.y = 0.42
  head.scale.set(1, 1.1, 0.95)
  g.add(head)

  // Vacant stares — slightly crossed, too large
  const iris = new THREE.MeshBasicMaterial({ color: 0x1a3040 })
  const white = new THREE.MeshBasicMaterial({ color: 0xf5f0ea })
  ;[-1, 1].forEach((side) => {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), white)
    sclera.position.set(side * 0.035, 0.435, 0.07)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), iris)
    pupil.position.set(side * 0.032, 0.432, 0.09)
    g.add(sclera, pupil)
  })

  // Crack across face
  const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.1, 0.01), crack)
  crackMesh.position.set(0.01, 0.42, 0.085)
  crackMesh.rotation.z = 0.3
  g.add(crackMesh)

  // Painted smile slightly wrong
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.004, 6, 12, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x6a2030 }),
  )
  smile.position.set(0, 0.385, 0.08)
  smile.rotation.x = Math.PI
  smile.rotation.z = 0.15
  g.add(smile)

  // Body — jointed wrong (ball joints visible, limbs bent back)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 6), porcelain)
  torso.position.y = 0.26
  g.add(torso)

  const jointMat = ashMaterial(0x4a4038, 0.9)
  ;[
    [-0.07, 0.32, 0.35, 0.55],
    [0.07, 0.32, -0.5, 0.4],
    [-0.04, 0.16, 0.2, 0.9],
    [0.04, 0.16, -0.15, -0.7],
  ].forEach(([x, y, rz, rx], i) => {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), jointMat)
    joint.position.set(x, y, 0)
    const arm = limb(i < 2 ? 0.2 : 0.22, 0.018, porcelain)
    arm.position.copy(joint.position)
    arm.rotation.z = rz
    arm.rotation.x = rx
    g.add(joint, arm)
  })

  g.userData.kind = 'doll'
  return g
}

/** Lake → drowned/pale, waterlogged, hair/weeds, emerges from water plane */
function buildDrowned(): THREE.Group {
  const g = new THREE.Group()
  const pale = wetMaterial(0x7a9a9a, 0.7)
  const weed = wetMaterial(0x1a3028, 0.8)
  const water = wetMaterial(0x2a4a55, 0.35)

  // Water plane disc (entity emerges from)
  const plane = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 24),
    new THREE.MeshBasicMaterial({
      color: 0x1a3040,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = 0.01
  plane.name = 'waterPlane'
  g.add(plane)

  // Ripple ring
  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.26, 24),
    new THREE.MeshBasicMaterial({
      color: 0x4a7080,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ripple.rotation.x = -Math.PI / 2
  ripple.position.y = 0.015
  ripple.name = 'ripple'
  g.add(ripple)

  // Torso rising from water — slumped
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.14, 4, 8), pale)
  torso.position.set(0.01, 0.16, 0)
  torso.rotation.z = 0.12
  torso.rotation.x = 0.15
  g.add(torso)

  // Head — hair hanging as weeds
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), pale)
  head.position.set(0.02, 0.32, 0.02)
  head.rotation.x = 0.35
  g.add(head)

  for (let i = 0; i < 8; i++) {
    const strand = limb(0.2 + Math.random() * 0.12, 0.006, weed)
    strand.position.set((Math.random() - 0.5) * 0.1, 0.34, (Math.random() - 0.5) * 0.08)
    strand.rotation.x = 0.8 + Math.random() * 0.6
    strand.rotation.z = (Math.random() - 0.5) * 0.8
    g.add(strand)
  }

  // One arm reaching up from water, fingers splayed wrong
  const arm = limb(0.28, 0.02, pale)
  arm.position.set(-0.08, 0.08, 0.05)
  arm.rotation.z = 1.1
  arm.rotation.x = -0.4
  g.add(arm)

  // Mouth dark slit — no expression
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.008, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x0a1214 }),
  )
  mouth.position.set(0.02, 0.3, 0.06)
  g.add(mouth)

  // Soft submerged glow
  void water

  g.userData.kind = 'lake'
  return g
}


/** Boss → amalgam of all four hungers; taller, wronger, harder to look at. */
function buildThresholdWarden(): THREE.Group {
  const g = new THREE.Group()
  const ash = ashMaterial(0x1a1814, 0.88)
  const bone = ashMaterial(0x6a6458, 0.75)
  const wet = wetMaterial(0x3a5058, 0.55)
  const gold = new THREE.MeshStandardMaterial({
    color: 0xa89030,
    metalness: 0.95,
    roughness: 0.2,
    emissive: 0x443300,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9,
  })
  const porcelain = ashMaterial(0xc8c0b4, 0.7)

  // Massive slumped torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, 0.16, 1, 1, 1), ash)
  torso.position.y = 0.38
  torso.rotation.z = -0.06
  g.add(torso)

  // Extra rib-spine ridge
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.06), bone)
  spine.position.set(0.02, 0.4, -0.08)
  g.add(spine)

  // Primary skull (grave) + secondary porcelain face fused
  const skull = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), bone)
  skull.position.set(-0.04, 0.68, 0.04)
  skull.scale.set(1.1, 1.25, 0.9)
  g.add(skull)

  const dollFace = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), porcelain)
  dollFace.position.set(0.08, 0.64, 0.06)
  dollFace.scale.set(0.85, 1, 0.7)
  g.add(dollFace)

  const pitMat = new THREE.MeshBasicMaterial({ color: 0x020201, transparent: true, opacity: 0.95 })
  ;[
    [-0.07, 0.72, 0.1],
    [0.0, 0.7, 0.11],
    [0.1, 0.66, 0.12],
    [0.06, 0.68, 0.12],
  ].forEach(([x, y, z], i) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(i < 2 ? 0.018 : 0.022, 6, 6), pitMat)
    eye.position.set(x, y, z)
    g.add(eye)
  })

  // Wrong jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.06), bone)
  jaw.position.set(-0.02, 0.58, 0.1)
  jaw.rotation.x = 0.55
  jaw.rotation.z = 0.25
  g.add(jaw)

  // Too-long arms (asymmetric)
  const armL = limb(0.55, 0.03, ash)
  armL.position.set(-0.16, 0.5, 0)
  armL.rotation.z = 0.85
  armL.rotation.x = 0.4
  const armR = limb(0.62, 0.028, wet)
  armR.position.set(0.16, 0.48, 0.02)
  armR.rotation.z = -1.05
  armR.rotation.x = -0.35
  g.add(armL, armR)

  // Reaching oversized hand with ring bait
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.14), ash)
  palm.position.set(0.22, 0.15, 0.18)
  palm.rotation.x = -0.6
  g.add(palm)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 20), gold)
  ring.position.set(0.26, 0.18, 0.28)
  ring.name = 'ringGlint'
  g.add(ring)

  // Water disk at feet + weeds
  const plane = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 24),
    new THREE.MeshBasicMaterial({
      color: 0x0a1820,
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
    new THREE.RingGeometry(0.24, 0.3, 24),
    new THREE.MeshBasicMaterial({
      color: 0x3a6070,
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

  for (let i = 0; i < 6; i++) {
    const strand = limb(0.18 + Math.random() * 0.1, 0.007, wetMaterial(0x1a3028, 0.85))
    strand.position.set((Math.random() - 0.5) * 0.2, 0.72, (Math.random() - 0.5) * 0.1)
    strand.rotation.x = 0.9 + Math.random() * 0.5
    strand.rotation.z = (Math.random() - 0.5)
    g.add(strand)
  }

  // Shoulder dirt spike
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 4), ash)
  spike.position.set(-0.12, 0.58, -0.04)
  spike.rotation.z = 1.0
  g.add(spike)

  // Soft menacing point light feel via emissive void
  const voidCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x140808, transparent: true, opacity: 0.9 }),
  )
  voidCore.position.set(0, 0.4, 0.1)
  voidCore.name = 'voidCore'
  g.add(voidCore)

  g.scale.setScalar(1.35)
  g.userData.kind = 'boss'
  return g
}


/** Endgame → playground demon: wrong child-scale, swing chains, empty seats — dread. */
function buildPlaygroundDemon(): THREE.Group {
  const g = new THREE.Group()
  const ash = ashMaterial(0x1c1814, 0.9)
  const pale = ashMaterial(0x8a7e72, 0.78)
  const rust = ashMaterial(0x4a3020, 0.85)
  const chainMat = ashMaterial(0x3a3a38, 0.92)
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x050304, transparent: true, opacity: 0.95 })

  // Oversized child torso — too tall for the seat scale
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.1, 1, 1, 1), ash)
  torso.position.y = 0.34
  torso.scale.set(0.85, 1.35, 0.9)
  torso.rotation.z = 0.04
  g.add(torso)

  // Small head on long neck — child proportions gone wrong
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.12, 5), pale)
  neck.position.y = 0.58
  g.add(neck)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), pale)
  head.position.set(0.01, 0.68, 0.02)
  head.scale.set(0.95, 1.15, 0.9)
  g.add(head)

  // Vacant sockets — too far apart
  ;[-1, 1].forEach((side) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), voidMat)
    socket.position.set(side * 0.028, 0.7, 0.045)
    g.add(socket)
  })

  // Mouth as a thin dark smile that isn't
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.008), voidMat)
  mouth.position.set(0.01, 0.655, 0.05)
  mouth.rotation.z = 0.12
  g.add(mouth)

  // Too-long limbs dangling like swing riders
  const armL = limb(0.48, 0.016, ash)
  armL.position.set(-0.08, 0.48, 0)
  armL.rotation.z = 0.95
  armL.rotation.x = 0.25
  const armR = limb(0.52, 0.015, ash)
  armR.position.set(0.08, 0.46, 0.02)
  armR.rotation.z = -1.05
  armR.rotation.x = -0.2
  g.add(armL, armR)

  // Legs too thin, too long — dangling toward an empty seat
  const legL = limb(0.38, 0.014, ash)
  legL.position.set(-0.04, 0.16, 0)
  legL.rotation.z = 0.15
  const legR = limb(0.4, 0.013, ash)
  legR.position.set(0.045, 0.16, 0.01)
  legR.rotation.z = -0.2
  g.add(legL, legR)

  // Empty swing seat underfoot
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, 0.1), rust)
  seat.position.set(0, 0.04, 0.02)
  seat.name = 'swingSeat'
  g.add(seat)

  // Swing chains rising into darkness
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const link = new THREE.Mesh(
        new THREE.TorusGeometry(0.012, 0.004, 6, 10),
        chainMat,
      )
      link.position.set(side * 0.09, 0.08 + i * 0.07, -0.02)
      link.rotation.y = Math.PI / 2
      link.rotation.z = side * 0.05
      link.name = i === 0 ? (side < 0 ? 'chainL' : 'chainR') : ''
      g.add(link)
    }
  }

  // Second empty seat offset — wrong energy
  const seat2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.08), rust)
  seat2.position.set(0.28, 0.02, -0.08)
  seat2.rotation.y = 0.4
  seat2.name = 'emptySeat'
  g.add(seat2)
  for (let i = 0; i < 4; i++) {
    const link = new THREE.Mesh(
      new THREE.TorusGeometry(0.01, 0.003, 5, 8),
      chainMat,
    )
    link.position.set(0.28 + (i % 2) * 0.06 - 0.03, 0.06 + i * 0.055, -0.08)
    link.rotation.y = Math.PI / 2
    g.add(link)
  }

  // Soft void core in chest — playground-tainted
  const voidCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x100808, transparent: true, opacity: 0.92 }),
  )
  voidCore.position.set(0, 0.38, 0.06)
  voidCore.name = 'voidCore'
  g.add(voidCore)

  // Sand/mulch disc under swings
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 20),
    new THREE.MeshBasicMaterial({
      color: 0x1a1410,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = 0.005
  ground.name = 'sandGround'
  g.add(ground)

  g.scale.setScalar(1.45)
  g.userData.kind = 'demon'
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
    case 'boss':
      return buildThresholdWarden()
    case 'demon':
      return buildPlaygroundDemon()
  }
}

export interface EntityAnimState {
  aggression: number // 0..1 increases when player hesitates
  stutterClock: number
  lastStutter: number
  frozenUntil: number
}

export function animateHorrorEntity(
  group: THREE.Group,
  state: EntityAnimState,
  dt: number,
  elapsed: number,
): void {
  state.stutterClock += dt
  const agg = state.aggression

  // Sudden stillness
  if (elapsed < state.frozenUntil) {
    return
  }
  if (Math.random() < 0.008 + agg * 0.02) {
    state.frozenUntil = elapsed + 0.15 + Math.random() * 0.4
    return
  }

  // Stutter / snap motion
  const stutter = state.stutterClock - state.lastStutter > 0.12 + Math.random() * 0.2
  if (stutter) {
    state.lastStutter = state.stutterClock
    const snap = (0.02 + agg * 0.06) * (Math.random() > 0.5 ? 1 : -1)
    group.rotation.y += snap
    group.position.x += (Math.random() - 0.5) * 0.01 * (1 + agg)
  }

  const kind = group.userData.kind as SpiritKind

  if (kind === 'doll') {
    // Slow head turn toward "camera" feel + micro jitters
    group.rotation.y = Math.sin(elapsed * (0.4 + agg)) * (0.15 + agg * 0.35)
  } else if (kind === 'ring') {
    const glint = group.getObjectByName('ringGlint')
    if (glint) {
      glint.rotation.y = elapsed * 2.5
      const mat = (glint as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.4 + Math.sin(elapsed * 8) * 0.3 + agg * 0.4
    }
    // Hand creeps closer with aggression
    group.position.z = 0.02 * agg
    group.scale.setScalar(1 + agg * 0.15)
  } else if (kind === 'lake') {
    const ripple = group.getObjectByName('ripple')
    if (ripple) {
      const s = 1 + Math.sin(elapsed * 1.5) * 0.08 + agg * 0.1
      ripple.scale.set(s, s, s)
    }
    // Rise higher when aggressive
    group.children.forEach((c) => {
      if (c.name !== 'waterPlane' && c.name !== 'ripple') {
        c.position.y += Math.sin(elapsed * 0.8) * 0.0003
      }
    })
    group.position.y = agg * 0.04
  } else if (kind === 'tombstone') {
    // Wrong bob — irregular
    group.position.y = Math.abs(Math.sin(elapsed * 1.1)) * 0.02 + agg * 0.03
    group.rotation.z = Math.sin(elapsed * 0.7) * 0.05 + (Math.random() - 0.5) * 0.002 * agg
  } else if (kind === 'boss') {
    const glint = group.getObjectByName('ringGlint')
    if (glint) {
      glint.rotation.y = elapsed * 3.2
      const mat = (glint as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(elapsed * 10) * 0.4 + agg * 0.5
    }
    const ripple = group.getObjectByName('ripple')
    if (ripple) {
      const s = 1 + Math.sin(elapsed * 2.2) * 0.12 + agg * 0.15
      ripple.scale.set(s, s, s)
    }
    group.position.y = Math.abs(Math.sin(elapsed * 1.4)) * 0.03 + agg * 0.06
    group.rotation.y = Math.sin(elapsed * 0.55) * (0.12 + agg * 0.25)
    group.rotation.z = (Math.random() - 0.5) * 0.01 * (1 + agg * 2)
    group.scale.setScalar(1.35 + agg * 0.12)
  } else if (kind === 'demon') {
    // Swing sway — empty seats energy
    const sway = Math.sin(elapsed * (1.1 + agg * 0.8)) * (0.08 + agg * 0.12)
    group.rotation.z = sway
    group.position.x = Math.sin(elapsed * 0.9) * 0.02 * (1 + agg)
    group.position.y = Math.abs(Math.sin(elapsed * 1.6)) * 0.025 + agg * 0.08
    const seat = group.getObjectByName('swingSeat')
    if (seat) {
      seat.rotation.z = Math.sin(elapsed * 1.8) * 0.06
    }
    const empty = group.getObjectByName('emptySeat')
    if (empty) {
      empty.rotation.y = 0.4 + Math.sin(elapsed * 0.7) * 0.15
    }
    group.scale.setScalar(1.45 + agg * 0.18)
  }

  // Opacity flicker when aggressive
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material && 'opacity' in obj.material) {
      const m = obj.material as THREE.MeshStandardMaterial
      if (m.transparent && agg > 0.4 && Math.random() < 0.05) {
        m.opacity = Math.max(0.25, (m.userData.baseOpacity ?? m.opacity) * (0.5 + Math.random() * 0.5))
      }
    }
  })
}

export function setEntityAggression(group: THREE.Group, aggression: number): void {
  group.userData.aggression = aggression
}
