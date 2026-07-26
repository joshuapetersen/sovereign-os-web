import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface VolumetricSceneProps {
  intensity: number;
  emotion: 'NEUTRAL' | 'ENGAGED' | 'PROCESSING' | 'CRITICAL';
  opticsMode?: string;
  isVoiceActive?: boolean;
}

const VolumetricScene: React.FC<VolumetricSceneProps> = ({ 
  intensity, 
  emotion, 
  opticsMode = 'CYBER_CYAN',
  isVoiceActive = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true, 
      powerPreference: "high-performance" 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); 
    containerRef.current.appendChild(renderer.domElement);

    // Determine color schemes based on Optics Mode
    let gridColor = 0x0ea5e9;
    let particleColor = 0x22d3ee;

    if (opticsMode === 'THERMAL') {
      gridColor = 0xf43f5e;
      particleColor = 0xfb7185;
    } else if (opticsMode === 'NIGHT_VISION') {
      gridColor = 0x10b981;
      particleColor = 0x34d399;
    } else if (opticsMode === 'MATRIX') {
      gridColor = 0xa855f7;
      particleColor = 0xc084fc;
    }

    // Grid Floor
    const floor = new THREE.GridHelper(400, 80, gridColor, 0x000000);
    floor.position.y = -25;
    (floor.material as THREE.Material).transparent = true;
    (floor.material as THREE.Material).opacity = 0.05;
    scene.add(floor);

    // Grid Ceiling
    const ceiling = new THREE.GridHelper(400, 80, gridColor, 0x000000);
    ceiling.position.y = 25;
    (ceiling.material as THREE.Material).transparent = true;
    (ceiling.material as THREE.Material).opacity = 0.05;
    scene.add(ceiling);

    // Neural Cloud Particles
    const count = 3500;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 220;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.18,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });

    const neuralPoints = new THREE.Points(geom, mat);
    scene.add(neuralPoints);

    // Central Holo Wave Ring
    const ringGeom = new THREE.RingGeometry(12, 12.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: gridColor, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.08 
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    scene.add(ringMesh);

    camera.position.z = 40;

    const handleMouseMove = (event: MouseEvent) => {
      targetMouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);
      mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.03;
      mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.03;

      const time = Date.now() * 0.001;
      const speedMult = isVoiceActive ? 0.0012 : 0.0003;

      neuralPoints.rotation.y += speedMult;
      neuralPoints.rotation.x += speedMult * 0.5;

      ringMesh.rotation.z += 0.005;
      ringMesh.scale.setScalar(1 + Math.sin(time * 2) * (isVoiceActive ? 0.15 : 0.04));

      camera.position.x = mouse.current.x * 15;
      camera.position.y = mouse.current.y * 15;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [intensity, emotion, opticsMode, isVoiceActive]);

  return <div ref={containerRef} className="fixed inset-0 z-[-50] pointer-events-none overflow-hidden" />;
};

export default VolumetricScene;
