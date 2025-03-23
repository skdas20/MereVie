import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './FetalVisualization.css';

interface FetalVisualizationProps {
  gestationalAge: number;
}

const FetalVisualization: React.FC<FetalVisualizationProps> = ({ gestationalAge }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  
  // Store scene, camera, and renderer in refs to persist between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const breathingRef = useRef<number>(0);
  const heartbeatRef = useRef<number>(0);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a14); // Even darker blue for more realistic amniotic fluid
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Create renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Use compatible THREE.js properties
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;
    
    // Create a more realistic lighting setup for womb-like environment
    // Main ambient light (soft reddish glow)
    const ambientLight = new THREE.AmbientLight(0xff9999, 0.4);
    scene.add(ambientLight);
    
    // Primary light source (warm light from above)
    const mainLight = new THREE.DirectionalLight(0xffcccb, 0.8);
    mainLight.position.set(0, 3, 2);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);
    
    // Rim light to highlight contours (bluish)
    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.4);
    rimLight.position.set(-2, 0, -3);
    scene.add(rimLight);
    
    // Fill light for softer shadows (pinkish)
    const fillLight = new THREE.DirectionalLight(0xffcccc, 0.3);
    fillLight.position.set(2, -1, 1);
    scene.add(fillLight);
    
    // Create a translucent pink glass sphere to represent amniotic sac
    const sphereGeometry = new THREE.SphereGeometry(2.5, 64, 64);
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffa0a0,
      metalness: 0,
      roughness: 0.1,
      transmission: 0.95, // More transparent
      thickness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      ior: 1.33, // Index of refraction (water-like)
      envMapIntensity: 1,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide // Render both inside and outside
    });
    
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
    sphereRef.current = sphere;
    
    // Add floating particles to simulate amniotic fluid with more realistic movement
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);
    const velocityArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      // Create a sphere of particles
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const radius = 2.3 * Math.random();
      
      posArray[i * 3] = radius * Math.sin(angle2) * Math.cos(angle1);
      posArray[i * 3 + 1] = radius * Math.sin(angle2) * Math.sin(angle1);
      posArray[i * 3 + 2] = radius * Math.cos(angle2);
      
      // Random velocities for fluid-like movement
      velocityArray[i * 3] = (Math.random() - 0.5) * 0.002;
      velocityArray[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Store velocities for animation
    const velocities = velocityArray;
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (model && gestationalAge) {
        // Breathing animation - more subtle and natural
        breathingRef.current += 0.01;
        const breathingScale = 1 + Math.sin(breathingRef.current) * 0.015;
        model.scale.set(breathingScale, breathingScale, breathingScale);
        
        // Heartbeat effect - more pronounced and realistic
        heartbeatRef.current += 0.08;
        if (Math.sin(heartbeatRef.current) > 0.95) {
          // Quick pulse when the sine wave peaks
          model.scale.x = breathingScale * 1.02;
          model.scale.y = breathingScale * 1.02;
        }
        
        // Add subtle rotation to simulate floating in amniotic fluid
        model.rotation.y += 0.0003;
        model.rotation.x += Math.sin(breathingRef.current * 0.2) * 0.0001;
        model.position.y += Math.sin(breathingRef.current * 0.5) * 0.0005;
      }
      
      if (sphereRef.current) {
        // Subtle pulsing of the amniotic sac
        const pulseScale = 1 + Math.sin(breathingRef.current * 0.3) * 0.005;
        sphereRef.current.scale.set(pulseScale, pulseScale, pulseScale);
      }
      
      // Animate amniotic fluid particles
      if (particles) {
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          // Apply velocity
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];
          
          // Boundary check - if particle goes outside the sphere, reverse direction
          const distance = Math.sqrt(
            positions[i] * positions[i] + 
            positions[i + 1] * positions[i + 1] + 
            positions[i + 2] * positions[i + 2]
          );
          
          if (distance > 2.3) {
            velocities[i] *= -1;
            velocities[i + 1] *= -1;
            velocities[i + 2] *= -1;
          }
          
          // Add some random movement
          velocities[i] += (Math.random() - 0.5) * 0.0002;
          velocities[i + 1] += (Math.random() - 0.5) * 0.0002;
          velocities[i + 2] += (Math.random() - 0.5) * 0.0002;
          
          // Dampen velocities to prevent excessive movement
          velocities[i] *= 0.99;
          velocities[i + 1] *= 0.99;
          velocities[i + 2] *= 0.99;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Create or update fetal model based on gestational age
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove existing model if any
    if (model) {
      sceneRef.current.remove(model);
      setModel(null);
    }
    
    setLoading(true);
    
    // Create a new model based on gestational age
    const createFetalModel = () => {
      const fetalGroup = new THREE.Group();
      
      // Calculate size based on gestational age (simplified approximation)
      // Average fetus size: 4 weeks: 0.4cm, 8 weeks: 1.6cm, 12 weeks: 5.4cm, 20 weeks: 25cm, 40 weeks: 50cm
      const sizeMultiplier = Math.min(0.1 + (gestationalAge * gestationalAge) / 150, 1.5);
      
      // Create a more realistic fetal body with organic shape
      // Use a more complex geometry for a more organic shape
      const bodyGeometry = new THREE.SphereGeometry(1, 64, 64);
      // Deform the sphere to make it more organic and less geometric
      const bodyVertices = bodyGeometry.attributes.position;
      for (let i = 0; i < bodyVertices.count; i++) {
        const x = bodyVertices.getX(i);
        const y = bodyVertices.getY(i);
        const z = bodyVertices.getZ(i);
        
        // Apply subtle organic deformations
        const noise = Math.sin(x * 5) * 0.03 + Math.cos(y * 7) * 0.02 + Math.sin(z * 3) * 0.03;
        
        bodyVertices.setX(i, x * (1 + noise));
        bodyVertices.setY(i, y * (1 + noise));
        bodyVertices.setZ(i, z * (1 + noise));
      }
      bodyGeometry.computeVertexNormals();
      bodyGeometry.scale(0.8 * sizeMultiplier, 1 * sizeMultiplier, 0.7 * sizeMultiplier);
      
      // Use more realistic skin-like material with subsurface scattering effect
      const bodyMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffe6e0,  // More realistic pinkish skin tone
        roughness: 0.3,
        metalness: 0.0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        sheen: 0.7,
        sheenColor: 0xffc0b4,
        sheenRoughness: 0.3,
        transmission: 0.3,  // Increased translucency for better subsurface effect
        thickness: 0.7,     // Increased thickness for better subsurface effect
        ior: 1.3,           // Index of refraction for human skin
        emissive: 0xff9999, // Subtle emissive glow to simulate blood under skin
        emissiveIntensity: 0.07,
      });
      
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      fetalGroup.add(body);
      
      // Add subtle veins if gestational age > 16 weeks
      if (gestationalAge > 16) {
        const veinMaterial = new THREE.MeshBasicMaterial({
          color: 0x9999ff,
          opacity: 0.15,
          transparent: true,
        });
        
        // Create more complex vein network
        // Main veins
        const createVein = (points: THREE.Vector3[], radius: number) => {
          const curve = new THREE.CatmullRomCurve3(points);
          const veinGeometry = new THREE.TubeGeometry(curve, 20, radius, 8, false);
          return new THREE.Mesh(veinGeometry, veinMaterial);
        };
        
        // Umbilical vein (central)
        const umbilicalVein = createVein([
          new THREE.Vector3(0, -0.5 * sizeMultiplier, 0),
          new THREE.Vector3(0, -0.3 * sizeMultiplier, 0.1 * sizeMultiplier),
          new THREE.Vector3(0, -0.1 * sizeMultiplier, 0.2 * sizeMultiplier),
          new THREE.Vector3(0, 0.1 * sizeMultiplier, 0.3 * sizeMultiplier),
        ], 0.04 * sizeMultiplier);
        fetalGroup.add(umbilicalVein);
        
        // Branching veins
        const vein1 = createVein([
          new THREE.Vector3(0, 0.1 * sizeMultiplier, 0.3 * sizeMultiplier),
          new THREE.Vector3(0.2 * sizeMultiplier, 0.3 * sizeMultiplier, 0.5 * sizeMultiplier),
          new THREE.Vector3(0.3 * sizeMultiplier, 0.5 * sizeMultiplier, 0.4 * sizeMultiplier),
        ], 0.02 * sizeMultiplier);
        fetalGroup.add(vein1);
        
        const vein2 = createVein([
          new THREE.Vector3(0, 0.1 * sizeMultiplier, 0.3 * sizeMultiplier),
          new THREE.Vector3(-0.2 * sizeMultiplier, 0.3 * sizeMultiplier, 0.5 * sizeMultiplier),
          new THREE.Vector3(-0.3 * sizeMultiplier, 0.5 * sizeMultiplier, 0.4 * sizeMultiplier),
        ], 0.02 * sizeMultiplier);
        fetalGroup.add(vein2);
        
        // Additional smaller veins
        const vein3 = createVein([
          new THREE.Vector3(0.2 * sizeMultiplier, 0.3 * sizeMultiplier, 0.5 * sizeMultiplier),
          new THREE.Vector3(0.4 * sizeMultiplier, 0.2 * sizeMultiplier, 0.4 * sizeMultiplier),
        ], 0.01 * sizeMultiplier);
        fetalGroup.add(vein3);
        
        const vein4 = createVein([
          new THREE.Vector3(-0.2 * sizeMultiplier, 0.3 * sizeMultiplier, 0.5 * sizeMultiplier),
          new THREE.Vector3(-0.4 * sizeMultiplier, 0.2 * sizeMultiplier, 0.4 * sizeMultiplier),
        ], 0.01 * sizeMultiplier);
        fetalGroup.add(vein4);
      }
      
      // Add head if gestational age is > 6 weeks
      if (gestationalAge > 6) {
        const headSize = 0.7 * sizeMultiplier;
        const headGeometry = new THREE.SphereGeometry(headSize, 64, 64);
        
        // Deform the head slightly to make it more organic and realistic
        const headVertices = headGeometry.attributes.position;
        for (let i = 0; i < headVertices.count; i++) {
          const x = headVertices.getX(i);
          const y = headVertices.getY(i);
          const z = headVertices.getZ(i);
          
          // Apply subtle organic deformations
          const noise = Math.sin(x * 4) * 0.02 + Math.cos(y * 6) * 0.02 + Math.sin(z * 5) * 0.02;
          
          // Make the back of the head slightly larger for realism
          const backFactor = z < 0 ? 0.05 : 0;
          
          headVertices.setX(i, x * (1 + noise));
          headVertices.setY(i, y * (1 + noise));
          headVertices.setZ(i, z * (1 + noise + backFactor));
        }
        headGeometry.computeVertexNormals();
        
        const headMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffe0d9,
          roughness: 0.4,
          metalness: 0.0,
          clearcoat: 0.7,
          clearcoatRoughness: 0.3,
          sheen: 0.5,
          sheenColor: 0xffb0a0,
          sheenRoughness: 0.3,
          transmission: 0.25,  // Increased for better translucency
          thickness: 0.5,
          ior: 1.3,
          emissive: 0xff9999,
          emissiveIntensity: 0.1,
        });
        
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1 * sizeMultiplier, 0);
        fetalGroup.add(head);
        
        // Add facial features if gestational age is > 10 weeks with improved detail
        if (gestationalAge > 10) {
          // Eyes - closed in womb with more realistic eyelids
          const eyeSocketGeometry = new THREE.SphereGeometry(headSize * 0.15, 16, 16);
          eyeSocketGeometry.scale(1, 0.7, 0.5);
          const eyeSocketMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffd0c0,
            shininess: 30 
          });
          
          const leftEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
          leftEyeSocket.position.set(headSize * 0.3, 1 * sizeMultiplier, headSize * 0.4);
          leftEyeSocket.rotation.y = Math.PI / 10;
          fetalGroup.add(leftEyeSocket);
          
          const rightEyeSocket = new THREE.Mesh(eyeSocketGeometry, eyeSocketMaterial);
          rightEyeSocket.position.set(-headSize * 0.3, 1 * sizeMultiplier, headSize * 0.4);
          rightEyeSocket.rotation.y = -Math.PI / 10;
          fetalGroup.add(rightEyeSocket);
          
          // Closed eye lids with more detail
          const eyelidGeometry = new THREE.SphereGeometry(headSize * 0.12, 16, 8);
          eyelidGeometry.scale(1, 0.2, 0.8);
          const eyelidMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0xffd0c0,
            roughness: 0.5,
            metalness: 0.0 
          });
          
          const leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
          leftEyelid.position.set(headSize * 0.3, 1 * sizeMultiplier, headSize * 0.5);
          leftEyelid.rotation.x = -Math.PI / 10;
          fetalGroup.add(leftEyelid);
          
          const rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
          rightEyelid.position.set(-headSize * 0.3, 1 * sizeMultiplier, headSize * 0.5);
          rightEyelid.rotation.x = -Math.PI / 10;
          fetalGroup.add(rightEyelid);
          
          // More realistic mouth - small and closed
          const mouthGeometry = new THREE.BoxGeometry(headSize * 0.2, headSize * 0.02, headSize * 0.05);
          const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0xcc8888 });
          const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
          mouth.position.set(0, 1 * sizeMultiplier - headSize * 0.3, headSize * 0.5);
          fetalGroup.add(mouth);
          
          // Add lip detail
          const lipGeometry = new THREE.TorusGeometry(headSize * 0.1, headSize * 0.015, 8, 12, Math.PI);
          const lipMaterial = new THREE.MeshPhongMaterial({ color: 0xdd9999 });
          const lip = new THREE.Mesh(lipGeometry, lipMaterial);
          lip.position.set(0, 1 * sizeMultiplier - headSize * 0.31, headSize * 0.51);
          lip.rotation.x = -Math.PI / 2;
          lip.rotation.z = Math.PI;
          fetalGroup.add(lip);
          
          // More realistic nose
          const noseGeometry = new THREE.SphereGeometry(headSize * 0.06, 16, 16);
          noseGeometry.scale(1, 0.8, 1.2);
          const nose = new THREE.Mesh(noseGeometry, eyeSocketMaterial);
          nose.position.set(0, 1 * sizeMultiplier - headSize * 0.1, headSize * 0.6);
          fetalGroup.add(nose);
          
          // Add nostrils
          const nostrilGeometry = new THREE.SphereGeometry(headSize * 0.02, 8, 8);
          nostrilGeometry.scale(1, 0.5, 0.5);
          const nostrilMaterial = new THREE.MeshBasicMaterial({ color: 0x553333 });
          
          const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
          leftNostril.position.set(headSize * 0.03, 1 * sizeMultiplier - headSize * 0.13, headSize * 0.65);
          fetalGroup.add(leftNostril);
          
          const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
          rightNostril.position.set(-headSize * 0.03, 1 * sizeMultiplier - headSize * 0.13, headSize * 0.65);
          fetalGroup.add(rightNostril);
          
          // Small ears if gestational age > 15 weeks with more detail
          if (gestationalAge > 15) {
            // Main ear shape
            const earGeometry = new THREE.SphereGeometry(headSize * 0.15, 16, 16);
            earGeometry.scale(0.3, 0.8, 0.3);
            
            const leftEar = new THREE.Mesh(earGeometry, eyelidMaterial);
            leftEar.position.set(headSize * 0.7, 1 * sizeMultiplier + headSize * 0.1, 0);
            leftEar.rotation.z = Math.PI / 6;
            fetalGroup.add(leftEar);
            
            const rightEar = new THREE.Mesh(earGeometry, eyelidMaterial);
            rightEar.position.set(-headSize * 0.7, 1 * sizeMultiplier + headSize * 0.1, 0);
            rightEar.rotation.z = -Math.PI / 6;
            fetalGroup.add(rightEar);
            
            // Ear canal
            const earCanalGeometry = new THREE.CylinderGeometry(headSize * 0.03, headSize * 0.03, headSize * 0.1, 8);
            const earCanalMaterial = new THREE.MeshBasicMaterial({ color: 0x553333 });
            
            const leftEarCanal = new THREE.Mesh(earCanalGeometry, earCanalMaterial);
            leftEarCanal.position.set(headSize * 0.75, 1 * sizeMultiplier + headSize * 0.1, 0);
            leftEarCanal.rotation.z = Math.PI / 2;
            leftEarCanal.rotation.x = Math.PI / 6;
            fetalGroup.add(leftEarCanal);
            
            const rightEarCanal = new THREE.Mesh(earCanalGeometry, earCanalMaterial);
            rightEarCanal.position.set(-headSize * 0.75, 1 * sizeMultiplier + headSize * 0.1, 0);
            rightEarCanal.rotation.z = -Math.PI / 2;
            rightEarCanal.rotation.x = Math.PI / 6;
            fetalGroup.add(rightEarCanal);
          }
        }
      }
      
      // Add limbs if gestational age is > 8 weeks
      if (gestationalAge > 8) {
        const limbMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffcccb,
          roughness: 0.9,
          metalness: 0.1,
          clearcoat: 0.2
        });
        
        // Arms - bent and positioned against body as in womb
        if (gestationalAge > 10) {
          // Upper arms
          const upperArmGeometry = new THREE.CylinderGeometry(
            sizeMultiplier * 0.1, 
            sizeMultiplier * 0.1, 
            sizeMultiplier * 0.6, 
            16
          );
          
          const leftUpperArm = new THREE.Mesh(upperArmGeometry, limbMaterial);
          leftUpperArm.rotation.z = Math.PI / 4;
          leftUpperArm.position.set(sizeMultiplier * 0.4, sizeMultiplier * 0.6, 0);
          fetalGroup.add(leftUpperArm);
          
          const rightUpperArm = new THREE.Mesh(upperArmGeometry, limbMaterial);
          rightUpperArm.rotation.z = -Math.PI / 4;
          rightUpperArm.position.set(-sizeMultiplier * 0.4, sizeMultiplier * 0.6, 0);
          fetalGroup.add(rightUpperArm);
          
          // Forearms - bent at elbow as in fetal position
          const forearmGeometry = new THREE.CylinderGeometry(
            sizeMultiplier * 0.09, 
            sizeMultiplier * 0.08, 
            sizeMultiplier * 0.5, 
            16
          );
          
          const leftForearm = new THREE.Mesh(forearmGeometry, limbMaterial);
          leftForearm.rotation.z = -Math.PI / 6;
          leftForearm.rotation.y = Math.PI / 6;
          leftForearm.position.set(sizeMultiplier * 0.7, sizeMultiplier * 0.3, sizeMultiplier * 0.2);
          fetalGroup.add(leftForearm);
          
          const rightForearm = new THREE.Mesh(forearmGeometry, limbMaterial);
          rightForearm.rotation.z = Math.PI / 6;
          rightForearm.rotation.y = -Math.PI / 6;
          rightForearm.position.set(-sizeMultiplier * 0.7, sizeMultiplier * 0.3, sizeMultiplier * 0.2);
          fetalGroup.add(rightForearm);
          
          // Hands - tiny at early stages
          if (gestationalAge > 12) {
            const handGeometry = new THREE.SphereGeometry(sizeMultiplier * 0.1, 16, 16);
            handGeometry.scale(1, 0.8, 0.3);
            
            const leftHand = new THREE.Mesh(handGeometry, limbMaterial);
            leftHand.position.set(sizeMultiplier * 0.9, sizeMultiplier * 0.1, sizeMultiplier * 0.4);
            leftHand.rotation.z = -Math.PI / 4;
            fetalGroup.add(leftHand);
            
            const rightHand = new THREE.Mesh(handGeometry, limbMaterial);
            rightHand.position.set(-sizeMultiplier * 0.9, sizeMultiplier * 0.1, sizeMultiplier * 0.4);
            rightHand.rotation.z = Math.PI / 4;
            fetalGroup.add(rightHand);
          }
        }
        
        // Legs
        const thighGeometry = new THREE.CylinderGeometry(
          sizeMultiplier * 0.15, 
          sizeMultiplier * 0.12, 
          sizeMultiplier * 0.7, 
          16
        );
        
        // Position legs in a fetal position (bent and close to body)
        const leftThigh = new THREE.Mesh(thighGeometry, limbMaterial);
        leftThigh.rotation.z = Math.PI / 12;
        leftThigh.rotation.x = -Math.PI / 6;
        leftThigh.position.set(sizeMultiplier * 0.2, -sizeMultiplier * 0.5, 0);
        fetalGroup.add(leftThigh);
        
        const rightThigh = new THREE.Mesh(thighGeometry, limbMaterial);
        rightThigh.rotation.z = -Math.PI / 12;
        rightThigh.rotation.x = -Math.PI / 6;
        rightThigh.position.set(-sizeMultiplier * 0.2, -sizeMultiplier * 0.5, 0);
        fetalGroup.add(rightThigh);
        
        // Lower legs with calfGeometry
        if (gestationalAge > 12) {
          const calfGeometry = new THREE.CylinderGeometry(
            sizeMultiplier * 0.11, 
            sizeMultiplier * 0.09, 
            sizeMultiplier * 0.6, 
            16
          );
          
          const leftCalf = new THREE.Mesh(calfGeometry, limbMaterial);
          leftCalf.rotation.x = Math.PI / 3;
          leftCalf.position.set(sizeMultiplier * 0.3, -sizeMultiplier * 1, -sizeMultiplier * 0.2);
          fetalGroup.add(leftCalf);
          
          const rightCalf = new THREE.Mesh(calfGeometry, limbMaterial);
          rightCalf.rotation.x = Math.PI / 3;
          rightCalf.position.set(-sizeMultiplier * 0.3, -sizeMultiplier * 1, -sizeMultiplier * 0.2);
          fetalGroup.add(rightCalf);
          
          // Feet
          if (gestationalAge > 14) {
            const footGeometry = new THREE.SphereGeometry(sizeMultiplier * 0.12, 16, 16);
            footGeometry.scale(1, 0.4, 1.5);
            
            const leftFoot = new THREE.Mesh(footGeometry, limbMaterial);
            leftFoot.position.set(sizeMultiplier * 0.35, -sizeMultiplier * 1.25, sizeMultiplier * 0.1);
            leftFoot.rotation.x = -Math.PI / 6;
            fetalGroup.add(leftFoot);
            
            const rightFoot = new THREE.Mesh(footGeometry, limbMaterial);
            rightFoot.position.set(-sizeMultiplier * 0.35, -sizeMultiplier * 1.25, sizeMultiplier * 0.1);
            rightFoot.rotation.x = -Math.PI / 6;
            fetalGroup.add(rightFoot);
          }
        }
      }
      
      // Position fetus in a typical fetal position
      fetalGroup.rotation.x = Math.PI / 6; // Slightly tilted forward
      fetalGroup.position.y = -0.5; // Slightly lower in the sphere
      
      return fetalGroup;
    };
    
    const newModel = createFetalModel();
    sceneRef.current.add(newModel);
    setModel(newModel);
    setLoading(false);
  }, [gestationalAge]);
  
  return (
    <div className="fetal-visualization-container" ref={containerRef}>
      {loading && <div className="fetal-loading">Loading 3D Visualization...</div>}
      <div className="fetal-info-overlay">
        <span className="fetal-week">Week {gestationalAge}</span>
      </div>
    </div>
  );
};

export default FetalVisualization;
