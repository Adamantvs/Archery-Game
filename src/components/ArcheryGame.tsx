"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls, Sky } from "@react-three/drei"
import * as THREE from "three"

export default function ArcheryGame() {
  const [isLocked, setIsLocked] = useState(false)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [killCount, setKillCount] = useState(0)
  const [dragon, setDragon] = useState<any>(null)

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 2, 5] }}>
        <Game 
          setIsLocked={setIsLocked} 
          playerHealth={playerHealth} 
          setPlayerHealth={setPlayerHealth} 
          score={score} 
          setScore={setScore}
          killCount={killCount}
          setKillCount={setKillCount}
          dragon={dragon}
          setDragon={setDragon}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Health Bar and Score */}
        <div className="absolute top-4 right-4 space-y-3">
          {/* Score Display */}
          <div className="bg-black bg-opacity-70 p-3 rounded-lg">
            <div className="text-white text-sm font-bold mb-1">SCORE</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{score}</div>
              <div className="text-xs text-gray-300">/ 10 to win</div>
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="bg-black bg-opacity-70 p-3 rounded-lg">
            <div className="text-white text-sm font-bold mb-1">HEALTH</div>
            <div className="w-48 h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
              <div 
                className={`h-full transition-all duration-300 ${
                  playerHealth > 60 ? 'bg-green-500' : 
                  playerHealth > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(0, playerHealth)}%` }}
              />
            </div>
            <div className="text-white text-xs mt-1 text-center">{Math.round(playerHealth)}/100</div>
          </div>
        </div>

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 border-2 border-white rounded-full opacity-70">
            <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>

        {/* Victory Screen */}
        {score >= 10 && (
          <div className="absolute inset-0 bg-green-900 bg-opacity-80 flex items-center justify-center pointer-events-auto">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4 text-green-300">VICTORY!</h1>
              <p className="text-xl mb-6">You have defeated 10 flying demons and saved the castle!</p>
              <div className="text-4xl font-bold text-yellow-400 mb-6">Final Score: {score}</div>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                onClick={() => window.location.reload()}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {playerHealth <= 0 && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center pointer-events-auto">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4 text-red-300">GAME OVER</h1>
              <p className="text-xl mb-6">You have been defeated by the flying demons!</p>
              <div className="text-2xl font-bold text-yellow-400 mb-6">Final Score: {score}</div>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                onClick={() => window.location.reload()}
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {/* Dragon Warning */}
        {killCount >= 5 && dragon && dragon.active && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="bg-red-900 bg-opacity-90 p-6 rounded-lg border-4 border-red-500 animate-pulse">
              <h2 className="text-4xl font-bold text-red-300 mb-2">🐉 DRAGON BOSS AWAKENED! 🐉</h2>
              <p className="text-xl text-white">A mighty dragon has emerged to defend the realm!</p>
              <p className="text-lg text-yellow-400 mt-2">Health: {dragon.health}/5</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isLocked && playerHealth > 0 && (
          <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded">
            <p className="text-sm">Click to lock cursor and start playing</p>
            <p className="text-xs mt-2">Left Click: Shoot Arrow</p>
            <p className="text-xs">Mouse: Aim</p>
            <p className="text-xs">WASD: Move</p>
            <p className="text-xs">Spacebar: Jump</p>
            <p className="text-xs">Hold Shift: Sprint</p>
            <p className="text-xs mt-2">Shoot the bomb crates and enemies!</p>
            <p className="text-xs text-yellow-400 mt-2">⚠️ Avoid enemies and explosions - they damage you!</p>
            <p className="text-xs text-red-400 mt-1">🎯 Kill 5 enemies to face the DRAGON BOSS!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Game({ setIsLocked, playerHealth, setPlayerHealth, score, setScore, killCount, setKillCount, dragon, setDragon }: { 
  setIsLocked: (locked: boolean) => void, 
  playerHealth: number, 
  setPlayerHealth: (health: number) => void, 
  score: number, 
  setScore: (score: number) => void,
  killCount: number,
  setKillCount: (count: number) => void,
  dragon: any,
  setDragon: (dragon: any) => void
}) {
  const [arrows, setArrows] = useState<any[]>([])
  const [bowDrawn, setBowDrawn] = useState(false)
  const [bombs, setBombs] = useState<any[]>([])
  const [explosions, setExplosions] = useState<any[]>([])
  const [enemies, setEnemies] = useState<any[]>([])
  const [enemyPops, setEnemyPops] = useState<any[]>([])
  const [lastDamageTime, setLastDamageTime] = useState(0)
  const [dragonSpawned, setDragonSpawned] = useState(false)
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
      { id: 1, position: [-8, 0.5, -25], active: true, targetPosition: [-8, 0.5, -25], moveSpeed: 5 + Math.random() * 3, currentPosition: [-8, 0.5, -25] },
      { id: 2, position: [8, 0.5, -28], active: true, targetPosition: [8, 0.5, -28], moveSpeed: 5 + Math.random() * 3, currentPosition: [8, 0.5, -28] },
      { id: 3, position: [0, 0.5, -35], active: true, targetPosition: [0, 0.5, -35], moveSpeed: 5 + Math.random() * 3, currentPosition: [0, 0.5, -35] },
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

  // Damage player function with cooldown
  const damagePlayer = (damage: number) => {
    const now = Date.now()
    if (now - lastDamageTime > 1000) { // 1 second damage cooldown
      setPlayerHealth(prev => Math.max(0, prev - damage))
      setLastDamageTime(now)
    }
  }

  // Check for collisions (arrows, enemies, explosions)
  useEffect(() => {
    const checkCollisions = () => {
      const playerPosition = controlsRef.current?.getObject()?.position
      
      // Check enemy-player collisions
      if (playerPosition) {
        enemies.forEach((enemy) => {
          if (enemy.active) {
            const enemyPos = new THREE.Vector3(...(enemy.currentPosition || enemy.position))
            const distance = enemyPos.distanceTo(playerPosition)
            
            if (distance < 1.2) { // Enemy collision radius
              damagePlayer(10) // 10 damage per hit
            }
          }
        })
      }
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

              // Check if player is within explosion radius and damage them
              if (playerPosition) {
                const explosionVec = new THREE.Vector3(...explosionPos)
                const playerDistance = playerPosition.distanceTo(explosionVec)
                
                if (playerDistance < 8.0) { // Player explosion damage radius (larger than enemy)
                  const damage = Math.max(5, 30 - playerDistance * 3) // More damage when closer
                  damagePlayer(damage)
                }
              }

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

                    // Deactivate enemy and increment score and kill count
                    setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))
                    setScore(prev => prev + 1)
                    setKillCount(prev => prev + 1)

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

              // Deactivate enemy and increment score and kill count
              setEnemies((prev) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))
              setScore(prev => prev + 1)
              setKillCount(prev => prev + 1)

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

        // Check dragon collisions
        if (dragon && dragon.active) {
          const dragonPos = new THREE.Vector3(...(dragon.currentPosition || dragon.position))
          const distance = dragonPos.distanceTo(arrow.position)

          if (distance < 2.0) { // Dragon is larger, bigger hit radius
            // Create dramatic explosion effect at dragon position
            setExplosions((prev) => [
              ...prev,
              {
                id: Date.now(),
                position: dragon.currentPosition || dragon.position,
                createdAt: Date.now(),
              },
            ])

            // Damage dragon
            const newHealth = dragon.health - 1
            if (newHealth <= 0) {
              // Dragon defeated!
              setEnemyPops((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  position: dragon.currentPosition || dragon.position,
                  createdAt: Date.now(),
                },
              ])
              setDragon(null)
              setScore(prev => prev + 10) // Big score bonus for dragon
            } else {
              setDragon(prev => ({ ...prev, health: newHealth }))
            }

            // Remove arrow
            setArrows((prev) => prev.filter((a) => a.id !== arrow.id))
          }
        }
      })
    }

    checkCollisions()
  }, [arrows, bombs, enemies, dragon, playerHealth, lastDamageTime])

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

  // Spawn dragon after 5 kills
  useEffect(() => {
    if (killCount >= 5 && !dragonSpawned) {
      setDragonSpawned(true)
      setDragon({
        id: 'dragon',
        position: [0, 15, -60],
        health: 5,
        active: true,
        attackTimer: 0,
        currentPosition: [0, 15, -60],
        targetPosition: [0, 15, -60],
        phase: 'circling' // circling, attacking, fleeing
      })
    }
  }, [killCount, dragonSpawned])

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
          playerPosition={controlsRef.current?.getObject()?.position}
          onPositionUpdate={(newPosition) => {
            setEnemies(prev => prev.map(e => 
              e.id === enemy.id ? { ...e, currentPosition: newPosition } : e
            ))
          }}
        />
      ))}

      {/* Render dragon boss */}
      {dragon && dragon.active && (
        <DragonBoss 
          dragon={dragon}
          playerPosition={controlsRef.current?.getObject()?.position}
          onPositionUpdate={(newPosition) => {
            setDragon(prev => prev ? { ...prev, currentPosition: newPosition } : null)
          }}
        />
      )}

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
      {/* Main tactical stock - modern composite design */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[0.08, 0.06, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Tactical rail system on top */}
      <mesh position={[0, 0.04, -0.1]}>
        <boxGeometry args={[0.04, 0.01, 0.6]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Rail segments for tactical look */}
      {Array.from({ length: 8 }).map((_, i) => {
        const z = -0.4 + i * 0.1
        return (
          <mesh key={i} position={[0, 0.045, z]}>
            <boxGeometry args={[0.03, 0.005, 0.02]} />
            <meshStandardMaterial color="#3a3a3a" roughness={0.1} metalness={0.95} />
          </mesh>
        )
      })}

      {/* Advanced bow assembly - carbon fiber limbs */}
      <mesh position={[0, 0.02, 0.4]}>
        <boxGeometry args={[0.2, 0.12, 0.08]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* High-tech limbs - curved design */}
      <mesh position={[-0.25, 0.02, 0.4]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.5, 0.04, 0.03]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.1} 
          metalness={0.9}
          emissive="#001122"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0.25, 0.02, 0.4]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.5, 0.04, 0.03]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          roughness={0.1} 
          metalness={0.9}
          emissive="#001122"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Limb tips with high-tech cams */}
      <mesh position={[-0.45, 0.02, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.45, 0.02, 0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.5} />
      </mesh>

      {/* High-tech bowstring with energy effect */}
      <mesh position={[0, 0.02, drawn ? 0.37 : 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.9]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff" 
          emissiveIntensity={1.5}
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* Scope/sight system */}
      <mesh position={[0, 0.08, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Scope lens */}
      <mesh position={[0, 0.08, 0.275]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01]} />
        <meshStandardMaterial 
          color="#0066ff" 
          emissive="#0066ff" 
          emissiveIntensity={0.8}
          transparent={true}
          opacity={0.7}
        />
      </mesh>

      {/* Tactical grip with texture */}
      <mesh position={[0, -0.04, 0.1]}>
        <cylinderGeometry args={[0.025, 0.02, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0.3} />
      </mesh>

      {/* Advanced trigger assembly */}
      <mesh position={[0, -0.08, 0.1]}>
        <boxGeometry args={[0.015, 0.04, 0.008]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.3} />
      </mesh>

      {/* Trigger guard - tactical style */}
      <mesh position={[0, -0.06, 0.1]}>
        <torusGeometry args={[0.04, 0.008, 8, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Stock with tactical pattern */}
      <mesh position={[0, -0.01, -0.5]}>
        <boxGeometry args={[0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Shoulder pad */}
      <mesh position={[0, 0, -0.58]}>
        <boxGeometry args={[0.12, 0.1, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.5} />
      </mesh>

      {/* Side accessory rails */}
      <mesh position={[-0.05, 0, 0.1]}>
        <boxGeometry args={[0.008, 0.03, 0.3]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0.05, 0, 0.1]}>
        <boxGeometry args={[0.008, 0.03, 0.3]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Tactical light/laser */}
      <mesh position={[-0.06, -0.02, 0.25]}>
        <cylinderGeometry args={[0.008, 0.008, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Light beam effect */}
      <mesh position={[-0.06, -0.02, 0.27]}>
        <cylinderGeometry args={[0.006, 0.006, 0.01]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={2}
          transparent={true}
          opacity={0.9}
        />
      </mesh>

      {/* Energy core in the center */}
      <mesh position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial 
          color="#00ff44" 
          emissive="#00ff44" 
          emissiveIntensity={1.5}
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* Recoil dampeners */}
      <mesh position={[0, 0.02, 0.5]}>
        <cylinderGeometry args={[0.015, 0.02, 0.06]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={0.4} />
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

function Enemy({ position, enemy, playerPosition, onPositionUpdate }: { position: number[], enemy: any, playerPosition?: THREE.Vector3, onPositionUpdate: (position: number[]) => void }) {
  const enemyRef = useRef<THREE.Group>(null)
  const [bobOffset, setBobOffset] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(new THREE.Vector3(...position))
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...position))
  const [nextTargetTime, setNextTargetTime] = useState(Date.now() + Math.random() * 3000)
  const [isFollowingPlayer, setIsFollowingPlayer] = useState(false)
  const [baseHeight, setBaseHeight] = useState(0.5)
  const [targetHeight, setTargetHeight] = useState(0.5)

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

  // Flying and player-following AI
  useFrame((state, delta) => {
    if (enemyRef.current && enemy.active) {
      // Wing flapping animation
      setBobOffset((prev) => prev + delta * 3)
      
      // Check for player proximity (within 15 units)
      let playerDetected = false
      if (playerPosition) {
        const distanceToPlayer = currentPosition.distanceTo(playerPosition)
        if (distanceToPlayer < 15) {
          playerDetected = true
          setIsFollowingPlayer(true)
        } else if (distanceToPlayer > 25) {
          // Stop following if player gets too far away
          setIsFollowingPlayer(false)
        }
      }
      
      // AI behavior based on player detection
      if (isFollowingPlayer && playerPosition) {
        // Aggressive follow behavior - fly low to attack player
        const playerTarget = playerPosition.clone()
        const distanceToPlayer = currentPosition.distanceTo(playerPosition)
        
        // Add unpredictable movement patterns
        const time = state.clock.elapsedTime + enemy.id
        const randomOffset = new THREE.Vector3(
          Math.sin(time * 2) * 2,
          0,
          Math.cos(time * 1.5) * 2
        )
        playerTarget.add(randomOffset)
        
        // Fly lower when close to player for attacking
        if (distanceToPlayer < 8) {
          playerTarget.y = playerPosition.y + 0.5 + Math.sin(time * 4) * 0.5 // Very low, aggressive diving
        } else {
          playerTarget.y = playerPosition.y + 1.5 + Math.sin(time * 3) * 1 // Medium height when approaching
        }
        
        setTargetPosition(playerTarget)
        setTargetHeight(playerTarget.y)
      } else {
        // Normal wandering behavior with random height changes
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
            // Random flight height between 0.5 and 4 meters
            const randomHeight = 0.5 + Math.random() * 3.5
            setTargetPosition(new THREE.Vector3(castleX, randomHeight, castleZ))
            setTargetHeight(randomHeight)
          }
          setNextTargetTime(Date.now() + 2000 + Math.random() * 3000) // 2-5 seconds
        }
      }
      
      // Move towards target (including vertical movement)
      const direction = targetPosition.clone().sub(currentPosition)
      
      if (direction.length() > 0.5) {
        direction.normalize()
        
        // Much faster and more aggressive when following player
        const moveSpeed = isFollowingPlayer ? enemy.moveSpeed * 2.5 : enemy.moveSpeed
        
        // Add erratic movement when following player
        if (isFollowingPlayer) {
          const erraticTime = state.clock.elapsedTime * 3 + enemy.id
          const erraticOffset = new THREE.Vector3(
            Math.sin(erraticTime) * 0.3,
            Math.cos(erraticTime * 1.2) * 0.2,
            Math.sin(erraticTime * 0.8) * 0.3
          )
          direction.add(erraticOffset).normalize()
        }
        
        const moveVector = direction.multiplyScalar(moveSpeed * delta)
        const newPosition = currentPosition.clone().add(moveVector)
        
        // Check for castle collision before moving (only horizontal collision)
        const horizontalNewPos = newPosition.clone()
        horizontalNewPos.y = 0.5 // Check collision at ground level
        
        if (!checkCastleCollision(horizontalNewPos)) {
          setCurrentPosition(newPosition)
          onPositionUpdate([newPosition.x, newPosition.y, newPosition.z])
        } else {
          // If collision detected, pick a new target away from castle
          const escapeX = currentPosition.x > 0 ? currentPosition.x + 5 : currentPosition.x - 5
          const escapeZ = currentPosition.z > -30 ? currentPosition.z + 5 : currentPosition.z - 5
          const escapeHeight = 1 + Math.random() * 2 // Fly up to escape
          setTargetPosition(new THREE.Vector3(escapeX, escapeHeight, escapeZ))
          setTargetHeight(escapeHeight)
          setNextTargetTime(Date.now() + 1000) // Try new target soon
        }
      }
      
      // Update enemy position with flight bobbing
      enemyRef.current.position.copy(currentPosition)
      enemyRef.current.position.y += Math.sin(bobOffset) * 0.2 // Larger flight bobbing
      
      // Face movement direction
      if (direction.length() > 0.1) {
        const lookDirection = direction.normalize()
        enemyRef.current.lookAt(
          enemyRef.current.position.x + lookDirection.x,
          enemyRef.current.position.y,
          enemyRef.current.position.z + lookDirection.z
        )
      }
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

      {/* Bat Wings */}
      <group position={[0, 0.5, -0.1]}>
        {/* Left Wing */}
        <group position={[-0.3, 0, 0]} rotation={[0, 0, Math.sin(bobOffset * 2) * 0.3]}>
          {/* Wing membrane */}
          <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.2]}>
            <planeGeometry args={[0.4, 0.6]} />
            <meshStandardMaterial 
              color="#1A0000" 
              transparent={true}
              opacity={0.8}
              side={THREE.DoubleSide}
              emissive="#660000"
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Wing bones/fingers */}
          <mesh position={[-0.1, 0.2, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3]} />
            <meshStandardMaterial color="#000000" metalness={0.9} />
          </mesh>
          <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.006, 0.006, 0.25]} />
            <meshStandardMaterial color="#000000" metalness={0.9} />
          </mesh>
          <mesh position={[-0.3, -0.1, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.006, 0.006, 0.2]} />
            <meshStandardMaterial color="#000000" metalness={0.9} />
          </mesh>
          
          {/* Wing claw */}
          <mesh position={[-0.4, 0.2, 0]}>
            <coneGeometry args={[0.02, 0.08, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
          </mesh>
        </group>

        {/* Right Wing */}
        <group position={[0.3, 0, 0]} rotation={[0, 0, -Math.sin(bobOffset * 2) * 0.3]}>
          {/* Wing membrane */}
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.2]}>
            <planeGeometry args={[0.4, 0.6]} />
            <meshStandardMaterial 
              color="#1A0000" 
              transparent={true}
              opacity={0.8}
              side={THREE.DoubleSide}
              emissive="#660000"
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Wing bones/fingers */}
          <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3]} />
            <meshStandardMaterial color="#000000" metalness={0.9} />
          </mesh>
          <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.006, 0.006, 0.25]} />
            <meshStandardMaterial color="#000000" metalness={0.9} />
          </mesh>
          <mesh position={[0.3, -0.1, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.006, 0.006, 0.2]} />
            <meshStandardMaterial color="#000000" metalness={0.9} />
          </mesh>
          
          {/* Wing claw */}
          <mesh position={[0.4, 0.2, 0]}>
            <coneGeometry args={[0.02, 0.08, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
          </mesh>
        </group>
      </group>
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

function DragonBoss({ dragon, playerPosition, onPositionUpdate }: { dragon: any, playerPosition?: THREE.Vector3, onPositionUpdate: (position: number[]) => void }) {
  const dragonRef = useRef<THREE.Group>(null)
  const [bobOffset, setBobOffset] = useState(0)
  const [wingFlap, setWingFlap] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(dragon.position)
  const [attackTimer, setAttackTimer] = useState(0)

  // Dragon AI and movement
  useFrame((state, delta) => {
    if (!dragonRef.current || !playerPosition) return

    setBobOffset(prev => prev + delta * 2)
    setWingFlap(prev => prev + delta * 8)
    setAttackTimer(prev => prev + delta)

    // Update dragon's current position based on phase
    let newPosition = [...currentPosition]
    
    if (dragon.phase === 'circling') {
      // Circle around the castle area
      const time = state.clock.elapsedTime * 0.3
      const radius = 25
      newPosition[0] = Math.cos(time) * radius
      newPosition[2] = -40 + Math.sin(time) * radius
      newPosition[1] = 15 + Math.sin(time * 2) * 3 // Vertical bobbing
    } else if (dragon.phase === 'attacking') {
      // Swoop towards player
      if (playerPosition) {
        const direction = new THREE.Vector3()
        direction.subVectors(playerPosition, new THREE.Vector3(...currentPosition))
        direction.normalize().multiplyScalar(8) // Attack speed
        
        newPosition[0] += direction.x * delta
        newPosition[1] += direction.y * delta  
        newPosition[2] += direction.z * delta
      }
    }

    setCurrentPosition(newPosition)
    onPositionUpdate(newPosition)

    // Update visual position
    dragonRef.current.position.set(...newPosition)
    
    // Face towards player
    if (playerPosition) {
      dragonRef.current.lookAt(playerPosition)
    }

    // Vertical bobbing motion
    dragonRef.current.position.y += Math.sin(bobOffset) * 0.5
  })

  return (
    <group ref={dragonRef} position={currentPosition as [number, number, number]}>
      {/* Dramatic dragon light aura */}
      <pointLight intensity={3} distance={30} color="#FF0000" decay={2} />
      
      {/* Main dragon body - much larger and more menacing */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial 
          color="#8B0000" 
          roughness={0.3} 
          metalness={0.7}
          emissive="#330000"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Dragon neck */}
      <mesh position={[0, 1, 3]} rotation={[0.3, 0, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.8, 4]} />
        <meshStandardMaterial 
          color="#660000" 
          roughness={0.4} 
          metalness={0.6}
          emissive="#220000"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Dragon head - massive and terrifying */}
      <mesh position={[0, 2.5, 5]} castShadow>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial 
          color="#AA0000" 
          roughness={0.2} 
          metalness={0.8}
          emissive="#440000"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Glowing red eyes */}
      <mesh position={[-0.6, 2.8, 6.2]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0.6, 2.8, 6.2]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={2}
        />
      </mesh>

      {/* Massive dragon horns */}
      <mesh position={[-0.8, 3.5, 5]} rotation={[0.3, 0, 0.3]} castShadow>
        <coneGeometry args={[0.3, 2, 6]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.8, 3.5, 5]} rotation={[0.3, 0, -0.3]} castShadow>
        <coneGeometry args={[0.3, 2, 6]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Dragon nostrils with smoke effect */}
      <mesh position={[-0.3, 2.3, 6.8]} castShadow>
        <cylinderGeometry args={[0.15, 0.1, 0.3]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.3, 2.3, 6.8]} castShadow>
        <cylinderGeometry args={[0.15, 0.1, 0.3]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Massive sharp teeth */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const x = Math.cos(angle) * 1.2
        const z = Math.sin(angle) * 0.3
        return (
          <mesh key={i} position={[x, 1.8, 5.5 + z]} rotation={[0, angle, 0]} castShadow>
            <coneGeometry args={[0.1, 0.8, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
          </mesh>
        )
      })}

      {/* Massive dragon wings with detailed structure */}
      <group position={[0, 1, 0]}>
        {/* Left Wing */}
        <group position={[-3, 0, 0]} rotation={[0, 0, Math.sin(wingFlap) * 0.5]}>
          {/* Wing membrane - much larger */}
          <mesh position={[-4, 2, 0]} rotation={[0, 0, 0.3]}>
            <planeGeometry args={[8, 10]} />
            <meshStandardMaterial 
              color="#4B0000" 
              transparent={true}
              opacity={0.8}
              side={THREE.DoubleSide}
              emissive="#660000"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Wing bones - stronger structure */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[-2 - i * 1.5, 4 - i * 0.8, 0]} rotation={[0, 0, 0.2 + i * 0.1]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 6 - i]} />
              <meshStandardMaterial color="#2F2F2F" metalness={0.9} />
            </mesh>
          ))}
          
          {/* Wing claws */}
          <mesh position={[-8, 6, 0]} rotation={[0, 0, -0.5]} castShadow>
            <coneGeometry args={[0.2, 1.5, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
          </mesh>
        </group>

        {/* Right Wing */}
        <group position={[3, 0, 0]} rotation={[0, 0, -Math.sin(wingFlap) * 0.5]}>
          {/* Wing membrane - much larger */}
          <mesh position={[4, 2, 0]} rotation={[0, 0, -0.3]}>
            <planeGeometry args={[8, 10]} />
            <meshStandardMaterial 
              color="#4B0000" 
              transparent={true}
              opacity={0.8}
              side={THREE.DoubleSide}
              emissive="#660000"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Wing bones - stronger structure */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[2 + i * 1.5, 4 - i * 0.8, 0]} rotation={[0, 0, -0.2 - i * 0.1]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 6 - i]} />
              <meshStandardMaterial color="#2F2F2F" metalness={0.9} />
            </mesh>
          ))}
          
          {/* Wing claws */}
          <mesh position={[8, 6, 0]} rotation={[0, 0, 0.5]} castShadow>
            <coneGeometry args={[0.2, 1.5, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* Dragon tail with spikes */}
      <group position={[0, 0, -4]}>
        <mesh position={[0, 0, -3]} rotation={[0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[1.5, 0.8, 6]} />
          <meshStandardMaterial 
            color="#660000" 
            roughness={0.4} 
            metalness={0.6}
            emissive="#220000"
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Tail spikes */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, 0.5, -1 - i]} castShadow>
            <coneGeometry args={[0.3, 1, 6]} />
            <meshStandardMaterial 
              color="#4B0000" 
              metalness={0.8} 
              roughness={0.2}
              emissive="#660000"
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Dragon claws */}
      <mesh position={[-1.5, -1.5, 2]} castShadow>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.5, -1.5, 2]} castShadow>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Sharp talons */}
      {Array.from({ length: 6 }).map((_, i) => {
        const side = i < 3 ? -1 : 1
        const clawIndex = i % 3
        const x = side * 1.5 + side * clawIndex * 0.3
        const z = 2.5 + clawIndex * 0.2
        return (
          <mesh key={i} position={[x, -2, z]} rotation={[0.5, 0, 0]} castShadow>
            <coneGeometry args={[0.08, 0.6, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} />
          </mesh>
        )
      })}

      {/* Spine spikes along the back */}
      {Array.from({ length: 8 }).map((_, i) => {
        const z = 2 - i * 0.8
        const size = 0.6 - i * 0.06
        return (
          <mesh key={i} position={[0, 1.5 + Math.sin(i * 0.5) * 0.3, z]} castShadow>
            <coneGeometry args={[size * 0.5, size * 2, 6]} />
            <meshStandardMaterial 
              color="#4B0000" 
              metalness={0.8} 
              roughness={0.2}
              emissive="#660000"
              emissiveIntensity={0.5}
            />
          </mesh>
        )
      })}

      {/* Health indicator above dragon */}
      <group position={[0, 6, 0]}>
        <mesh>
          <planeGeometry args={[4, 0.5]} />
          <meshStandardMaterial color="#FF0000" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.01]} scale={[dragon.health / 5, 1, 1]}>
          <planeGeometry args={[4, 0.5]} />
          <meshStandardMaterial color="#00FF00" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  )
}