'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { normalizedToWorldPosition } from '@/lib/coordinate-converter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layers, RotateCcw, Eye, HardDrive, MapPin, X } from 'lucide-react';

interface Building3DViewerProps {
  building: any;
  floors: any[];
  devices: any[];
}

export function Building3DViewer({
  building,
  floors,
  devices,
}: Building3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  const [isExploded, setIsExploded] = useState(false);
  const [selected3DDevice, setSelected3DDevice] = useState<any | null>(null);
  const [hovered3DDevice, setHovered3DDevice] = useState<any | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617'); // Slate-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(60, 45, 75);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Don't go below ground

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(40, 60, 40);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 4. Ground Grid Helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Group for floor meshes and device markers
    const floorMeshesGroup = new THREE.Group();
    scene.add(floorMeshesGroup);

    const textureLoader = new THREE.TextureLoader();

    // 5. Render 3D Floors and Asset Markers
    const interactiveObjects: THREE.Object3D[] = [];

    floors.forEach((floor, idx) => {
      const activePlan = floor.plans?.find((p: any) => p.isActive) || floor.plans?.[0];

      // Elevation calculation (Exploded view multiplies vertical spacing)
      const baseElevation = floor.elevation ?? idx * 5.0;
      const actualElevation = isExploded ? baseElevation * 2.2 + 2.0 : baseElevation;

      const floorW = floor.width ?? 50.0;
      const floorD = floor.depth ?? 30.0;

      // Create 3D Floor Plane Mesh
      const geometry = new THREE.PlaneGeometry(floorW, floorD);
      let material: THREE.Material;

      if (activePlan?.fileUrl) {
        const texture = textureLoader.load(activePlan.fileUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          side: THREE.DoubleSide,
          roughness: 0.5,
        });
      }

      const planeMesh = new THREE.Mesh(geometry, material);
      planeMesh.rotation.x = -Math.PI / 2; // Flat horizontal plane
      planeMesh.position.set(0, actualElevation, 0);
      planeMesh.receiveShadow = true;
      floorMeshesGroup.add(planeMesh);

      // Render 3D Device Pin Markers on this floor plane
      const floorDevices = devices.filter(
        (d) => d.floorId === floor.id || d.positions?.some((p: any) => p.floorPlan?.floorId === floor.id)
      );

      floorDevices.forEach((dev) => {
        const pos = dev.positions?.find((p: any) => p.isCurrent) || { positionX: 0.5, positionY: 0.5 };
        const worldPos = normalizedToWorldPosition(
          pos.positionX,
          pos.positionY,
          0.5,
          floorW,
          floorD,
          actualElevation
        );

        // Create 3D Pin Cylinder Mesh
        const pinGeo = new THREE.CylinderGeometry(0.6, 0.1, 2.0, 16);
        const pinMat = new THREE.MeshStandardMaterial({
          color: dev.status === 'ACTIVE' ? 0x0284c7 : 0xeab308, // Cyan active, Amber warning
          roughness: 0.2,
          metalness: 0.8,
        });

        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.set(worldPos.x, worldPos.y + 1.0, worldPos.z);
        pinMesh.castShadow = true;
        pinMesh.userData = { device: dev, floor };

        floorMeshesGroup.add(pinMesh);
        interactiveObjects.push(pinMesh);
      });
    });

    // 6. Raycasting for Hover & Click 3D Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        setHovered3DDevice(hit.userData.device);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHovered3DDevice(null);
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        setSelected3DDevice(hit.userData.device);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 7. Animation Render Loop
    let animFrameId: number;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      controls.update();

      // Slow rotate pins
      interactiveObjects.forEach((obj) => {
        obj.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animFrameId);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [building, floors, devices, isExploded]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-800">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Floating 3D Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl backdrop-blur-md shadow-xl text-xs">
        <Button
          variant={isExploded ? 'default' : 'outline'}
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => setIsExploded(!isExploded)}
        >
          <Layers className="h-4 w-4" />
          {isExploded ? 'ยุบชั้นอาคาร (Collapse View)' : 'แยกชั้น 3D (Exploded View)'}
        </Button>
      </div>

      {/* Hover Info Tooltip */}
      {hovered3DDevice && !selected3DDevice && (
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md text-xs space-y-1 text-white shadow-lg pointer-events-none">
          <div className="font-bold text-primary">{hovered3DDevice.assetCode}</div>
          <div className="font-medium">{hovered3DDevice.deviceName}</div>
          <div className="text-[11px] text-slate-400">ประเภท: {hovered3DDevice.deviceType?.name}</div>
        </div>
      )}

      {/* Selected 3D Device Property Card */}
      {selected3DDevice && (
        <div className="absolute top-4 right-4 z-20 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
              <HardDrive className="h-4 w-4" />
              ตำแหน่ง 3D ครุภัณฑ์
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelected3DDevice(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="font-bold text-sm text-white">{selected3DDevice.deviceName}</div>
            <div className="text-xs font-mono text-primary font-bold">{selected3DDevice.assetCode}</div>
            <div className="text-[11px] text-slate-400">ประเภท: {selected3DDevice.deviceType?.name || '-'}</div>
            <div className="text-[11px] text-slate-400">S/N: {selected3DDevice.serialNumber || '-'}</div>
            <div className="text-[11px] text-slate-400">
              ประจำอยู่อาคาร: {building?.name} • {selected3DDevice.floor?.name || ''}
            </div>
            <Badge variant="default" className="bg-emerald-600 text-[10px] mt-1">
              Status: {selected3DDevice.status}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
