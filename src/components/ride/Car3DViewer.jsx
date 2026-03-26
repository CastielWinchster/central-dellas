import React, { useEffect, useRef, useState } from 'react';
import { Car } from 'lucide-react';

// Mapeamento de cores em português para hex
const COLOR_MAP = {
  'preto': '#1a1a1a',
  'black': '#1a1a1a',
  'branco': '#f0f0f0',
  'white': '#f0f0f0',
  'prata': '#a8a8b0',
  'cinza': '#808080',
  'gray': '#808080',
  'grey': '#808080',
  'vermelho': '#cc2200',
  'red': '#cc2200',
  'azul': '#1a4fa0',
  'blue': '#1a4fa0',
  'verde': '#1a7a2a',
  'green': '#1a7a2a',
  'amarelo': '#d4a000',
  'yellow': '#d4a000',
  'laranja': '#cc5500',
  'orange': '#cc5500',
  'marrom': '#6b3a2a',
  'brown': '#6b3a2a',
  'bege': '#c8b090',
  'beige': '#c8b090',
  'rosa': '#F22998',
  'pink': '#F22998',
  'roxo': '#7a1a9a',
  'purple': '#7a1a9a',
  'dourado': '#c8a020',
  'gold': '#c8a020',
  'champagne': '#d4c080',
};

function resolveColor(colorText) {
  if (!colorText) return '#BF3B79';
  const lower = colorText.toLowerCase().trim();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#BF3B79';
}

// Skeleton loader
function SkeletonLoader() {
  return (
    <div className="w-full h-full bg-[#1a1a1a] rounded-xl animate-pulse flex items-center justify-center">
      <div className="w-16 h-8 bg-[#F22998]/20 rounded" />
    </div>
  );
}

// Fallback com ícone
function CarFallback() {
  return (
    <div className="w-full h-full bg-[#1a1a1a]/60 rounded-xl flex flex-col items-center justify-center gap-2">
      <Car className="w-12 h-12 text-[#F22998]/40" />
      <span className="text-[10px] text-[#F2F2F2]/30">3D indisponível</span>
    </div>
  );
}

