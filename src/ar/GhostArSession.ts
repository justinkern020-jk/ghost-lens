import * as THREE from 'three'
import type { SpiritKind } from '../types'
import {
  animateHorrorEntity,
  createAnimState,
  createHorrorEntity,
  triggerFakeOut,
  type EntityAnimState,
} from './HorrorEntities'
import {
  createDemonFinaleScene,
  type FinaleSceneHandle,
} from './DemonFinaleScene'
import { createWerewolfScene } from './WerewolfScene'

export type ArSessionStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'ended'
  | 'error'

export interface GhostArCallbacks {
  onStatus?: (s: ArSessionStatus, detail?: string) => void
  onAnchorPlaced?: (target: SpiritKind) => void
  onAnchorLost?: () => void
}

/**
 * WebXR immersive-ar with hit-test + anchors.
 * Horror entity is world-anchored — stays fixed in the scene as the phone moves.
 * Proximity pulls the figure toward the viewer (approach threat).
 */
export class GhostArSession {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private session: XRSession | null = null
  private refSpace: XRReferenceSpace | null = null
  private hitTestSource: XRHitTestSource | null = null
  private viewerSpace: XRReferenceSpace | null = null
  private entityRoot: THREE.Group | null = null
  private entity: THREE.Group | null = null
  private approachOffset: THREE.Group | null = null
  private anchor: XRAnchor | null = null
  private anchored = false
  private pendingTarget: SpiritKind | null = null
  private activeTarget: SpiritKind | null = null
  private placeRequested = false
  private fleeing = false
  private callbacks: GhostArCallbacks
  private canvas: HTMLCanvasElement
  private clock = new THREE.Clock()
  private lastHitMatrix: THREE.Matrix4 | null = null
  private animState: EntityAnimState = createAnimState()
  private proximity = 0
  private light: THREE.HemisphereLight | null = null
  private tmpCamPos = new THREE.Vector3()
  private tmpAnchorPos = new THREE.Vector3()
  private tmpDir = new THREE.Vector3()
  private finale: FinaleSceneHandle | null = null
  private finalePlaying = false

  constructor(canvas: HTMLCanvasElement, callbacks: GhostArCallbacks = {}) {
    this.canvas = canvas
    this.callbacks = callbacks
  }

  static async isSupported(): Promise<boolean> {
    if (!navigator.xr) return false
    try {
      return await navigator.xr.isSessionSupported('immersive-ar')
    } catch {
      return false
    }
  }

  async start(): Promise<void> {
    this.callbacks.onStatus?.('starting')
    if (!navigator.xr) {
      this.callbacks.onStatus?.('error', 'WebXR not available')
      throw new Error('WebXR not available')
    }

    const overlayRoot =
      document.getElementById('ar-overlay') ?? document.body

    const sessionInit: XRSessionInit = {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['anchors', 'dom-overlay', 'local'],
      domOverlay: { root: overlayRoot },
    }

    const session = await navigator.xr.requestSession(
      'immersive-ar',
      sessionInit,
    )

    this.session = session
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera()
    this.camera.matrixAutoUpdate = false

    this.light = new THREE.HemisphereLight(0x8899aa, 0x221100, 1.1)
    this.scene.add(this.light)
    const dir = new THREE.DirectionalLight(0xcbd5d0, 0.4)
    dir.position.set(1, 2, 0.5)
    this.scene.add(dir)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight, false)
    this.renderer.xr.enabled = true
    await this.renderer.xr.setSession(session)

    this.entityRoot = new THREE.Group()
    this.entityRoot.visible = false
    this.approachOffset = new THREE.Group()
    this.entityRoot.add(this.approachOffset)
    this.scene.add(this.entityRoot)

    this.refSpace = await session.requestReferenceSpace('local')
    this.viewerSpace = await session.requestReferenceSpace('viewer')

    if (session.requestHitTestSource && this.viewerSpace) {
      this.hitTestSource =
        (await session.requestHitTestSource({ space: this.viewerSpace })) ?? null
    }

    session.addEventListener('end', () => {
      this.cleanup()
      this.callbacks.onStatus?.('ended')
    })

