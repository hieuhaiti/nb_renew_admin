import { useEffect, useMemo, useRef } from 'react'
import { parseLink } from '@/lib/utils'

interface Vec3 {
  x?: number | null
  y?: number | null
  z?: number | null
}

export interface PreviewHotspot {
  id: string
  name?: string | null
  hotspot_type?: string | null
  position?: Vec3 | object | null
  scale?: Vec3 | object | null
  visible?: boolean
  is_active?: boolean
}

interface Props {
  imageUrl?: string | null
  cameraPosition?: Vec3 | object | null
  cameraRotation?: Vec3 | object | null
  cameraFov?: number | null
  hotspots?: PreviewHotspot[]
  selectedHotspotId?: string | null
  height?: string
  className?: string
}

const LABEL_MAX_WIDTH = 420
const LABEL_MAX_LINES = 2
const LABEL_FONT_SIZE = 26
const LABEL_LINE_HEIGHT = 32
const LABEL_PADDING_X = 22
const LABEL_PADDING_Y = 14
const LABEL_BORDER_RADIUS = 16
const LABEL_BG_COLOR = 'rgba(9, 74, 103, 0.92)'
const LABEL_TEXT_COLOR = '#ffffff'
const LABEL_PLANE_BASE_WIDTH = 1.15
const LABEL_Y_OFFSET = 0.92

const num = (v: unknown, def = 0): number => {
  const x = Number(v)
  return Number.isNaN(x) ? def : x
}

const v3s = (v?: Vec3 | object | null, def = '0 0 0'): string => {
  if (!v) return def
  const { x = 0, y = 0, z = 0 } = v as Vec3
  return `${num(x)} ${num(y)} ${num(z)}`
}

const radToDeg = (v: number): number => Number(((v * 180) / Math.PI).toFixed(3))
const degToRad = (v: number): number => (v * Math.PI) / 180

interface RequiredVec3 {
  x: number
  y: number
  z: number
}

function toVec3(v?: Vec3 | object | null, def: RequiredVec3 = { x: 0, y: 0, z: 0 }) {
  const value = (v ?? {}) as Vec3
  return {
    x: num(value.x, def.x),
    y: num(value.y, def.y),
    z: num(value.z, def.z),
  }
}

function getCameraDebugState(camEl: Element | null) {
  const cam = camEl as any
  const obj = cam?.object3D
  const lookControls = cam?.components?.['look-controls']
  return {
    attrPosition: cam?.getAttribute?.('position'),
    attrRotation: cam?.getAttribute?.('rotation'),
    attrFov: cam?.getAttribute?.('fov'),
    objectPosition: obj
      ? {
          x: Number(obj.position.x.toFixed(3)),
          y: Number(obj.position.y.toFixed(3)),
          z: Number(obj.position.z.toFixed(3)),
        }
      : null,
    objectRotationDeg: obj
      ? {
          x: radToDeg(obj.rotation.x),
          y: radToDeg(obj.rotation.y),
          z: radToDeg(obj.rotation.z),
        }
      : null,
    lookControls: lookControls
      ? {
          hasPitchObject: !!lookControls.pitchObject,
          hasYawObject: !!lookControls.yawObject,
          pitchObjectDeg: lookControls.pitchObject
            ? radToDeg(lookControls.pitchObject.rotation.x)
            : null,
          yawObjectDeg: lookControls.yawObject ? radToDeg(lookControls.yawObject.rotation.y) : null,
        }
      : null,
  }
}

function applyCameraState(
  camEl: Element,
  position: Vec3 | object | null | undefined,
  rotation: Vec3 | object | null | undefined,
  fov: number
) {
  const cam = camEl as any
  const nextPosition = toVec3(position, { x: 0, y: 1.6, z: 0 })
  const nextRotation = toVec3(rotation, { x: 0, y: 0, z: 0 })

  camEl.setAttribute('position', `${nextPosition.x} ${nextPosition.y} ${nextPosition.z}`)
  camEl.setAttribute('rotation', `${nextRotation.x} ${nextRotation.y} ${nextRotation.z}`)
  camEl.setAttribute('fov', String(fov))

  const lookControls = cam?.components?.['look-controls']
  if (lookControls?.pitchObject && lookControls?.yawObject) {
    lookControls.pitchObject.rotation.x = degToRad(nextRotation.x)
    lookControls.yawObject.rotation.y = degToRad(nextRotation.y)
    if (lookControls.magicWindowDeltaEuler) {
      lookControls.magicWindowDeltaEuler.set(0, 0, degToRad(nextRotation.z))
    }
    lookControls.updateOrientation?.()
  } else if (cam?.object3D) {
    cam.object3D.rotation.set(
      degToRad(nextRotation.x),
      degToRad(nextRotation.y),
      degToRad(nextRotation.z)
    )
  }
}

