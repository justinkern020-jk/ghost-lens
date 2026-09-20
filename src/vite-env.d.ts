/// <reference types="vite/client" />

interface XRSessionInit {
  domOverlay?: { root: Element }
}

interface XRHitTestResult {
  createAnchor?(
    transform: XRRigidTransform,
    space: XRReferenceSpace,
  ): Promise<XRAnchor>
}
