"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls, Sky } from "@react-three/drei"
import * as THREE from "three"

export default function ArcheryGame() {
  const [isLocked, setIsLocked] = useState(false)

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 2, 5] }}>
        <Game setIsLocked={setIsLocked} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 border-2 border-white rounded-full opacity-70">
            <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>

        {/* Instructions */}
        {!isLocked && (
          <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded">
            <p className="text-sm">Click to lock cursor and start playing</p>
            <p className="text-xs mt-2">Left Click: Shoot Arrow</p>
            <p className="text-xs">Mouse: Aim</p>
            <p className="text-xs">WASD: Move</p>
            <p className="text-xs">Spacebar: Jump</p>
            <p className="text-xs mt-2">Shoot the bomb crates to make them explode!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Game({ setIsLocked }: { setIsLocked: (locked: boolean) => void }) {
  const [arrows, setArrows] = useState<any[]>([])
  const [bowDrawn, setBowDrawn] = useState(false)
  const [bombs, setBombs] = useState<any[]>([])
  const [explosions, setExplosions] = useState<any[]>([])
  const controlsRef = useRef<any>()

  // Initialize bombs
  useEffect(() => {
    const initialBombs = [
      { id: 1, position: [8, 1.5, -10], active: true },
      { id: 2, position: [-6, 1.5, -8], active: true },
      { id: 3, position: [12, 1.5, -15], active: true },
      { id: 4, position: [-10, 1.5, -12], active: true },
      { id: 5, position: [0, 1.5, -20], active: true },
    ]
    setBombs(initialBombs)
  }, [])

  const handleShoot = () => {
    if (!controlsRef.current) return

    const camera = controlsRef.current.getObject()
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)

    // Adjust spawn position for crossbow - spawn from front of crossbow
    const crossbowOffset = new THREE.Vector3(0.4, -0.1, -0.3)
    crossbowOffset.applyQuaternion(camera.quaternion)
    const frontOffset = direction.clone().multiplyScalar(0.7) // Front of crossbow
    const startPosition = camera.position.clone().add(crossbowOffset).add(frontOffset)

    const newArrow = {
      id: Date.now(),
      position: startPosition,
      velocity: direction.multiplyScalar(30),
      trail: [startPosition.clone()],
    }

    setArrows((prev) => [...prev, newArrow])
    setBowDrawn(true)
    setTimeout(() => setBowDrawn(false), 200)
  }

  // Check for arrow-bomb collisions
  useEffect(() => {
    const checkCollisions = () => {
      arrows.forEach((arrow) => {
        bombs.forEach((bomb) => {
          if (bomb.active) {
            const distance = new THREE.Vector3(...bomb.position).distanceTo(arrow.position)

            if (distance < 1.2) {
              // Collision threshold for crate
              // Create explosion
              setExplosions((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  position: bomb.position,
                  createdAt: Date.now(),
                },
              ])

              // Deactivate bomb
              setBombs((prev) => prev.map((b) => (b.id === bomb.id ? { ...b, active: false } : b)))

              // Remove arrow
              setArrows((prev) => prev.filter((a) => a.id !== arrow.id))
            }
          }
        })
      })
    }

    checkCollisions()
  }, [arrows, bombs])

  // Clean up old explosions
  useEffect(() => {
    const explosionDuration = 2000 // 2 seconds
    const interval = setInterval(() => {
      const now = Date.now()
      setExplosions((prev) => prev.filter((explosion) => now - explosion.createdAt < explosionDuration))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = () => handleShoot()
    const handleLock = () => setIsLocked(true)
    const handleUnlock = () => setIsLocked(false)

    document.addEventListener("click", handleClick)
    document.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement) {
        handleLock()
      } else {
        handleUnlock()
      }
    })

    return () => {
      document.removeEventListener("click", handleClick)
      document.removeEventListener("pointerlockchange", handleLock)
    }
  }, [setIsLocked])

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <Sky sunPosition={[100, 20, 100]} />

      <Player />
      <Crossbow drawn={bowDrawn} />
      <MedievalEnvironment />

      {/* Render bombs */}
      {bombs.map((bomb) => bomb.active && <BombTarget key={bomb.id} position={bomb.position} />)}

      {/* Render explosions */}
      {explosions.map((explosion) => (
        <Explosion key={explosion.id} position={explosion.position} />
      ))}

      {arrows.map((arrow) => (
        <Arrow
          key={arrow.id}
          arrow={arrow}
          onUpdate={(updatedArrow) => {
            setArrows((prev) => prev.map((a) => (a.id === arrow.id ? updatedArrow : a)))
          }}
          onRemove={() => {
            setArrows((prev) => prev.filter((a) => a.id !== arrow.id))
          }}
        />
      ))}
    </>
  )
}