const normalizeLabel = (label?: string | null): string =>
  (label ?? 'Hotspot').replace(/\s+/g, ' ').trim() || 'Hotspot'

function splitLabelLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxTextWidth: number,
  maxLines: number
): string[] {
  const words = text.split(' ')
  if (!words.length) return ['Hotspot']

  const lines: string[] = []
  let currentLine = ''

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i]
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (context.measureText(candidate).width <= maxTextWidth) {
      currentLine = candidate
      continue
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word
    if (lines.length === maxLines - 1) break
  }

  if (lines.length < maxLines && currentLine) lines.push(currentLine)

  if (lines.length > maxLines) return lines.slice(0, maxLines)
  if (lines.length < words.length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/\.+$/, '')}...`
  }

  return lines
}

function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.lineTo(x + width - r, y)
  context.quadraticCurveTo(x + width, y, x + width, y + r)
  context.lineTo(x + width, y + height - r)
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  context.lineTo(x + r, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - r)
  context.lineTo(x, y + r)
  context.quadraticCurveTo(x, y, x + r, y)
  context.closePath()
}

function createVietnameseLabelTexture(label: string) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return null

  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  const logicalWidth = LABEL_MAX_WIDTH

  context.font = `600 ${LABEL_FONT_SIZE}px "Be Vietnam Pro", "Noto Sans", Arial, sans-serif`
  const maxTextWidth = logicalWidth - LABEL_PADDING_X * 2
  const lines = splitLabelLines(context, label, maxTextWidth, LABEL_MAX_LINES)
  const logicalHeight = LABEL_PADDING_Y * 2 + lines.length * LABEL_LINE_HEIGHT

  canvas.width = Math.ceil(logicalWidth * pixelRatio)
  canvas.height = Math.ceil(logicalHeight * pixelRatio)

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, logicalWidth, logicalHeight)
  roundRectPath(context, 0, 0, logicalWidth, logicalHeight, LABEL_BORDER_RADIUS)
  context.fillStyle = LABEL_BG_COLOR
  context.fill()

  context.font = `600 ${LABEL_FONT_SIZE}px "Be Vietnam Pro", "Noto Sans", Arial, sans-serif`
  context.fillStyle = LABEL_TEXT_COLOR
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const centerX = logicalWidth / 2
  const contentHeight = lines.length * LABEL_LINE_HEIGHT
  const startY = (logicalHeight - contentHeight) / 2 + LABEL_LINE_HEIGHT / 2

  lines.forEach((line, lineIndex) => {
    context.fillText(line, centerX, startY + lineIndex * LABEL_LINE_HEIGHT)
  })

  return {
    canvas,
    width: logicalWidth,
    height: logicalHeight,
  }
}

function createHotspotLabel(label: string) {
  const THREE = (window as any).AFRAME?.THREE || (window as any).THREE
  if (!THREE) return null

  const texturePayload = createVietnameseLabelTexture(label)
  if (!texturePayload) return null

  const texture = new THREE.CanvasTexture(texturePayload.canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  const planeWidth = LABEL_PLANE_BASE_WIDTH
  const planeHeight = (texturePayload.height / texturePayload.width) * planeWidth
  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, LABEL_Y_OFFSET, 0)
  mesh.renderOrder = 1000
  mesh.userData.disposeLabel = () => {
    geometry.dispose()
    material.map?.dispose()
    material.dispose()
  }

  return mesh
}

function disposeHotspotEntity(node: Element) {
  const hsEntity = node as any
  const labelEntity = hsEntity.querySelector?.('[data-role="hotspot-label"]') as any
  const labelObj = labelEntity?.object3DMap?.['hotspot-label']
  labelObj?.userData?.disposeLabel?.()
  labelEntity?.removeObject3D?.('hotspot-label')
}

function renderHotspots(root: Element, hotspots: PreviewHotspot[]) {
  while (root.firstChild) {
    const child = root.firstChild
    if (child instanceof Element) disposeHotspotEntity(child)
    root.removeChild(child)
  }

  hotspots
    .filter((hotspot) => hotspot.is_active !== false && hotspot.visible !== false)
    .forEach((hotspot) => {
      const pos = hotspot.position || { x: 0, y: 1.6, z: -3 }
      const scl = hotspot.scale as Vec3 | null
      const sx = num(scl?.x, 1)
      const sy = num(scl?.y, 1)
      const sz = num(scl?.z, 1)

      const entity = document.createElement('a-entity')
      entity.setAttribute(
        'position',
        `${num((pos as Vec3).x)} ${num((pos as Vec3).y, 1.6)} ${num((pos as Vec3).z)}`
      )
      entity.setAttribute('scale', `${sx} ${sy} ${sz}`)

      const halo = document.createElement('a-entity')
      halo.setAttribute('geometry', 'primitive: torus; radius: 0.18; radiusTubular: 0.012')
      halo.setAttribute(
        'material',
        'color: #38bdf8; opacity: 0.86; transparent: true; shader: flat'
      )
      halo.setAttribute('position', '0 0.18 0')
      halo.setAttribute(
        'animation',
        'property: rotation; to: 0 360 0; dur: 2600; loop: true; easing: linear'
      )

      const dot = document.createElement('a-entity')
      dot.setAttribute('geometry', 'primitive: sphere; radius: 0.09')
      dot.setAttribute('material', 'color: #f8fafc; opacity: 0.96; transparent: true; shader: flat')
      dot.setAttribute('position', '0 0.18 0')
      dot.setAttribute(
        'animation',
        'property: scale; to: 1.25 1.25 1.25; dir: alternate; dur: 850; loop: true; easing: easeInOutSine'
      )

      const stem = document.createElement('a-entity')
      stem.setAttribute('geometry', 'primitive: cylinder; radius: 0.014; height: 0.34')
      stem.setAttribute('material', 'color: #0e7490; shader: flat')
      stem.setAttribute('position', '0 0 0')

      const labelEntity = document.createElement('a-entity')
      labelEntity.setAttribute('data-role', 'hotspot-label')
      labelEntity.setAttribute('face-camera', '')

      const labelMesh = createHotspotLabel(normalizeLabel(hotspot.name || hotspot.hotspot_type))
      if (labelMesh) {
        ;(labelEntity as any).setObject3D('hotspot-label', labelMesh)
      } else {
        labelEntity.setAttribute(
          'text',
          'value: Hotspot; color: #ffffff; align: center; width: 3.8; wrapCount: 22; shader: msdf; negate: false'
        )
        labelEntity.setAttribute('position', `0 ${LABEL_Y_OFFSET} 0`)
      }

      entity.appendChild(stem)
      entity.appendChild(halo)
      entity.appendChild(dot)
      entity.appendChild(labelEntity)
      root.appendChild(entity)
    })
}

function registerAframeComponents() {
  const af = (window as any).AFRAME
  if (!af) return
  if (!af.components['face-camera']) {
    af.registerComponent('face-camera', {
      tick() {
        const cam = this.el?.sceneEl?.camera
        if (!cam || !this.el?.object3D) return
        this.el.object3D.lookAt(cam.position)
      },
    })
  }
}

export default function AframeScenePreview({
  imageUrl,
  cameraPosition,
  cameraRotation,
  cameraFov,
  hotspots = [],
  selectedHotspotId,
  height = '360px',
  className,
}: Props) {
  const debug = import.meta.env.DEV
  const containerRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)
  const hotspotRootRef = useRef<Element | null>(null)
  const hotspotsRef = useRef<PreviewHotspot[]>(hotspots)

  const src = useMemo(() => (imageUrl ? parseLink(imageUrl) : undefined), [imageUrl])
  const camPos = v3s(cameraPosition, '0 1.6 0')
  const camRot = v3s(cameraRotation, '0 0 0')
  const fov = cameraFov ?? 80
  const resolvedCameraPosition = useMemo(
    () => toVec3(cameraPosition, { x: 0, y: 1.6, z: 0 }),
    [camPos]
  )
  const resolvedCameraRotation = useMemo(
    () => toVec3(cameraRotation, { x: 0, y: 0, z: 0 }),
    [camRot]
  )
  const cameraStateRef = useRef({
    position: resolvedCameraPosition,
    rotation: resolvedCameraRotation,
    fov,
    camPos,
    camRot,
  })

  const sceneMarkup = useMemo(
    () =>
      src
        ? `<a-scene id="aframe-scene" embedded vr-mode-ui="enabled:false" loading-screen="enabled:false" renderer="colorManagement:true" style="width:100%;height:${height}">` +
          `<a-assets><img id="aframe-pano" src="${src}" crossorigin="anonymous" /></a-assets>` +
          `<a-sky src="#aframe-pano" radius="500"></a-sky>` +
          `<a-camera position="${camPos}" rotation="${camRot}" fov="${fov}" look-controls wasd-controls="enabled:false">` +
          `<a-entity cursor="fuse:false;rayOrigin:mouse" geometry="primitive:ring;radiusInner:0.014;radiusOuter:0.023" material="color:#e2e8f0;shader:flat" position="0 0 -1"></a-entity>` +
          `</a-camera>` +
          `<a-entity id="aframe-hotspots-root"></a-entity>` +
          `</a-scene>`
        : '',
    [src, height]
  )

  useEffect(() => {
    if (!debug) return
    console.debug('[AframeScenePreview] props changed', {
      imageUrl,
      src,
      cameraPosition,
      cameraRotation,
      cameraFov,
      camPos,
      camRot,
      fov,
      hotspotCount: hotspots.length,
      selectedHotspotId,
    })
  }, [
    debug,
    imageUrl,
    src,
    cameraPosition,
    cameraRotation,
    cameraFov,
    camPos,
    camRot,
    fov,
    hotspots.length,
    selectedHotspotId,
  ])

  useEffect(() => {
    hotspotsRef.current = hotspots
  }, [hotspots])

  useEffect(() => {
    cameraStateRef.current = {
      position: resolvedCameraPosition,
      rotation: resolvedCameraRotation,
      fov,
      camPos,
      camRot,
    }
  }, [resolvedCameraPosition, resolvedCameraRotation, fov, camPos, camRot])

  useEffect(() => {
    if (!src || !containerRef.current || readyRef.current) return

    import('aframe')
      .then(() => {
        registerAframeComponents()
        if (!containerRef.current) return
        containerRef.current.innerHTML = sceneMarkup
        readyRef.current = true
        hotspotRootRef.current = containerRef.current.querySelector('#aframe-hotspots-root')
        const camEl = containerRef.current.querySelector('a-camera')
        if (camEl) {
          const cameraState = cameraStateRef.current
          applyCameraState(camEl, cameraState.position, cameraState.rotation, cameraState.fov)
          requestAnimationFrame(() =>
            applyCameraState(camEl, cameraState.position, cameraState.rotation, cameraState.fov)
          )
        }
        if (hotspotRootRef.current) {
          renderHotspots(hotspotRootRef.current, hotspotsRef.current)
          requestAnimationFrame(() => {
            if (hotspotRootRef.current) renderHotspots(hotspotRootRef.current, hotspotsRef.current)
          })
        }
        if (debug) {
          const cameraState = cameraStateRef.current
          console.debug('[AframeScenePreview] scene mounted', {
            requested: {
              camPos: cameraState.camPos,
              camRot: cameraState.camRot,
              fov: cameraState.fov,
            },
            camera: getCameraDebugState(camEl),
            hasHotspotRoot: !!hotspotRootRef.current,
            renderedHotspotCount: hotspotsRef.current.filter(
              (hotspot) => hotspot.is_active !== false && hotspot.visible !== false
            ).length,
          })
          requestAnimationFrame(() => {
            console.debug('[AframeScenePreview] scene mounted after frame', {
              camera: getCameraDebugState(camEl),
            })
          })
        }
      })
      .catch((error) => {
        if (debug) console.debug('[AframeScenePreview] failed to import aframe', { error })
      })

    return () => {
      readyRef.current = false
      hotspotRootRef.current = null
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [sceneMarkup, src, debug])

  useEffect(() => {
    if (!src) return
    const root = hotspotRootRef.current
    if (!root) {
      if (debug) {
        console.debug('[AframeScenePreview] skip hotspot render, root not ready', {
          hotspotCount: hotspots.length,
        })
      }
      return
    }
    if (debug) {
      console.debug('[AframeScenePreview] render hotspots', {
        hotspotCount: hotspots.length,
        visibleHotspotCount: hotspots.filter(
          (hotspot) => hotspot.is_active !== false && hotspot.visible !== false
        ).length,
      })
    }
    renderHotspots(root, hotspots)
  }, [hotspots, src, debug])

  useEffect(() => {
    if (!readyRef.current || !containerRef.current) return
    const camEl = containerRef.current.querySelector('a-camera')
    if (!camEl) return
    if (debug) {
      console.debug('[AframeScenePreview] before camera apply', {
        requested: { camPos, camRot, fov },
        camera: getCameraDebugState(camEl),
      })
    }
    applyCameraState(camEl, resolvedCameraPosition, resolvedCameraRotation, fov)
    if (debug) {
      console.debug('[AframeScenePreview] after camera apply', {
        requested: { camPos, camRot, fov },
        camera: getCameraDebugState(camEl),
      })
      requestAnimationFrame(() => {
        applyCameraState(camEl, resolvedCameraPosition, resolvedCameraRotation, fov)
        console.debug('[AframeScenePreview] after camera apply frame', {
          requested: { camPos, camRot, fov },
          camera: getCameraDebugState(camEl),
        })
      })
    }
  }, [camPos, camRot, fov, debug, resolvedCameraPosition, resolvedCameraRotation])

  if (!src) {
    return (
      <div
        className={`bg-muted text-muted-foreground flex items-center justify-center rounded border text-sm ${className ?? ''}`}
        style={{ height }}
      >
        Khong co anh 360 do
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border bg-[#071b2b] ${className ?? ''}`}
    >
      <div ref={containerRef} style={{ width: '100%', height }} />
      <div className="pointer-events-none absolute right-3 bottom-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ background: 'rgba(8, 47, 73, 0.78)' }}
        >
          Keo de xoay 360
        </span>
      </div>
    </div>
  )
}