    this.renderer.setAnimationLoop((_time, frame) => this.onXRFrame(frame))
    this.callbacks.onStatus?.('running')
  }

  private spawnEntity(target: SpiritKind) {
    if (!this.approachOffset) return
    if (this.entity) {
      this.approachOffset.remove(this.entity)
      this.entity.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m) => m.dispose())
        }
      })
    }
    this.entity = createHorrorEntity(target)
    this.activeTarget = target
    this.approachOffset.add(this.entity)
    this.approachOffset.position.set(0, 0, 0)
    this.approachOffset.scale.set(1, 1, 1)
    this.proximity = 0
    this.animState = createAnimState()
  }

  requestPlace(target: SpiritKind) {
    if (this.activeTarget !== target || !this.entity) {
      this.spawnEntity(target)
    }
    this.pendingTarget = target
    this.placeRequested = true
    this.fleeing = false
    if (this.entityRoot) this.entityRoot.visible = true
  }

  setAggression(n: number) {
    this.animState.aggression = Math.max(0, Math.min(1, n))
  }

  /** 0 = at anchor, 1 = in the player's face (melee). */
  setProximity(n: number) {
    this.proximity = Math.max(0, Math.min(1, n))
    this.animState.proximity = this.proximity
  }

  /** Hesitation fake-out lunge — visual snap toward the lens. */
  triggerFakeOut() {
    const elapsed = this.clock.elapsedTime
    if (triggerFakeOut(this.animState, elapsed)) {
      // Brief approach spike
      this.proximity = Math.min(1, this.proximity + 0.18)
      this.animState.proximity = this.proximity
    }
  }

  /**
   * Climactic endgame at the last anchor / hit pose:
   * polaroid falls, ground opens, hell hands drag it under.
   */
  playDemonFinale(
    polaroidDataUrl: string | null,
    onPhase?: (name: string) => void,
    onComplete?: () => void,
  ) {
    if (!this.scene) {
      onComplete?.()
      return
    }
    // Hide living entity; keep root pose for ground
    if (this.entity && this.approachOffset) {
      this.approachOffset.remove(this.entity)
      this.entity = null
    }
    this.fleeing = false
    this.placeRequested = false
    this.proximity = 0
    if (this.approachOffset) {
      this.approachOffset.position.set(0, 0, 0)
      this.approachOffset.scale.set(1, 1, 1)
    }
    if (this.finale) {
      this.scene.remove(this.finale.root)
      this.finale.dispose()
      this.finale = null
    }
    const handle = createDemonFinaleScene(polaroidDataUrl, (phase) => {
      onPhase?.(phase)
      if (phase === 'done') {
        this.finalePlaying = false
        if (this.finale && this.scene) {
          this.scene.remove(this.finale.root)
          this.finale.dispose()
          this.finale = null
        }
        if (this.entityRoot) this.entityRoot.visible = false
        onComplete?.()
      }
    })
    // Parent under entityRoot so it inherits world anchor
    if (this.entityRoot) {
      this.entityRoot.visible = true
      this.entityRoot.add(handle.root)
    } else {
      this.scene.add(handle.root)
    }
    this.finale = handle
    this.finalePlaying = true
    this.activeTarget = null
  }


  /**
   * Keller refuse path: hunter transforms into werewolf and lunges.
   * World-anchored when an entity root exists; otherwise scene-root.
   */
  playWerewolfAttack(
    onPhase?: (name: string) => void,
    onComplete?: () => void,
  ) {
    if (!this.scene) {
      onComplete?.()
      return
    }
    if (this.entity && this.approachOffset) {
      this.approachOffset.remove(this.entity)
      this.entity = null
    }
    this.fleeing = false
    this.placeRequested = false
    this.proximity = 0
    if (this.approachOffset) {
      this.approachOffset.position.set(0, 0, 0)
      this.approachOffset.scale.set(1, 1, 1)
    }
    if (this.finale) {
      this.scene.remove(this.finale.root)
      this.finale.dispose()
      this.finale = null
    }
    const handle = createWerewolfScene((phase) => {
      onPhase?.(phase)
      if (phase === 'done') {
        this.finalePlaying = false
        if (this.finale && this.scene) {
          this.scene.remove(this.finale.root)
          this.finale.dispose()
          this.finale = null
        }
        if (this.entityRoot) this.entityRoot.visible = false
        onComplete?.()
      }
    })
    // Face the viewer — place slightly in front of camera if no anchor
    handle.root.position.set(0, 0, 0)
    if (this.entityRoot) {
      this.entityRoot.visible = true
      this.entityRoot.add(handle.root)
    } else {
      this.scene.add(handle.root)
      handle.root.position.set(0, 0, -1.2)
    }
    this.finale = handle
    this.finalePlaying = true
    this.activeTarget = null
  }

  get isFinalePlaying() {
    return this.finalePlaying
  }

  hideGhost() {
    this.fleeing = true
    this.placeRequested = false
    this.anchored = false
    this.pendingTarget = null
    this.proximity = 0
    if (this.anchor) {
      try {
        this.anchor.delete()
      } catch {
        /* ignore */
      }
      this.anchor = null
    }
    this.callbacks.onAnchorLost?.()
  }

  get isAnchored() {
    return this.anchored && !!this.entityRoot?.visible
  }

  getGhostVisible() {
    return !!this.entityRoot?.visible && !this.fleeing
  }

  getActiveTarget() {
    return this.activeTarget
  }

  getProximity() {
    return this.proximity
  }

  captureStill(): string | null {
    if (!this.renderer) return null
    try {
      return this.canvas.toDataURL('image/jpeg', 0.92)
    } catch {
      return null
    }
  }

  async end() {
    if (this.session) {
      try {
        await this.session.end()
      } catch {
        this.cleanup()
      }
    } else {
      this.cleanup()
    }
  }

  private cleanup() {
    if (this.renderer) this.renderer.setAnimationLoop(null)
    if (this.hitTestSource) {
      this.hitTestSource.cancel()
      this.hitTestSource = null
    }
    if (this.anchor) {
      try {
        this.anchor.delete()
      } catch {
        /* ignore */
      }
      this.anchor = null
    }
    this.session = null
    this.anchored = false
    this.entity = null
    this.approachOffset = null
    this.entityRoot = null
    this.activeTarget = null
    if (this.finale) {
      this.finale.dispose()
      this.finale = null
    }
    this.finalePlaying = false
  }

  private applyPoseToRoot(matrix: Float32Array | number[]) {
    if (!this.entityRoot) return
    this.entityRoot.matrix.fromArray(matrix)
    this.entityRoot.matrixAutoUpdate = false
    this.entityRoot.matrix.decompose(
      this.entityRoot.position,
      this.entityRoot.quaternion,
      this.entityRoot.scale,
    )
    // Lake sits on plane; others lift slightly
    const lift = this.activeTarget === 'lake' ? 0.0 : this.activeTarget === 'boss' || this.activeTarget === 'demon' ? 0.02 : 0.05
    this.entityRoot.position.y += lift
    this.entityRoot.visible = true
    this.entityRoot.updateMatrix()
  }

  /** Pull entity toward viewer + scale up with proximity (approach threat). */
  private applyApproach(frame: XRFrame) {
    if (!this.approachOffset || !this.entityRoot || !this.refSpace) {
      return
    }
    // Fake-out boost from anim state
    let p = this.proximity
    const now = this.clock.elapsedTime
    if (now < this.animState.fakeOutUntil) {
      const peak = this.animState.fakeOutPeak
      let boost = 0
      if (now < peak) boost = (now - (peak - 0.18)) / 0.18
      else boost = 1 - (now - peak) / Math.max(0.01, this.animState.fakeOutUntil - peak)
      p = Math.min(1, p + Math.max(0, boost) * 0.35)
    }
    // Last 20% of proximity: hard rush into face
    if (p > 0.8) {
      const u = (p - 0.8) / 0.2
      p = 0.8 + 0.2 * (u * u * (2 - u)) // ease into melee loom
    }
    if (p <= 0.001) {
      this.approachOffset.position.set(0, 0, 0)
      this.approachOffset.scale.setScalar(1)
      return
    }

    const viewerPose = frame.getViewerPose(this.refSpace)
    if (!viewerPose) {
      // Fallback: scale + local Z toward typical camera
      this.approachOffset.position.set(0, p * 0.08, p * 0.55)
      this.approachOffset.scale.setScalar(1 + p * 1.35)
      return
    }

    const cam = viewerPose.transform.position
    this.tmpCamPos.set(cam.x, cam.y, cam.z)
    this.tmpAnchorPos.copy(this.entityRoot.position)
    this.tmpDir.copy(this.tmpCamPos).sub(this.tmpAnchorPos)
    const dist = this.tmpDir.length()
    if (dist > 0.01) {
      this.tmpDir.normalize()
      // Move up to ~70% of the gap toward camera at full proximity (boss farther/faster)
      const isDemon = this.activeTarget === 'demon'
      const isBoss = this.activeTarget === 'boss' || isDemon
      const pull = Math.min(
        dist * (isDemon ? 0.92 : isBoss ? 0.85 : 0.72),
        isDemon ? 2.0 : isBoss ? 1.75 : 1.4,
      ) * p
      // World direction → root-local offset
      this.tmpDir.applyQuaternion(
        this.entityRoot.quaternion.clone().invert(),
      )
      this.approachOffset.position.copy(this.tmpDir.multiplyScalar(pull))
    }
    // Scale up as it closes — reads as looming (demon looms hardest)
    const loomBoost =
      this.activeTarget === 'demon' ? 1.65 : this.activeTarget === 'boss' ? 1.4 : 1.1
    this.approachOffset.scale.setScalar(1 + p * 1.55 * loomBoost)
  }

  private onXRFrame(frame: XRFrame | undefined) {
    if (!this.renderer || !this.scene || !this.camera || !frame || !this.refSpace) {
      return
    }

    const dt = Math.min(this.clock.getDelta(), 0.05)
    const elapsed = this.clock.elapsedTime

    if (this.finalePlaying && this.finale) {
      this.finale.update(dt, elapsed)
    }

    if (this.entity && this.entityRoot?.visible && !this.fleeing && !this.finalePlaying) {
      animateHorrorEntity(this.entity, this.animState, dt, elapsed)
      this.applyApproach(frame)
    }

    if (this.fleeing && this.entityRoot) {
      this.entityRoot.scale.multiplyScalar(0.92)
      this.entityRoot.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material && 'opacity' in o.material) {
          const m = o.material as THREE.Material & { opacity: number }
          m.opacity *= 0.88
        }
      })
      if (this.entityRoot.scale.x < 0.05) {
        this.entityRoot.visible = false
        this.fleeing = false
        this.entityRoot.scale.set(1, 1, 1)
        if (this.approachOffset) {
          this.approachOffset.position.set(0, 0, 0)
          this.approachOffset.scale.set(1, 1, 1)
        }
        if (this.entity && this.approachOffset) {
          this.approachOffset.remove(this.entity)
          this.entity = null
          this.activeTarget = null
        }
      }
    }

    if (this.anchor && this.entityRoot && !this.fleeing) {
      const pose = frame.getPose(this.anchor.anchorSpace, this.refSpace)
      if (pose) this.applyPoseToRoot(pose.transform.matrix)
    } else if (
      this.anchored &&
      this.lastHitMatrix &&
      this.entityRoot &&
      !this.placeRequested &&
      !this.fleeing
    ) {
      this.entityRoot.matrix.copy(this.lastHitMatrix)
      this.entityRoot.matrix.decompose(
        this.entityRoot.position,
        this.entityRoot.quaternion,
        this.entityRoot.scale,
      )
    }

    if (
      this.placeRequested &&
      this.hitTestSource &&
      this.pendingTarget &&
      !this.fleeing
    ) {
      const hits = frame.getHitTestResults(this.hitTestSource)
      if (hits.length > 0) {
        const hit = hits[0]
        const pose = hit.getPose(this.refSpace)
        if (pose && this.entityRoot) {
          this.applyPoseToRoot(pose.transform.matrix)
          this.lastHitMatrix = this.entityRoot.matrix.clone()

          const createAnchor = (
            hit as XRHitTestResult & {
              createAnchor?: (
                t: XRRigidTransform,
                space: XRReferenceSpace,
              ) => Promise<XRAnchor>
            }
          ).createAnchor

          if (createAnchor) {
            createAnchor
              .call(hit, pose.transform, this.refSpace)
              .then((a: XRAnchor) => {
                if (this.anchor) {
                  try {
                    this.anchor.delete()
                  } catch {
                    /* ignore */
                  }
                }
                this.anchor = a
                this.anchored = true
                this.placeRequested = false
                if (this.pendingTarget) {
                  this.callbacks.onAnchorPlaced?.(this.pendingTarget)
                }
              })
              .catch(() => {
                this.anchored = true
                this.placeRequested = false
                if (this.pendingTarget) {
                  this.callbacks.onAnchorPlaced?.(this.pendingTarget)
                }
              })
          } else {
            this.anchored = true
            this.placeRequested = false
            this.callbacks.onAnchorPlaced?.(this.pendingTarget)
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera)
  }
}

export async function checkWebXrAr(): Promise<{
  supported: boolean
  reason?: string
}> {
  if (typeof navigator === 'undefined' || !navigator.xr) {
    return {
      supported: false,
      reason: 'WebXR API missing — use Chrome on Android with ARCore.',
    }
  }
  try {
    const ok = await navigator.xr.isSessionSupported('immersive-ar')
    if (!ok) {
      return {
        supported: false,
        reason:
          'immersive-ar not supported. On Pixel: Chrome + Google Play Services for AR (ARCore).',
      }
    }
    return { supported: true }
  } catch {
    return { supported: false, reason: 'Could not query WebXR session support.' }
  }
}