function BombTarget({ position }: { position: number[] }) {
  return (
    <group position={position as [number, number, number]}>
      {/* Wooden Crate */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1, 1.2]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>

      {/* Crate reinforcement strips */}
      <mesh position={[0, 0, 0.61]} castShadow>
        <boxGeometry args={[1.22, 1.02, 0.05]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, -0.61]} castShadow>
        <boxGeometry args={[1.22, 1.02, 0.05]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      <mesh position={[0.61, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 1.02, 1.22]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      <mesh position={[-0.61, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 1.02, 1.22]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>

      {/* Bomb drawings on each side of the crate */}

      {/* Front side bomb drawing */}
      <group position={[0, -0.2, 0.64]}>
        {/* Bomb circle */}
        <mesh>
          <circleGeometry args={[0.25, 16]} />
          <meshStandardMaterial color="#000080" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb highlight */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#0000FF" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb fuse */}
        <mesh position={[0, 0.2, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Fuse spark */}
        <mesh position={[0, 0.28, 0.003]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Back side bomb drawing */}
      <group position={[0, -0.2, -0.64]} rotation={[0, Math.PI, 0]}>
        {/* Bomb circle */}
        <mesh>
          <circleGeometry args={[0.25, 16]} />
          <meshStandardMaterial color="#000080" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb highlight */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#0000FF" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb fuse */}
        <mesh position={[0, 0.2, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Fuse spark */}
        <mesh position={[0, 0.28, 0.003]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Left side bomb drawing */}
      <group position={[-0.64, -0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Bomb circle */}
        <mesh>
          <circleGeometry args={[0.25, 16]} />
          <meshStandardMaterial color="#000080" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb highlight */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#0000FF" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb fuse */}
        <mesh position={[0, 0.2, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Fuse spark */}
        <mesh position={[0, 0.28, 0.003]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Right side bomb drawing */}
      <group position={[0.64, -0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Bomb circle */}
        <mesh>
          <circleGeometry args={[0.25, 16]} />
          <meshStandardMaterial color="#000080" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb highlight */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.2, 16]} />
          <meshStandardMaterial color="#0000FF" side={THREE.DoubleSide} />
        </mesh>
        {/* Bomb fuse */}
        <mesh position={[0, 0.2, 0.002]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Fuse spark */}
        <mesh position={[0, 0.28, 0.003]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  )
}

function Explosion({ position }: { position: number[] }) {
  const explosionRef = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(0.1)
  const [opacity, setOpacity] = useState(1)

  // Explosion animation
  useFrame((state, delta) => {
    if (explosionRef.current) {
      // Grow and fade out
      setScale((prev) => Math.min(prev + delta * 5, 4))
      setOpacity((prev) => Math.max(prev - delta * 0.8, 0))

      explosionRef.current.scale.set(scale, scale, scale)

      // Rotate for dynamic effect
      explosionRef.current.rotation.y += delta * 2
    }
  })

  return (
    <group position={position as [number, number, number]}>
      {/* Explosion light */}
      <pointLight intensity={5} distance={10} color="#FF4500" decay={2} />

      {/* Explosion core */}
      <group ref={explosionRef}>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color="#FF4500"
            emissive="#FF4500"
            emissiveIntensity={2}
            transparent={true}
            opacity={opacity}
          />
        </mesh>

        {/* Outer explosion */}
        <mesh>
          <sphereGeometry args={[1.5, 8, 8]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={1.5}
            transparent={true}
            opacity={opacity * 0.7}
          />
        </mesh>

        {/* Explosion particles */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.cos(angle) * 1.2
          const z = Math.sin(angle) * 1.2
          const y = (Math.random() - 0.5) * 2

          return (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.2 + Math.random() * 0.3, 4, 4]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#FF4500" : "#FFD700"}
                emissive={i % 2 === 0 ? "#FF4500" : "#FFD700"}
                emissiveIntensity={1.5}
                transparent={true}
                opacity={opacity}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

function Player() {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const keys = useRef<Record<string, boolean>>({})
  const isJumping = useRef(false)
  const jumpVelocity = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    const speed = 5
    const jumpForce = 8
    const gravity = -20

    direction.current.set(0, 0, 0)

    // Movement
    if (keys.current["KeyW"]) direction.current.z -= 1
    if (keys.current["KeyS"]) direction.current.z += 1
    if (keys.current["KeyA"]) direction.current.x -= 1
    if (keys.current["KeyD"]) direction.current.x += 1

    direction.current.normalize().multiplyScalar(speed * delta)
    direction.current.applyEuler(camera.rotation)
    direction.current.y = 0

    camera.position.add(direction.current)

    // Jumping
    if (keys.current["Space"] && !isJumping.current && camera.position.y <= 2.1) {
      isJumping.current = true
      jumpVelocity.current = jumpForce
    }

    // Apply jump physics
    if (isJumping.current) {
      camera.position.y += jumpVelocity.current * delta
      jumpVelocity.current += gravity * delta

      // Land
      if (camera.position.y <= 2) {
        camera.position.y = 2
        isJumping.current = false
        jumpVelocity.current = 0
      }
    } else {
      // Keep camera above ground when not jumping
      if (camera.position.y < 2) {
        camera.position.y = 2
      }
    }
  })

  return null
}

function Crossbow({ drawn }: { drawn: boolean }) {
  const { camera } = useThree()
  const crossbowRef = useRef<THREE.Group>(null)
  const recoilRef = useRef(0)

  useFrame((state, delta) => {
    if (crossbowRef.current) {
      // Position crossbow horizontally at chest level, moved closer for better visibility
      const offset = new THREE.Vector3(0.4, -0.1, -0.15)
      offset.applyQuaternion(camera.quaternion)

      // Add recoil effect
      if (drawn) {
        recoilRef.current = Math.min(recoilRef.current + delta * 10, 0.1)
      } else {
        recoilRef.current = Math.max(recoilRef.current - delta * 8, 0)
      }

      // Apply recoil offset
      const recoilOffset = new THREE.Vector3(0, 0, recoilRef.current)
      recoilOffset.applyQuaternion(camera.quaternion)

      crossbowRef.current.position.copy(camera.position).add(offset).add(recoilOffset)
      crossbowRef.current.rotation.copy(camera.rotation)

      // Increased downward angle for better visibility
      crossbowRef.current.rotation.x += 0.1
    }
  })

  return (
    <group ref={crossbowRef}>
      {/* Main wooden stock - simplified */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.08, 0.9]} />
        <meshStandardMaterial color="#4A3728" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Bow Center Mount - connects limbs to stock at the FRONT */}
      <mesh position={[0, 0.04, 0.35]}>
        <boxGeometry args={[0.15, 0.08, 0.1]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* LEFT CROSSBOW LIMB - POSITIONED AT FRONT */}
      <mesh position={[-0.2, 0.04, 0.35]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#654321" roughness={0.6} />
      </mesh>

      {/* RIGHT CROSSBOW LIMB - POSITIONED AT FRONT */}
      <mesh position={[0.2, 0.04, 0.35]}>
        <boxGeometry args={[0.4, 0.08, 0.05]} />
        <meshStandardMaterial color="#654321" roughness={0.6} />
      </mesh>

      {/* Limb Connection Reinforcements */}
      <mesh position={[-0.1, 0.04, 0.35]}>
        <boxGeometry args={[0.03, 0.06, 0.04]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.1, 0.04, 0.35]}>
        <boxGeometry args={[0.03, 0.06, 0.04]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Bowstring - PROPER STRING AT FRONT connecting limb tips */}
      <mesh position={[0, 0.04, drawn ? 0.32 : 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.4]} />
        <meshStandardMaterial color="#E6D7C3" />
      </mesh>

      {/* String attachment points at limb tips */}
      <mesh position={[-0.2, 0.04, 0.35]}>
        <cylinderGeometry args={[0.005, 0.005, 0.01]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.2, 0.04, 0.35]}>
        <cylinderGeometry args={[0.005, 0.005, 0.01]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Trigger mechanism - simplified */}
      <mesh position={[0, -0.06, 0.05]}>
        <boxGeometry args={[0.02, 0.03, 0.01]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Trigger guard - simplified */}
      <mesh position={[0, -0.04, 0.05]}>
        <torusGeometry args={[0.035, 0.006, 8, 16]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Crossbow butt/shoulder rest - simplified */}
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[0.14, 0.1, 0.12]} />
        <meshStandardMaterial color="#4A3728" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Arrow({ arrow, onUpdate, onRemove }: { arrow: any; onUpdate: (arrow: any) => void; onRemove: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const gravity = -15

  useFrame((state, delta) => {
    // Create new arrow state (immutable updates)
    const newVelocity = arrow.velocity.clone()
    newVelocity.y += gravity * delta

    const newPosition = arrow.position.clone()
    newPosition.add(newVelocity.clone().multiplyScalar(delta))

    // Update trail (limit to 15 points)
    const newTrail = [...arrow.trail, newPosition.clone()]
    if (newTrail.length > 15) {
      newTrail.shift()
    }

    // Update arrow group position and rotation
    if (groupRef.current && newVelocity.length() > 0) {
      groupRef.current.position.copy(newPosition)

      // Proper rotation calculation to prevent fragmenting
      const direction = newVelocity.clone().normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const quaternion = new THREE.Quaternion()

      // Create rotation matrix from direction
      const matrix = new THREE.Matrix4()
      matrix.lookAt(new THREE.Vector3(0, 0, 0), direction, up)
      quaternion.setFromRotationMatrix(matrix)

      groupRef.current.quaternion.copy(quaternion)
    }

    // Remove if too far or hit ground
    if (newPosition.y < 0 || newPosition.length() > 150) {
      onRemove()
      return
    }

    // Update with new immutable state
    onUpdate({
      ...arrow,
      position: newPosition,
      velocity: newVelocity,
      trail: newTrail,
    })
  })

  return (
    <group ref={groupRef}>
      {/* Arrow Shaft - properly oriented along Z-axis */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.75]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Arrow Head - at front, properly aligned */}
      <mesh position={[0, 0, -0.375]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.025, 0.1]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Fletching - at back, properly positioned */}
      <mesh position={[0, 0, 0.3125]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.0375, 0.00125, 0.125]} />
        <meshStandardMaterial color="#DC143C" />
      </mesh>
      <mesh position={[0, 0, 0.3125]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.0375, 0.00125, 0.125]} />
        <meshStandardMaterial color="#DC143C" />
      </mesh>
      <mesh position={[0, 0, 0.3125]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.00125, 0.0375, 0.125]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* Nock (arrow notch) */}
      <mesh position={[0, 0, 0.375]}>
        <cylinderGeometry args={[0.0125, 0.01, 0.025]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
    </group>
  )
}

function MedievalEnvironment() {
  return (
    <>
      <Ground />
      <Forest />
      <Castle />
    </>
  )
}

function Ground() {
  const groundMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#228B22",
      roughness: 0.8,
      metalness: 0.1,
    })
    return material
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <primitive object={groundMaterial} attach="material" />
    </mesh>
  )
}

