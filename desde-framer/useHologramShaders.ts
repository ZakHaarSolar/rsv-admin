// useHologramShaders.ts
// Lightweight hologram shader (scanlines + fresnel + flicker + glitch).
// Also exposes a tiny helper to build orbiting particle materials.

import * as THREE from "three"

export type HologramUniforms = {
    uTime: { value: number }
    uGlow: { value: number } // overall glow
    uScanlineDensity: { value: number } // scanline density
    uBaseColor: { value: THREE.Color } // base hologram color
    uPulseColor: { value: THREE.Color } // dynamic pulse color
    uPulse: { value: number } // 0..1 pulse blend
    uGlitch: { value: number } // 0..1 glitch
    uFresnelPower: { value: number } // fresnel exponent
    uNoiseAmp: { value: number } // noise amount
}

export function getHologramShader(
    baseColor: string | number = "#4AA8FF",
    fresnelPower = 1.75
) {
    const uniforms: HologramUniforms = {
        uTime: { value: 0 },
        uGlow: { value: 1 },
        uScanlineDensity: { value: 1 },
        uBaseColor: { value: new THREE.Color(baseColor as any) },
        uPulseColor: { value: new THREE.Color("#ffffff") },
        uPulse: { value: 0 },
        uGlitch: { value: 0 },
        uFresnelPower: { value: fresnelPower },
        uNoiseAmp: { value: 0.15 },
    }

    // Simple hash-based noise
    const snoise = /* glsl */ `
  float hash(float n){ return fract(sin(n)*43758.5453123); }
  float noise3D(vec3 x){
    return fract(sin(dot(x, vec3(12.9898,78.233, 37.719)))*43758.5453);
  }
  `

    const vertexShader = /* glsl */ `
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uGlitch;
    uniform float uNoiseAmp;
    ${snoise}
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      // Subtle vertex displacement (glitch/noise)
      float n = noise3D(normalize(pos) * 2.0 + uTime*1.5);
      pos += normal * (n - 0.5) * uNoiseAmp * (0.4 + uGlitch*2.0);
      // Occasional slicing displacement when glitching
      if(uGlitch > 0.01){
        float slice = step(0.5, fract((position.y*0.5 + uTime*8.0)));
        pos.x += (slice*2.0 - 1.0) * 0.006 * uGlitch;
      }
      vec4 wpos = modelMatrix * vec4(pos, 1.0);
      vWorldPos = wpos.xyz;
      gl_Position = projectionMatrix * viewMatrix * wpos;
    }
  `

    const fragmentShader = /* glsl */ `
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uGlow;
    uniform float uScanlineDensity;
    uniform vec3 uBaseColor;
    uniform vec3 uPulseColor;
    uniform float uPulse;
    uniform float uGlitch;
    uniform float uFresnelPower;
    ${snoise}

    void main() {
      // Fresnel rim
      vec3 V = normalize(-vWorldPos);
      float fres = pow(1.0 - max(dot(normalize(vNormal), V), 0.0), uFresnelPower);

      // Scanlines & voxel-ish feel
      float lines = sin((vWorldPos.y + vWorldPos.x*0.2) * 100.0 * uScanlineDensity);
      float scan = smoothstep(0.0, 1.0, 0.5 + 0.5*lines);

      // Flicker
      float flick = 0.85 + 0.15 * sin(uTime*40.0 + vWorldPos.y*5.0);

      // Glitch mask (temporal)
      float gmask = step(0.7, fract(sin(dot(vWorldPos, vec3(12.3,77.1,13.7)) + uTime*12.0) * 43758.5));

      vec3 base = mix(uBaseColor, uPulseColor, uPulse);
      vec3 col = base * (0.35 + 0.65*fres) * (0.7 + 0.3*scan) * flick;

      // Add "point cloud" speckles
      float speck = step(0.985, noise3D(vWorldPos*35.0 + uTime*1.2));
      col += speck * base * 1.1;

      // Glitch overlay
      col += gmask * uGlitch * base * 0.6;

      float alpha = 0.75 * (0.5 + 0.5*fres);
      gl_FragColor = vec4(col * (uGlow), alpha);
    }
  `

    const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    })

    return { material, uniforms }
}

// Basic star/point particle material (additive)
export function makeParticleMaterial(color: string | number, size = 2) {
    const mat = new THREE.PointsMaterial({
        color: new THREE.Color(color as any),
        size,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })
    return mat
}
