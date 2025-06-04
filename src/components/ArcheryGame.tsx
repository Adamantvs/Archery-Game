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
            <p className="text-xs">Hold Shift: Sprint</p>
            <p className="text-xs mt-2">Shoot the bomb crates and enemies!</p>
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
  const [enemies, setEnemies] = useState<any[]>([])
  const [enemyPops, setEnemyPops] = useState<any[]>([])
  const controlsRef = useRef<any>()

  // Initialize bombs
  useEffect(() => {
    const initialBombs = [
      // Original crates
      { id: 1, position: [8, 1.5, -10], active: true },
      { id: 2, position: [-6, 1.5, -8], active: true },
      { id: 3, position: [12, 1.5, -15], active: true },
      { id: 4, position: [-10, 1.5, -12], active: true },
      { id: 5, position: [0, 1.5, -20], active: true },
      // Additional crates closer to enemy areas
      { id: 6, position: [-15, 1.5, -25], active: true },
      { id: 7, position: [15, 1.5, -25], active: true },
      { id: 8, position: [-20, 1.5, -35], active: true },
      { id: 9, position: [20, 1.5, -35], active: true },
      { id: 10, position: [0, 1.5, -40], active: true },
      { id: 11, position: [-25, 1.5, -45], active: true },
      { id: 12, position: [25, 1.5, -45], active: true },
      { id: 13, position: [10, 1.5, -50], active: true },
      { id: 14, position: [-10, 1.5, -50], active: true },
    ]
    setBombs(initialBombs)

    const initialEnemies = [
      { id: 1, position: [-8, 0.5, -25], active: true, targetPosition: [-8, 0.5, -25], moveSpeed: 3 + Math.random() * 2, currentPosition: [-8, 0.5, -25] },
      { id: 2, position: [8, 0.5, -28], active: true, targetPosition: [8, 0.5, -28], moveSpeed: 3 + Math.random() * 2, currentPosition: [8, 0.5, -28] },
      { id: 3, position: [0, 0.5, -35], active: true, targetPosition: [0, 0.5, -35], moveSpeed: 3 + Math.random() * 2, currentPosition: [0, 0.5, -35] },
    ]
    setEnemies(initialEnemies)
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
              const explosionPos = bomb.position
              setExplosions((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  position: explosionPos,
                  createdAt: Date.now(),
                },
              ])

              // Check if any enemies are within explosion radius and kill them
              enemies.forEach((enemy) => {
                if (enemy.active) {
                  const enemyPos = new THREE.Vector3(...(enemy.currentPosition || enemy.position))
                  const explosionVec = new THREE.Vector3(...explosionPos)
                  const explosionDistance = enemyPos.distanceTo(explosionVec)
                  
                  if (explosionDistance < 6.0) { // Explosion damage radius
                    // Create dramatic pop effect at enemy position
                    setEnemyPops((prev) => [
                      ...prev,
                      {
                        id: Date.now() + enemy.id,
                        position: enemy.currentPosition || enemy.position,
                        createdAt: Date.now(),
                      },
                    ])

                    // Deactivate enemy
                    setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))

                    // Respawn enemy after 10 seconds at a random castle position
                    setTimeout(() => {
                      // Find a valid spawn position that doesn't collide with castle
                      let spawnX, spawnZ
                      let validSpawn = false
                      let attempts = 0
                      
                      // Castle collision check function (inline for respawn)
                      const checkSpawnCollision = (x: number, z: number) => {
                        // Main tower collision
                        const mainTowerDistance = Math.sqrt(x * x + (z + 30) * (z + 30))
                        if (mainTowerDistance < 3.5) return true
                        
                        // Side towers collision
                        const leftTowerDistance = Math.sqrt((x + 6) * (x + 6) + (z + 30) * (z + 30))
                        if (leftTowerDistance < 2.5) return true
                        const rightTowerDistance = Math.sqrt((x - 6) * (x - 6) + (z + 30) * (z + 30))
                        if (rightTowerDistance < 2.5) return true
                        
                        // Front wall collision
                        if (x >= -7.5 && x <= 7.5 && z >= -28 && z <= -26) return true
                        
                        return false
                      }
                      
                      while (!validSpawn && attempts < 20) {
                        spawnX = (Math.random() - 0.5) * 80  // Random position around castle (larger area)
                        spawnZ = -30 + (Math.random() - 0.5) * 60
                        
                        if (!checkSpawnCollision(spawnX, spawnZ)) {
                          validSpawn = true
                        }
                        attempts++
                      }
                      
                      // If no valid spawn found, use a safe default position
                      if (!validSpawn) {
                        spawnX = (Math.random() - 0.5) * 20 > 0 ? 15 : -15
                        spawnZ = -45
                      }
                      
                      setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { 
                        ...e, 
                        active: true, 
                        position: [spawnX, 0.5, spawnZ],
                        currentPosition: [spawnX, 0.5, spawnZ],
                        targetPosition: [spawnX, 0.5, spawnZ]
                      } : e)))
                    }, 10000)
                  }
                }
              })

              // Deactivate bomb
              setBombs((prev) => prev.map((b) => (b.id === bomb.id ? { ...b, active: false } : b)))

              // Remove arrow
              setArrows((prev) => prev.filter((a) => a.id !== arrow.id))

              // Regenerate bomb after 15 seconds
              setTimeout(() => {
                setBombs((prev) => prev.map((b) => (b.id === bomb.id ? { ...b, active: true } : b)))
              }, 15000)
            }
          }
        })

        // Check enemy collisions
        enemies.forEach((enemy) => {
          if (enemy.active) {
            // Use the actual current position from the enemy's current state
            const enemyPos = new THREE.Vector3(...(enemy.currentPosition || enemy.position))
            const distance = enemyPos.distanceTo(arrow.position)

            if (distance < 1.0) {
              // Collision threshold for enemy
              // Create dramatic pop effect at actual enemy position
              setEnemyPops((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  position: enemy.currentPosition || enemy.position,
                  createdAt: Date.now(),
                },
              ])

              // Deactivate enemy
              setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))

              // Remove arrow
              setArrows((prev) => prev.filter((a) => a.id !== arrow.id))

              // Respawn enemy after 10 seconds at a random castle position
              setTimeout(() => {
                // Find a valid spawn position that doesn't collide with castle
                let spawnX, spawnZ
                let validSpawn = false
                let attempts = 0
                
                // Castle collision check function (inline for respawn)
                const checkSpawnCollision = (x: number, z: number) => {
                  // Main tower collision
                  const mainTowerDistance = Math.sqrt(x * x + (z + 30) * (z + 30))
                  if (mainTowerDistance < 3.5) return true
                  
                  // Side towers collision
                  const leftTowerDistance = Math.sqrt((x + 6) * (x + 6) + (z + 30) * (z + 30))
                  if (leftTowerDistance < 2.5) return true
                  const rightTowerDistance = Math.sqrt((x - 6) * (x - 6) + (z + 30) * (z + 30))
                  if (rightTowerDistance < 2.5) return true
                  
                  // Front wall collision
                  if (x >= -7.5 && x <= 7.5 && z >= -28 && z <= -26) return true
                  
                  return false
                }
                
                while (!validSpawn && attempts < 20) {
                  spawnX = (Math.random() - 0.5) * 80  // Random position around castle (larger area)
                  spawnZ = -30 + (Math.random() - 0.5) * 60
                  
                  if (!checkSpawnCollision(spawnX, spawnZ)) {
                    validSpawn = true
                  }
                  attempts++
                }
                
                // If no valid spawn found, use a safe default position
                if (!validSpawn) {
                  spawnX = (Math.random() - 0.5) * 20 > 0 ? 15 : -15
                  spawnZ = -45
                }
                
                setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { 
                  ...e, 
                  active: true, 
                  position: [spawnX, 0.5, spawnZ],
                  currentPosition: [spawnX, 0.5, spawnZ],
                  targetPosition: [spawnX, 0.5, spawnZ]
                } : e)))
              }, 10000)
            }
          }
        })
      })
    }

    checkCollisions()
  }, [arrows, bombs, enemies])

  // Clean up old explosions and enemy pops
  useEffect(() => {
    const explosionDuration = 2000 // 2 seconds
    const popDuration = 3000 // 3 seconds for dramatic effect
    
    const interval = setInterval(() => {
      const now = Date.now()
      setExplosions((prev) => prev.filter((explosion) => now - explosion.createdAt < explosionDuration))
      setEnemyPops((prev) => prev.filter((pop) => now - pop.createdAt < popDuration))
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

      {/* Render enemies */}
      {enemies.map((enemy) => enemy.active && (
        <Enemy 
          key={enemy.id} 
          position={enemy.position} 
          enemy={enemy} 
          onPositionUpdate={(newPosition) => {
            setEnemies(prev => prev.map(e => 
              e.id === enemy.id ? { ...e, currentPosition: newPosition } : e
            ))
          }}
        />
      ))}

      {/* Render explosions */}
      {explosions.map((explosion) => (
        <Explosion key={explosion.id} position={explosion.position} />
      ))}

      {/* Render enemy pop effects */}
      {enemyPops.map((pop) => (
        <EnemyPop key={pop.id} position={pop.position} />
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

    // Movement with sprint
    if (keys.current["KeyW"]) direction.current.z -= 1
    if (keys.current["KeyS"]) direction.current.z += 1
    if (keys.current["KeyA"]) direction.current.x -= 1
    if (keys.current["KeyD"]) direction.current.x += 1

    // Apply sprint multiplier if Shift is held
    const sprintMultiplier = keys.current["ShiftLeft"] || keys.current["ShiftRight"] ? 2 : 1
    direction.current.normalize().multiplyScalar(speed * sprintMultiplier * delta)
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
    // Increased number of trees to 120
    for (let i = 0; i < 120; i++) {
      const angle = (i / 120) * Math.PI * 2
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

function Enemy({ position, enemy, onPositionUpdate }: { position: number[], enemy: any, onPositionUpdate: (position: number[]) => void }) {
  const enemyRef = useRef<THREE.Group>(null)
  const [bobOffset, setBobOffset] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(new THREE.Vector3(...position))
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...position))
  const [nextTargetTime, setNextTargetTime] = useState(Date.now() + Math.random() * 3000)

  // Castle collision detection function
  const checkCastleCollision = (pos: THREE.Vector3) => {
    const x = pos.x
    const z = pos.z
    
    // Main tower collision (center [0, 0, -30], radius 3.5 with buffer)
    const mainTowerDistance = Math.sqrt(x * x + (z + 30) * (z + 30))
    if (mainTowerDistance < 3.5) return true
    
    // Left side tower collision (center [-6, 0, -30], radius 2.5 with buffer)
    const leftTowerDistance = Math.sqrt((x + 6) * (x + 6) + (z + 30) * (z + 30))
    if (leftTowerDistance < 2.5) return true
    
    // Right side tower collision (center [6, 0, -30], radius 2.5 with buffer)
    const rightTowerDistance = Math.sqrt((x - 6) * (x - 6) + (z + 30) * (z + 30))
    if (rightTowerDistance < 2.5) return true
    
    // Front wall collision (x: -7 to 7, z: -27.5 to -26.5 with buffer)
    if (x >= -7.5 && x <= 7.5 && z >= -28 && z <= -26) return true
    
    return false
  }

  // Wandering AI and bobbing animation
  useFrame((state, delta) => {
    if (enemyRef.current && enemy.active) {
      // Bobbing animation
      setBobOffset((prev) => prev + delta * 3)
      
      // Wandering logic - pick new target every 2-5 seconds
      if (Date.now() > nextTargetTime) {
        let attempts = 0
        let validTarget = false
        let castleX, castleZ
        
        // Try to find a valid target that doesn't collide with castle
        while (!validTarget && attempts < 10) {
          // Define castle area bounds (around castle at [0, 0, -30]) - much larger radius
          castleX = 0 + (Math.random() - 0.5) * 80  // -40 to 40 around castle
          castleZ = -30 + (Math.random() - 0.5) * 60  // -60 to 0 around castle
          
          const testTarget = new THREE.Vector3(castleX, 0.5, castleZ)
          if (!checkCastleCollision(testTarget)) {
            validTarget = true
          }
          attempts++
        }
        
        if (validTarget) {
          setTargetPosition(new THREE.Vector3(castleX, 0.5, castleZ))
        }
        setNextTargetTime(Date.now() + 2000 + Math.random() * 3000) // 2-5 seconds
      }
      
      // Move towards target
      const direction = targetPosition.clone().sub(currentPosition)
      direction.y = 0 // Keep on ground level
      
      if (direction.length() > 0.5) {
        direction.normalize()
        const moveVector = direction.multiplyScalar(enemy.moveSpeed * delta)
        const newPosition = currentPosition.clone().add(moveVector)
        
        // Check for castle collision before moving
        if (!checkCastleCollision(newPosition)) {
          setCurrentPosition(newPosition)
          onPositionUpdate([newPosition.x, newPosition.y, newPosition.z])
        } else {
          // If collision detected, pick a new target away from castle
          const escapeX = currentPosition.x > 0 ? currentPosition.x + 5 : currentPosition.x - 5
          const escapeZ = currentPosition.z > -30 ? currentPosition.z + 5 : currentPosition.z - 5
          setTargetPosition(new THREE.Vector3(escapeX, 0.5, escapeZ))
          setNextTargetTime(Date.now() + 1000) // Try new target soon
        }
      }
      
      // Update enemy position
      enemyRef.current.position.copy(currentPosition)
      enemyRef.current.position.y = 0.5 + Math.sin(bobOffset) * 0.1
    }
  })

  return (
    <group ref={enemyRef} position={position as [number, number, number]}>
      {/* Menacing red glow */}
      <pointLight intensity={2} distance={8} color="#FF0000" decay={2} />
      
      {/* Enemy body - darker, more angular */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <octahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial 
          color="#2C0000" 
          roughness={0.2} 
          metalness={0.8}
          emissive="#FF0000"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Spiky head */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial 
          color="#4B0000" 
          roughness={0.1} 
          metalness={0.9}
          emissive="#FF0000"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Horns */}
      <mesh position={[-0.15, 0.9, 0.1]} rotation={[0, 0, -0.3]} castShadow>
        <coneGeometry args={[0.03, 0.3, 6]} />
        <meshStandardMaterial color="#1A0000" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0.15, 0.9, 0.1]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.03, 0.3, 6]} />
        <meshStandardMaterial color="#1A0000" metalness={1} roughness={0.1} />
      </mesh>

      {/* Angry glowing red eyes */}
      <mesh position={[-0.12, 0.6, 0.25]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0.12, 0.6, 0.25]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={2}
        />
      </mesh>

      {/* Angry eyebrows - angled downward for fierce look */}
      <mesh position={[-0.12, 0.68, 0.22]} rotation={[0, 0, 0.5]} castShadow>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#1A0000" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.68, 0.22]} rotation={[0, 0, -0.5]} castShadow>
        <boxGeometry args={[0.08, 0.02, 0.02]} />
        <meshStandardMaterial color="#1A0000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Angry snarling mouth - wider and more menacing */}
      <mesh position={[0, 0.42, 0.28]} castShadow>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Sharp teeth/fangs - more prominent */}
      <mesh position={[-0.08, 0.45, 0.28]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.025, 0.12, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[-0.03, 0.46, 0.28]} rotation={[0, 0, 0.1]} castShadow>
        <coneGeometry args={[0.02, 0.1, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0.03, 0.46, 0.28]} rotation={[0, 0, -0.1]} castShadow>
        <coneGeometry args={[0.02, 0.1, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0.08, 0.45, 0.28]} rotation={[0, 0, -0.3]} castShadow>
        <coneGeometry args={[0.025, 0.12, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.47, 0.28]} castShadow>
        <coneGeometry args={[0.03, 0.15, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.8} roughness={0.1} />
      </mesh>

      {/* Clawed feet */}
      <mesh position={[-0.2, 0.05, 0.15]} castShadow>
        <octahedronGeometry args={[0.08, 1]} />
        <meshStandardMaterial color="#1A0000" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.2, 0.05, 0.15]} castShadow>
        <octahedronGeometry args={[0.08, 1]} />
        <meshStandardMaterial color="#1A0000" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Sharp claws */}
      <mesh position={[-0.2, 0.1, 0.25]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.02, 0.08, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
      </mesh>
      <mesh position={[0.2, 0.1, 0.25]} rotation={[0.3, 0, 0]} castShadow>
        <coneGeometry args={[0.02, 0.08, 4]} />
        <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
      </mesh>

      {/* Spiky back armor */}
      {Array.from({ length: 3 }).map((_, i) => {
        const y = 0.2 + i * 0.15
        const size = 0.08 - i * 0.02
        return (
          <mesh key={i} position={[0, y, -0.3]} castShadow>
            <coneGeometry args={[size, size * 2, 6]} />
            <meshStandardMaterial 
              color="#4B0000" 
              metalness={0.8} 
              roughness={0.2}
              emissive="#660000"
              emissiveIntensity={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function EnemyPop({ position }: { position: number[] }) {
  const popRef = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)
  const [particles, setParticles] = useState<any[]>([])

  // Initialize particles
  useEffect(() => {
    const initialParticles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2
      const speed = 2 + Math.random() * 3
      return {
        id: i,
        position: [0, 0, 0],
        velocity: [Math.cos(angle) * speed, Math.random() * 4 + 2, Math.sin(angle) * speed],
        color: i % 3 === 0 ? "#FF69B4" : i % 3 === 1 ? "#FFD700" : "#FF4500",
        size: 0.1 + Math.random() * 0.2,
      }
    })
    setParticles(initialParticles)
  }, [])

  // Dramatic pop animation
  useFrame((state, delta) => {
    if (popRef.current) {
      // Initial dramatic expansion then shrink
      const time = state.clock.elapsedTime
      if (time < 0.2) {
        // Quick expansion
        setScale(1 + time * 15)
      } else if (time < 0.4) {
        // Dramatic shrink
        setScale(4 - (time - 0.2) * 15)
      } else {
        // Fade out
        setScale(0.5)
        setOpacity((prev) => Math.max(prev - delta * 2, 0))
      }

      // Update particles
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          position: [
            particle.position[0] + particle.velocity[0] * delta,
            particle.position[1] + particle.velocity[1] * delta,
            particle.position[2] + particle.velocity[2] * delta,
          ],
          velocity: [
            particle.velocity[0] * 0.98, // Air resistance
            particle.velocity[1] - 9.8 * delta, // Gravity
            particle.velocity[2] * 0.98,
          ],
        })),
      )

      // Rotate for dramatic effect
      popRef.current.rotation.y += delta * 10
      popRef.current.rotation.x += delta * 5
    }
  })

  return (
    <group position={position as [number, number, number]}>
      {/* Dramatic flash light */}
      <pointLight intensity={8} distance={15} color="#FF69B4" decay={2} />

      {/* Main pop effect */}
      <group ref={popRef}>
        {/* Central burst */}
        <mesh>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial
            color="#FF69B4"
            emissive="#FF69B4"
            emissiveIntensity={3}
            transparent={true}
            opacity={opacity}
          />
        </mesh>

        {/* Outer ring */}
        <mesh>
          <torusGeometry args={[0.6, 0.1, 8, 16]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={2}
            transparent={true}
            opacity={opacity * 0.8}
          />
        </mesh>

        {/* Star burst effect */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.cos(angle) * 0.8
          const z = Math.sin(angle) * 0.8

          return (
            <mesh key={i} position={[x, 0, z]} rotation={[0, angle, 0]}>
              <coneGeometry args={[0.05, 0.4, 4]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#FFFFFF"
                emissiveIntensity={2}
                transparent={true}
                opacity={opacity}
              />
            </mesh>
          )
        })}
      </group>

      {/* Flying particles */}
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.position as [number, number, number]}>
          <sphereGeometry args={[particle.size, 6, 6]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={1.5}
            transparent={true}
            opacity={opacity}
          />
        </mesh>
      ))}

      {/* Text effect "POP!" */}
      <group position={[0, 1.5, 0]} scale={[scale * 0.5, scale * 0.5, scale * 0.5]}>
        <mesh>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FFFFFF"
            emissiveIntensity={3}
            transparent={true}
            opacity={opacity}
          />
        </mesh>
      </group>
    </group>
  )
}