function Forest() {
  const trees = useMemo(() => {
    const treePositions: [number, number, number][] = []
    // Increased number of trees from 40 to 80
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2
      const radius = 15 + Math.random() * 40 // Increased radius range
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 15
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 15

      // Ensure trees don't spawn too close to player or bomb targets
      if (Math.abs(x) > 6 && Math.abs(z) > 6) {
        treePositions.push([x, 0, z])
      }
    }
    return treePositions
  }, [])

  return (
    <>
      {trees.map((position, index) => (
        <Tree key={index} position={position} />
      ))}
    </>
  )
}

function Tree({ position }: { position: [number, number, number] }) {
  // Use useMemo to ensure tree dimensions are calculated once and remain stable
  const treeData = useMemo(() => {
    const height = 4 + Math.random() * 4 // 4-8 units height
    const trunkRadius = 0.15 + Math.random() * 0.1
    const leavesRadius = height * 0.25 // Proportional to height

    return {
      height,
      trunkRadius,
      leavesRadius,
    }
  }, []) // Empty dependency array ensures this only runs once

  return (
    <group position={position}>
      {/* Trunk - proper proportions */}
      <mesh position={[0, treeData.height / 2, 0]} castShadow>
        <cylinderGeometry args={[treeData.trunkRadius * 0.8, treeData.trunkRadius, treeData.height]} />
        <meshStandardMaterial color="#654321" roughness={0.9} />
      </mesh>

      {/* Leaves - proportional to tree height */}
      <mesh position={[0, treeData.height * 0.85, 0]} castShadow>
        <sphereGeometry args={[treeData.leavesRadius]} />
        <meshStandardMaterial color="#228B22" roughness={0.7} />
      </mesh>

      {/* Additional leaf layer for fuller look */}
      <mesh position={[0, treeData.height * 0.7, 0]} castShadow>
        <sphereGeometry args={[treeData.leavesRadius * 0.8]} />
        <meshStandardMaterial color="#32CD32" roughness={0.7} />
      </mesh>
    </group>
  )
}

function Castle() {
  return (
    <group position={[0, 0, -30]}>
      {/* Main Tower */}
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[3, 3, 10]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>

      {/* Tower Top */}
      <mesh position={[0, 11, 0]} castShadow>
        <coneGeometry args={[3.5, 3]} />
        <meshStandardMaterial color="#8B0000" roughness={0.7} />
      </mesh>

      {/* Side Towers */}
      {[-6, 6].map((x, index) => (
        <group key={index} position={[x, 0, 0]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 6]} />
            <meshStandardMaterial color="#696969" roughness={0.9} />
          </mesh>
          <mesh position={[0, 7, 0]} castShadow>
            <coneGeometry args={[2.5, 2]} />
            <meshStandardMaterial color="#8B0000" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Wall */}
      <mesh position={[0, 2, 3]} castShadow>
        <boxGeometry args={[14, 4, 1]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
    </group>
  )
}