export default function Car3DViewer({ color }) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const THREE = await import('three');
        if (cancelled) return;

        const container = mountRef.current;
        if (!container) return;

        const W = container.clientWidth || 200;
        const H = container.clientHeight || 150;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
        camera.position.set(3.2, 2.0, 3.2);
        camera.lookAt(0, 0.3, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 8, 5);
        dirLight.castShadow = true;
        scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0xF22998, 0.4);
        rimLight.position.set(-4, 2, -4);
        scene.add(rimLight);

        // Car color
        const carColor = resolveColor(color);

        // Materials
        const bodyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(carColor),
          metalness: 0.5,
          roughness: 0.35,
        });
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x88ccff,
          transparent: true,
          opacity: 0.45,
          metalness: 0.1,
          roughness: 0.1,
        });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

        // ── BUILD CAR ──
        const carGroup = new THREE.Group();

        // Body (lower)
        const bodyGeo = new THREE.BoxGeometry(2.4, 0.5, 1.1);
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.set(0, 0.55, 0);
        bodyMesh.castShadow = true;
        carGroup.add(bodyMesh);

        // Cabin / roof
        const cabinGeo = new THREE.BoxGeometry(1.5, 0.48, 1.0);
        const cabinMesh = new THREE.Mesh(cabinGeo, bodyMat);
        cabinMesh.position.set(-0.1, 1.02, 0);
        cabinMesh.castShadow = true;
        carGroup.add(cabinMesh);

        // Windshield (front glass)
        const wsFrontGeo = new THREE.PlaneGeometry(0.85, 0.42);
        const wsFront = new THREE.Mesh(wsFrontGeo, glassMat);
        wsFront.position.set(0.66, 1.04, 0);
        wsFront.rotation.y = Math.PI / 2 - 0.45;
        carGroup.add(wsFront);

        // Rear glass
        const wsRearGeo = new THREE.PlaneGeometry(0.85, 0.42);
        const wsRear = new THREE.Mesh(wsRearGeo, glassMat);
        wsRear.position.set(-0.86, 1.04, 0);
        wsRear.rotation.y = -(Math.PI / 2 - 0.45);
        carGroup.add(wsRear);

        // Side windows (left & right)
        [-0.505, 0.505].forEach((z) => {
          const swGeo = new THREE.PlaneGeometry(1.35, 0.34);
          const sw = new THREE.Mesh(swGeo, glassMat);
          sw.position.set(-0.08, 1.04, z);
          sw.rotation.y = z < 0 ? -Math.PI / 2 : Math.PI / 2;
          carGroup.add(sw);
        });

        // Hood detail
        const hoodGeo = new THREE.BoxGeometry(0.7, 0.06, 0.9);
        const hood = new THREE.Mesh(hoodGeo, bodyMat);
        hood.position.set(0.9, 0.82, 0);
        carGroup.add(hood);

        // Bumpers
        const bumpGeo = new THREE.BoxGeometry(0.12, 0.28, 1.0);
        const frontBump = new THREE.Mesh(bumpGeo, darkMat);
        frontBump.position.set(1.26, 0.42, 0);
        carGroup.add(frontBump);
        const rearBump = new THREE.Mesh(bumpGeo, darkMat);
        rearBump.position.set(-1.26, 0.42, 0);
        carGroup.add(rearBump);

        // Headlights
        const hlGeo = new THREE.BoxGeometry(0.06, 0.1, 0.22);
        const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 0.6 });
        [-0.28, 0.28].forEach((z) => {
          const hl = new THREE.Mesh(hlGeo, hlMat);
          hl.position.set(1.24, 0.6, z);
          carGroup.add(hl);
        });

        // Taillights
        const tlMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff1100, emissiveIntensity: 0.5 });
        [-0.28, 0.28].forEach((z) => {
          const tl = new THREE.Mesh(hlGeo, tlMat);
          tl.position.set(-1.24, 0.6, z);
          carGroup.add(tl);
        });

        // Wheels (4 wheels)
        const wheelPositions = [
          [0.85, 0.28, 0.62],
          [0.85, 0.28, -0.62],
          [-0.85, 0.28, 0.62],
          [-0.85, 0.28, -0.62],
        ];
        wheelPositions.forEach(([x, y, z]) => {
          const tireGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 16);
          const tire = new THREE.Mesh(tireGeo, tireMat);
          tire.rotation.z = Math.PI / 2;
          tire.position.set(x, y, z);
          tire.castShadow = true;
          carGroup.add(tire);

          const rimGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.22, 8);
          const rim = new THREE.Mesh(rimGeo, rimMat);
          rim.rotation.z = Math.PI / 2;
          rim.position.set(x, y, z);
          carGroup.add(rim);
        });

        // Ground shadow plane
        const shadowGeo = new THREE.CircleGeometry(1.6, 32);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.01;
        carGroup.add(shadow);

        scene.add(carGroup);

        // Mouse drag rotation
        let isDragging = false;
        let prevX = 0;
        let autoRotateSpeed = 0.005;
        let rotVelocity = 0;

        const onDown = (e) => {
          isDragging = true;
          prevX = e.touches ? e.touches[0].clientX : e.clientX;
        };
        const onUp = () => { isDragging = false; };
        const onMove = (e) => {
          if (!isDragging) return;
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          rotVelocity = (clientX - prevX) * 0.01;
          carGroup.rotation.y += rotVelocity;
          prevX = clientX;
        };

        renderer.domElement.addEventListener('mousedown', onDown);
        renderer.domElement.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
        renderer.domElement.addEventListener('mousemove', onMove);
        renderer.domElement.addEventListener('touchmove', onMove, { passive: true });

        // Animation loop
        const animate = () => {
          animFrameRef.current = requestAnimationFrame(animate);
          if (!isDragging) {
            carGroup.rotation.y += autoRotateSpeed;
            rotVelocity *= 0.92;
          } else {
            carGroup.rotation.y += rotVelocity;
            rotVelocity *= 0.88;
          }
          renderer.render(scene, camera);
        };
        animate();

        if (!cancelled) setStatus('ready');

        // Cleanup stored
        rendererRef.current._cleanup = () => {
          renderer.domElement.removeEventListener('mousedown', onDown);
          renderer.domElement.removeEventListener('touchstart', onDown);
          window.removeEventListener('mouseup', onUp);
          window.removeEventListener('touchend', onUp);
          renderer.domElement.removeEventListener('mousemove', onMove);
          renderer.domElement.removeEventListener('touchmove', onMove);
        };

      } catch (err) {
        console.warn('[Car3DViewer] Erro ao inicializar 3D:', err);
        if (!cancelled) setStatus('error');
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current._cleanup?.();
        rendererRef.current.dispose();
        const canvas = rendererRef.current.domElement;
        canvas?.parentNode?.removeChild(canvas);
        rendererRef.current = null;
      }
    };
  }, [color]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full rounded-xl overflow-hidden relative"
      style={{ minHeight: 150 }}
    >
      {status === 'loading' && (
        <div className="absolute inset-0">
          <SkeletonLoader />
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0">
          <CarFallback />
        </div>
      )}
    </div>
  );
}