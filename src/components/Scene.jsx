import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const backgroundVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const backgroundFragment = `
precision highp float;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uScroll;
uniform vec3 uBase;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = vUv * aspect;
  float t = uTime * 0.055;
  float scroll = uScroll;

  float n1 = fbm(p * 1.35 + vec2(t * 0.7, -scroll * 1.6));
  float n2 = fbm(p * 2.1 + vec2(-t * 0.9, scroll * 1.1) + n1 * 0.65);
  float ribbon = smoothstep(0.05, 1.1, n2 + n1 * 0.35);

  vec3 color = uBase;
  color += uColorA * ribbon * (0.28 + 0.22 * scroll);
  color += uColorB * pow(max(n2, 0.0), 2.4) * 0.32;
  color += uColorA * pow(max(n1, 0.0), 3.0) * 0.12;

  vec2 screen = gl_FragCoord.xy / uResolution;
  vec2 sm = screen - uMouse;
  sm.x *= aspect.x;
  float glow = smoothstep(0.75, 0.0, length(sm));
  color += (uColorA * 0.55 + uColorB * 0.35) * glow * 0.16;

  float vig = smoothstep(1.25, 0.35, length((screen - 0.5) * aspect) * 1.15);
  color *= 0.35 + 0.65 * vig;

  float dither = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 220.0;
  color += dither;

  gl_FragColor = vec4(color, 1.0);
}
`

const particleVertex = `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.22 + aSeed * 6.2831) * 0.4;
  p.x += cos(uTime * 0.16 + aSeed * 6.2831) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float size = 1.0 + fract(aSeed * 7.31) * 2.0;
  gl_PointSize = size * uPixelRatio * (16.0 / max(0.001, -mv.z));
  vAlpha = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * (0.5 + fract(aSeed * 3.7)) + aSeed * 24.0));
  gl_Position = projectionMatrix * mv;
}
`

const particleFragment = `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.08, d) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}
`

function Background({ mouseRef, scrollRef, animated }) {
  const mesh = useRef(null)
  const smoothMouse = useRef(new THREE.Vector2(0.5, 0.5))
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uScroll: { value: 0 },
      uBase: { value: new THREE.Color('#04050b') },
      uColorA: { value: new THREE.Color('#38bdf8') },
      uColorB: { value: new THREE.Color('#2563eb') },
    }),
    []
  )
  const paletteTargets = useMemo(
    () => ({
      a: new THREE.Color('#38bdf8'),
      b: new THREE.Color('#2563eb'),
      goldA: new THREE.Color('#ffd60a'),
      goldB: new THREE.Color('#ff7a00'),
    }),
    []
  )

  useFrame((state, delta) => {
    const konami = document.body.classList.contains('konami')
    const blend = 1 - Math.exp(-3 * delta)
    uniforms.uColorA.value.lerp(konami ? paletteTargets.goldA : paletteTargets.a, blend)
    uniforms.uColorB.value.lerp(konami ? paletteTargets.goldB : paletteTargets.b, blend)

    const mouse = mouseRef.current
    smoothMouse.current.x = THREE.MathUtils.damp(smoothMouse.current.x, mouse.x * 0.5 + 0.5, 3, delta)
    smoothMouse.current.y = THREE.MathUtils.damp(smoothMouse.current.y, mouse.y * 0.5 + 0.5, 3, delta)

    if (animated) uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uMouse.value.copy(smoothMouse.current)
    uniforms.uResolution.value.set(state.gl.drawingBufferWidth, state.gl.drawingBufferHeight)
    uniforms.uScroll.value = THREE.MathUtils.damp(uniforms.uScroll.value, scrollRef.current, 4, delta)

    if (mesh.current) {
      mesh.current.position.x = state.camera.position.x
      mesh.current.position.y = state.camera.position.y
      mesh.current.scale.set(state.viewport.width * 1.5, state.viewport.height * 1.5, 1)
    }
  })

  return (
    <mesh ref={mesh} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={backgroundVertex}
        fragmentShader={backgroundFragment}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}

function Particles({ mouseRef, count = 1600 }) {
  const points = useRef(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color('#9adcff') },
    }),
    []
  )

  const [positions, seeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18
      pos[i * 3 + 2] = -2 - Math.random() * 7
      seed[i] = Math.random()
    }
    return [pos, seed]
  }, [count])

  useFrame((state, delta) => {
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uPixelRatio.value = state.gl.getPixelRatio()
    const mouse = mouseRef.current
    if (points.current) {
      points.current.rotation.y += delta * 0.012
      points.current.rotation.x = THREE.MathUtils.damp(points.current.rotation.x, mouse.y * 0.06, 2, delta)
      points.current.rotation.z = THREE.MathUtils.damp(points.current.rotation.z, mouse.x * 0.04, 2, delta)
    }
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function Wire({ position, scale = 1, color, opacity, speed = 1, mouseRef }) {
  const mesh = useRef(null)
  const base = useMemo(() => new THREE.Vector3(...position), [position])

  useFrame((state, delta) => {
    const mesh3d = mesh.current
    if (!mesh3d) return
    const mouse = mouseRef.current
    mesh3d.rotation.x += delta * 0.06 * speed
    mesh3d.rotation.y += delta * 0.09 * speed
    mesh3d.position.x = THREE.MathUtils.damp(mesh3d.position.x, base.x + mouse.x * 0.5, 1.6, delta)
    mesh3d.position.y = THREE.MathUtils.damp(mesh3d.position.y, base.y + mouse.y * 0.3, 1.6, delta)
  })

  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function Rig({ mouseRef, scrollRef }) {
  const { camera } = useThree()

  useFrame((state, delta) => {
    const mouse = mouseRef.current
    const scroll = scrollRef.current
    const targetY = -scroll * 3.4
    const targetZ = 6 - scroll * 1.7

    camera.position.x = THREE.MathUtils.damp(camera.position.x, mouse.x * 0.4, 2.2, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY + mouse.y * 0.28, 2.2, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.2, delta)
    camera.lookAt(0, targetY * 0.45, -2)
    camera.rotateZ(mouse.x * 0.015)
  })

  return null
}

export default function Scene({ ready }) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const scrollRef = useRef(0)
  const reduce = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    let maxScroll = 1
    const measure = () => {
      maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    }
    const onScroll = () => {
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / maxScroll))
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div className={`scene${ready ? ' is-ready' : ''}`} aria-hidden="true">
      <Canvas
        dpr={[1, reduce ? 1 : 1.75]}
        camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={() => {
          window.__stardustSceneReady = true
          window.dispatchEvent(new Event('stardust:scene-ready'))
        }}
      >
        <color attach="background" args={['#04050b']} />
        <Background mouseRef={mouseRef} scrollRef={scrollRef} animated={!reduce} />
        {!reduce && <Particles mouseRef={mouseRef} />}
        {!reduce && (
          <Wire position={[4.6, 1.4, -4]} scale={2.4} color="#7dd3fc" opacity={0.12} speed={1} mouseRef={mouseRef} />
        )}
        {!reduce && (
          <Wire position={[-5.2, -6, -5]} scale={1.5} color="#93c5fd" opacity={0.14} speed={1.4} mouseRef={mouseRef} />
        )}
        <Rig mouseRef={mouseRef} scrollRef={scrollRef} />
      </Canvas>
    </div>
  )
}
