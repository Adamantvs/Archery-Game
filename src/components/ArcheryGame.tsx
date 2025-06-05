"use client"

import { useRef, useState, useEffect, useMemo, useCallback, Dispatch, SetStateAction } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls, Sky } from "@react-three/drei"
import * as THREE from "three"

// Pre-create geometries and materials to avoid recreating them
const GEOMETRIES = {
  sphere: new THREE.SphereGeometry(1, 8, 8),
  sphereHQ: new THREE.SphereGeometry(1, 16, 16),
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1),
  circle: new THREE.CircleGeometry(1, 16),
  torus: new THREE.TorusGeometry(1, 0.1, 8, 16),
  plane: new THREE.PlaneGeometry(200, 200)
}

const MATERIALS = {
  wood: new THREE.MeshStandardMaterial({ color: "#8B4513", roughness: 0.9 }),
  woodDark: new THREE.MeshStandardMaterial({ color: "#654321", roughness: 0.8 }),
  metal: new THREE.MeshStandardMaterial({ color: "#2F2F2F", metalness: 0.8, roughness: 0.2 }),
  ground: new THREE.MeshStandardMaterial({ color: "#228B22", roughness: 0.8, metalness: 0.1 }),
  leaves: new THREE.MeshStandardMaterial({ color: "#228B22", roughness: 0.7 }),
  leavesLight: new THREE.MeshStandardMaterial({ color: "#32CD32", roughness: 0.7 }),
  castle: new THREE.MeshStandardMaterial({ color: "#696969", roughness: 0.9 }),
  roof: new THREE.MeshStandardMaterial({ color: "#8B0000", roughness: 0.7 }),
  enemyBody: new THREE.MeshStandardMaterial({ color: "#8B4513", roughness: 0.8 }),
  enemyCap: new THREE.MeshStandardMaterial({ color: "#D2691E", roughness: 0.7 }),
  white: new THREE.MeshStandardMaterial({ color: "#FFFFFF" }),
  black: new THREE.MeshStandardMaterial({ color: "#000000" })
}

function DynamicSky({ dragon, victoryTransition }: { dragon: any, victoryTransition: boolean }) {
  const [skyTransition, setSkyTransition] = useState(0)
  
  useEffect(() => {
    if (victoryTransition) {
      // 5-second smooth transition from dramatic sunset to peaceful daytime
      const startTime = Date.now()
      const duration = 5000 // 5 seconds
      
      const animateTransition = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Smooth easing function for natural transition
        const easedProgress = progress * progress * (3 - 2 * progress)
        setSkyTransition(easedProgress)
        
        if (progress < 1) {
          requestAnimationFrame(animateTransition)
        }
      }
      
      animateTransition()
    }
  }, [victoryTransition])
  
  // Calculate sky parameters based on dragon state and victory transition
  const getSkyParams = () => {
    if (victoryTransition) {
      // Interpolate between dramatic and peaceful sky
      const dramaticSun = [30, 6, 80]
      const peacefulSun = [100, 25, 50]
      
      const sunPosition = [
        dramaticSun[0] + (peacefulSun[0] - dramaticSun[0]) * skyTransition,
        dramaticSun[1] + (peacefulSun[1] - dramaticSun[1]) * skyTransition,
        dramaticSun[2] + (peacefulSun[2] - dramaticSun[2]) * skyTransition
      ]
      
      return {
        sunPosition: sunPosition as [number, number, number],
        turbidity: 25 + (-17) * skyTransition, // 25 -> 8
        rayleigh: 0.3 + (2.2) * skyTransition, // 0.3 -> 2.5
        mieCoefficient: 0.2 + (-0.19) * skyTransition, // 0.2 -> 0.01
        mieDirectionalG: 0.95 + (-0.2) * skyTransition // 0.95 -> 0.75
      }
    } else if (dragon && dragon.active) {
      // Dramatic dragon sky
      return {
        sunPosition: [30, 6, 80] as [number, number, number],
        turbidity: 25,
        rayleigh: 0.3,
        mieCoefficient: 0.2,
        mieDirectionalG: 0.95
      }
    } else {
      // Normal peaceful sky
      return {
        sunPosition: [50, 8, 100] as [number, number, number],
        turbidity: 8,
        rayleigh: 1.5,
        mieCoefficient: 0.01,
        mieDirectionalG: 0.7
      }
    }
  }
  
  const skyParams = getSkyParams()
  
  return (
    <Sky 
      sunPosition={skyParams.sunPosition}
      turbidity={skyParams.turbidity}
      rayleigh={skyParams.rayleigh}
      mieCoefficient={skyParams.mieCoefficient}
      mieDirectionalG={skyParams.mieDirectionalG}
    />
  )
}

export default function ArcheryGame() {
  const [isLocked, setIsLocked] = useState(false)
  const [playerHealth, setPlayerHealth] = useState(100)
  const [score, setScore] = useState(0)
  const [killCount, setKillCount] = useState(0)
  const [dragon, setDragon] = useState<any>(null)
  const [dragonSpawned, setDragonSpawned] = useState(false)
  const [showDragonWarning, setShowDragonWarning] = useState(false)
  const [dragonDefeated, setDragonDefeated] = useState(false)
  const [showVictoryMessage, setShowVictoryMessage] = useState(false)
  const [showFullVictory, setShowFullVictory] = useState(false)
  const [_dragonEntering, setDragonEntering] = useState(false)
  const [confetti, setConfetti] = useState<any[]>([])
  const [damageFlash, setDamageFlash] = useState(0)
  const [victoryTransition, setVictoryTransition] = useState(false)
  const [resetGameTrigger, setResetGameTrigger] = useState(0)

  return (
    <div className="w-full h-screen relative">
      <Canvas 
        shadows 
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 2, 5] }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <Game 
          setIsLocked={setIsLocked} 
          playerHealth={playerHealth} 
          setPlayerHealth={setPlayerHealth} 
          _score={score} 
          setScore={setScore}
          killCount={killCount}
          setKillCount={setKillCount}
          dragon={dragon}
          setDragon={setDragon}
          dragonSpawned={dragonSpawned}
          setDragonSpawned={setDragonSpawned}
          setShowDragonWarning={setShowDragonWarning}
          setDragonDefeated={setDragonDefeated}
          setShowVictoryMessage={setShowVictoryMessage}
          _setDragonEntering={setDragonEntering}
          confetti={confetti}
          setConfetti={setConfetti}
          setShowFullVictory={setShowFullVictory}
          setDamageFlash={setDamageFlash}
          setVictoryTransition={setVictoryTransition}
          victoryTransition={victoryTransition}
          resetGameTrigger={resetGameTrigger}
        />
      </Canvas>

      {/* Damage Vignette Effect */}
      {damageFlash > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, rgba(220, 38, 38, ${Math.min(damageFlash * 0.4, 0.8)}) 80%)`,
            opacity: damageFlash
          }}
        />
      )}

      {/* Low Health Persistent Vignette */}
      {playerHealth < 30 && playerHealth > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, transparent 20%, rgba(139, 69, 19, ${0.3 + (30 - playerHealth) * 0.02}) 90%)`,
            opacity: 0.6 + (30 - playerHealth) * 0.02
          }}
        />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Health Bar and Score */}
        <div className="absolute top-4 right-4 space-y-3">
          {/* Score Display */}
          <div className="bg-black bg-opacity-70 p-3 rounded-lg">
            <div className="text-white text-sm font-bold mb-1 font-medieval">SCORE</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 font-medieval">{score}</div>
              <div className="text-xs text-gray-300 font-medieval">Enemy kills: {killCount}/5</div>
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="bg-black bg-opacity-70 p-3 rounded-lg">
            <div className="text-white text-sm font-bold mb-1 font-medieval">HEALTH</div>
            <div className="w-48 h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
              <div 
                className={`h-full transition-all duration-300 ${
                  playerHealth > 60 ? 'bg-green-500' : 
                  playerHealth > 30 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(0, playerHealth)}%` }}
              />
            </div>
            <div className="text-white text-xs mt-1 text-center font-medieval">{Math.round(playerHealth)}/100</div>
          </div>

        </div>

        {/* Crosshair */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-6 h-6 border-2 border-white rounded-full opacity-70">
            <div className="absolute top-1/2 left-1/2 w-2 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>

        {/* Small Victory Message */}
        {showVictoryMessage && !dragonDefeated && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-50">
            <div className="bg-green-900 bg-opacity-95 p-4 rounded-lg border-4 border-green-500 animate-pulse shadow-2xl">
              <h2 className="text-2xl font-bold text-green-300 mb-1 font-medieval-ornate">🐉 DRAGON SLAIN! 🐉</h2>
              <p className="text-lg text-white font-medieval">Victory is yours, brave archer!</p>
            </div>
          </div>
        )}

        {/* STAGE 1: Immediate Victory Notification (Top of Screen) */}
        {showVictoryMessage && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-8 py-4 rounded-lg shadow-lg border-4 border-yellow-300">
              <h1 className="text-4xl font-bold text-center tracking-wide font-medieval-ornate">VICTORY!</h1>
            </div>
          </div>
        )}

        {/* STAGE 2: Full Victory Screen (After 10 seconds) */}
        {showFullVictory && (
          <div className="absolute inset-0 bg-green-900 bg-opacity-90 flex items-center justify-center pointer-events-auto">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-6 text-green-300 font-medieval-ornate">DRAGON DEFEATED!</h1>
              <p className="text-xl mb-6 font-medieval">You have slain the mighty dragon and saved the realm!</p>
              <div className="text-4xl font-bold text-yellow-400 mb-8 font-medieval">Final Score: {score}</div>
              <button 
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl font-medieval"
                onClick={() => {
                  // Complete game state reset for play again
                  setShowVictoryMessage(false)
                  setShowFullVictory(false)
                  setDragonDefeated(false)
                  setDragonSpawned(false)
                  setShowDragonWarning(false)
                  setKillCount(0)
                  setScore(0)
                  setPlayerHealth(100)
                  setConfetti([])
                  setVictoryTransition(false)
                  setDamageFlash(0)
                  setDragon(null)
                  // Trigger game component reset
                  setResetGameTrigger(prev => prev + 1)
                }}
              >
                🏹 Play Again
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {playerHealth <= 0 && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-80 flex items-center justify-center pointer-events-auto">
            <div className="text-center text-white">
              <h1 className="text-6xl font-bold mb-4 text-red-300 font-medieval-ornate">GAME OVER</h1>
              <p className="text-xl mb-6 font-medieval">You have been defeated by the flying demons!</p>
              <div className="text-2xl font-bold text-yellow-400 mb-6 font-medieval">Final Score: {score}</div>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg font-medieval"
                onClick={() => window.location.reload()}
              >
                Restart Game
              </button>
            </div>
          </div>
        )}

        {/* Removed dramatic entrance warning - keeping only subtle dragon warning */}

        {/* Dragon Warning */}
        {showDragonWarning && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-50">
            <div className="bg-red-900 bg-opacity-95 p-4 rounded-lg border-4 border-red-500 animate-pulse shadow-2xl">
              <h2 className="text-3xl font-bold text-red-300 mb-1 font-medieval-ornate">🐉 DRAGON BOSS AWAKENED! 🐉</h2>
              <p className="text-lg text-white font-medieval">A mighty dragon has emerged to defend the realm!</p>
              {dragon && <p className="text-md text-yellow-400 mt-1 font-medieval">Health: {dragon.health}/5</p>}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isLocked && playerHealth > 0 && (
          <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 p-4 rounded">
            <p className="text-sm font-medieval">Click to lock cursor and start playing</p>
            <p className="text-xs mt-2 font-medieval">Left Click: Shoot Arrow</p>
            <p className="text-xs font-medieval">Right Click: Fire Rocket (2x damage!)</p>
            <p className="text-xs font-medieval">Mouse: Aim</p>
            <p className="text-xs font-medieval">WASD: Move</p>
            <p className="text-xs font-medieval">Spacebar: Jump</p>
            <p className="text-xs text-blue-400 font-medieval">Double-click + Hold Space: Booster Jump (1s max)</p>
            <p className="text-xs font-medieval">Hold Shift: Sprint</p>
            <p className="text-xs mt-2 font-medieval">Shoot the bomb crates and enemies!</p>
            <p className="text-xs text-yellow-400 mt-2 font-medieval">⚠️ Avoid enemies and explosions - they damage you!</p>
            <p className="text-xs text-red-400 mt-1 font-medieval">🎯 Kill 5 enemies to face the DRAGON BOSS!</p>
            <p className="text-xs text-green-400 mt-1 font-medieval">🏆 Defeat the dragon to WIN!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Game({ setIsLocked, playerHealth, setPlayerHealth, _score: _unusedScore, setScore, killCount, setKillCount, dragon, setDragon, dragonSpawned, setDragonSpawned, setShowDragonWarning, setDragonDefeated, setShowVictoryMessage, _setDragonEntering: _unusedSetDragonEntering, confetti, setConfetti, setShowFullVictory, setDamageFlash, setVictoryTransition, victoryTransition, resetGameTrigger }: { 
  setIsLocked: Dispatch<SetStateAction<boolean>>, 
  playerHealth: number, 
  setPlayerHealth: Dispatch<SetStateAction<number>>, 
  _score: number, 
  setScore: Dispatch<SetStateAction<number>>,
  killCount: number,
  setKillCount: Dispatch<SetStateAction<number>>,
  dragon: any,
  setDragon: Dispatch<SetStateAction<any>>,
  dragonSpawned: boolean,
  setDragonSpawned: Dispatch<SetStateAction<boolean>>,
  setShowDragonWarning: Dispatch<SetStateAction<boolean>>,
  setDragonDefeated: Dispatch<SetStateAction<boolean>>,
  setShowVictoryMessage: Dispatch<SetStateAction<boolean>>,
  _setDragonEntering: Dispatch<SetStateAction<boolean>>,
  confetti: any[],
  setConfetti: Dispatch<SetStateAction<any[]>>,
  setShowFullVictory: Dispatch<SetStateAction<boolean>>,
  setDamageFlash: Dispatch<SetStateAction<number>>,
  setVictoryTransition: Dispatch<SetStateAction<boolean>>,
  victoryTransition: boolean,
  resetGameTrigger: number
}) {
  const [arrows, setArrows] = useState<any[]>([])
  const [rockets, setRockets] = useState<any[]>([])
  const [fireProjectiles, setFireProjectiles] = useState<any[]>([])
  const [bowDrawn, setBowDrawn] = useState(false)
  const [bombs, setBombs] = useState<any[]>([])
  const [explosions, setExplosions] = useState<any[]>([])
  const [enemies, setEnemies] = useState<any[]>([])
  const [enemyPops, setEnemyPops] = useState<any[]>([])
  const [lastDamageTime, setLastDamageTime] = useState(0)
  const controlsRef = useRef<any>(null)

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

    // Function to check if spawn position collides with castle
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

    // Generate safe spawn positions for enemies
    const safeSpawnPositions = []
    const attemptPositions = [
      [-15, 0.5, -20], [15, 0.5, -20], [0, 0.5, -45],
      [-20, 0.5, -35], [20, 0.5, -35], [-25, 0.5, -50],
      [25, 0.5, -50], [0, 0.5, -60], [-10, 0.5, -55]
    ]
    
    for (const pos of attemptPositions) {
      if (!checkSpawnCollision(pos[0], pos[2]) && safeSpawnPositions.length < 5) {
        safeSpawnPositions.push(pos)
      }
    }
    
    // Ensure we have at least 5 enemies
    while (safeSpawnPositions.length < 5) {
      let validSpawn = false
      let attempts = 0
      while (!validSpawn && attempts < 20) {
        const x = (Math.random() - 0.5) * 80
        const z = -30 + (Math.random() - 0.5) * 60
        if (!checkSpawnCollision(x, z)) {
          safeSpawnPositions.push([x, 0.5, z])
          validSpawn = true
        }
        attempts++
      }
      if (!validSpawn) {
        // Fallback to safe default positions
        const fallbacks = [[30, 0.5, -60], [-30, 0.5, -60], [0, 0.5, -80]]
        safeSpawnPositions.push(fallbacks[safeSpawnPositions.length % fallbacks.length])
      }
    }

    const initialEnemies = safeSpawnPositions.slice(0, 5).map((pos, index) => ({
      id: index + 1,
      position: pos,
      active: true,
      targetPosition: pos,
      moveSpeed: 5 + Math.random() * 3,
      currentPosition: pos
    }))
    setEnemies(initialEnemies)
  }, [])

  // Reset game state when Play Again is clicked
  useEffect(() => {
    if (resetGameTrigger > 0) {
      // Reset all Game component states to initial values
      setArrows([])
      setRockets([])
      setFireProjectiles([])
      setBowDrawn(false)
      setExplosions([])
      setEnemyPops([])
      setLastDamageTime(0)
      
      // Reset bombs to initial state
      const initialBombs = [
        { id: 1, position: [8, 1.5, -10], active: true },
        { id: 2, position: [-6, 1.5, -8], active: true },
        { id: 3, position: [12, 1.5, -15], active: true },
        { id: 4, position: [-10, 1.5, -12], active: true },
        { id: 5, position: [0, 1.5, -20], active: true },
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
      
      // Reset enemies to initial positions
      const checkSpawnCollision = (x: number, z: number) => {
        const mainTowerDistance = Math.sqrt(x * x + (z + 30) * (z + 30))
        if (mainTowerDistance < 3.5) return true
        const leftTowerDistance = Math.sqrt((x + 6) * (x + 6) + (z + 30) * (z + 30))
        if (leftTowerDistance < 2.5) return true
        const rightTowerDistance = Math.sqrt((x - 6) * (x - 6) + (z + 30) * (z + 30))
        if (rightTowerDistance < 2.5) return true
        if (x >= -7.5 && x <= 7.5 && z >= -28 && z <= -26) return true
        return false
      }

      const safeSpawnPositions = []
      const attemptPositions = [
        [-15, 0.5, -20], [15, 0.5, -20], [0, 0.5, -45],
        [-20, 0.5, -35], [20, 0.5, -35], [-25, 0.5, -50],
        [25, 0.5, -50], [0, 0.5, -60], [-10, 0.5, -55]
      ]
      
      for (const pos of attemptPositions) {
        if (!checkSpawnCollision(pos[0], pos[2]) && safeSpawnPositions.length < 5) {
          safeSpawnPositions.push(pos)
        }
      }
      
      while (safeSpawnPositions.length < 5) {
        let validSpawn = false
        let attempts = 0
        while (!validSpawn && attempts < 20) {
          const x = (Math.random() - 0.5) * 80
          const z = -30 + (Math.random() - 0.5) * 60
          if (!checkSpawnCollision(x, z)) {
            safeSpawnPositions.push([x, 0.5, z])
            validSpawn = true
          }
          attempts++
        }
        if (!validSpawn) {
          const fallbacks = [[30, 0.5, -60], [-30, 0.5, -60], [0, 0.5, -80]]
          safeSpawnPositions.push(fallbacks[safeSpawnPositions.length % fallbacks.length])
        }
      }

      const initialEnemies = safeSpawnPositions.slice(0, 5).map((pos, index) => ({
        id: index + 1,
        position: pos,
        active: true,
        targetPosition: pos,
        moveSpeed: 5 + Math.random() * 3,
        currentPosition: pos
      }))
      setEnemies(initialEnemies)
      
      // Reset player position by resetting the controls
      if (controlsRef.current) {
        const camera = controlsRef.current.getObject()
        camera.position.set(0, 2, 5)
        camera.rotation.set(0, 0, 0)
      }
    }
  }, [resetGameTrigger])

  const handleShoot = useCallback(() => {
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

    setArrows((prev: any[]) => {
      // Limit max arrows for performance (keep only last 15)
      const newArrows = [...prev, newArrow]
      return newArrows.length > 15 ? newArrows.slice(-15) : newArrows
    })
    setBowDrawn(true)
    setTimeout(() => setBowDrawn(false), 200)
  }, [])

  // Damage player function with cooldown
  const damagePlayer = useCallback((damage: number) => {
    const now = Date.now()
    if (now - lastDamageTime > 1000) { // 1 second damage cooldown
      setPlayerHealth((prev: number) => Math.max(0, prev - damage))
      setLastDamageTime(now)
      
      // Trigger damage vignette effect
      setDamageFlash(1.0)
      setTimeout(() => setDamageFlash(0.6), 100)
      setTimeout(() => setDamageFlash(0.3), 300)
      setTimeout(() => setDamageFlash(0.1), 600)
      setTimeout(() => setDamageFlash(0), 1000)
    }
  }, [lastDamageTime, setPlayerHealth, setDamageFlash])

  // Check for collisions (arrows, enemies, explosions) - throttled for performance
  useEffect(() => {
    let lastCollisionCheck = 0
    const collisionInterval = 16 // ~60fps collision checking
    
    const checkCollisions = () => {
      const now = Date.now()
      if (now - lastCollisionCheck < collisionInterval) return
      lastCollisionCheck = now
      const playerPosition = controlsRef.current?.getObject()?.position
      
      // Check enemy-player collisions
      if (playerPosition) {
        enemies.forEach((enemy) => {
          if (enemy.active) {
            const enemyPos = enemy.currentPosition || enemy.position
            // Optimized distance calculation - avoid creating Vector3
            const dx = playerPosition.x - enemyPos[0]
            const dy = playerPosition.y - enemyPos[1]
            const dz = playerPosition.z - enemyPos[2]
            const distanceSq = dx * dx + dy * dy + dz * dz
            
            if (distanceSq < 1.44) { // 1.2 squared - Enemy collision radius
              damagePlayer(10) // 10 damage per hit
            }
          }
        })

        // Check fire projectile-player collisions
        fireProjectiles.forEach((fire) => {
          const firePos = fire.position.clone ? fire.position : fire.position
          // Optimized distance calculation
          const dx = playerPosition.x - (firePos.x || firePos[0])
          const dy = playerPosition.y - (firePos.y || firePos[1])
          const dz = playerPosition.z - (firePos.z || firePos[2])
          const distanceSq = dx * dx + dy * dy + dz * dz
          
          if (distanceSq < 1.0) { // 1.0 squared - Fire projectile collision radius
            damagePlayer(fire.damage) // Use the fire projectile's damage value
            
            // Create explosion effect at impact
            setExplosions((prev: any[]) => [
              ...prev,
              {
                id: Date.now(),
                position: [firePos.x, firePos.y, firePos.z],
                createdAt: Date.now(),
              },
            ])
            
            // Remove the fire projectile
            setFireProjectiles((prev: any[]) => prev.filter((f) => f.id !== fire.id))
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
              setExplosions((prev: any[]) => [
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
                    setEnemyPops((prev: any[]) => [
                      ...prev,
                      {
                        id: Date.now() + enemy.id,
                        position: enemy.currentPosition || enemy.position,
                        createdAt: Date.now(),
                      },
                    ])

                    // Deactivate enemy and increment score and kill count
                    setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))
                    setScore((prev: number) => prev + 1)
                    setKillCount((prev: number) => prev + 1)

                    // Respawn enemy after 10 seconds at a random castle position
                    setTimeout(() => {
                      // Find a valid spawn position that doesn't collide with castle
                      let spawnX: number, spawnZ: number
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
                      
                      setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { 
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
              setBombs((prev: any[]) => prev.map((b) => (b.id === bomb.id ? { ...b, active: false } : b)))

              // Remove arrow
              setArrows((prev: any[]) => prev.filter((a) => a.id !== arrow.id))

              // Regenerate bomb after 15 seconds
              setTimeout(() => {
                setBombs((prev: any[]) => prev.map((b) => (b.id === bomb.id ? { ...b, active: true } : b)))
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
              setEnemyPops((prev: any[]) => [
                ...prev,
                {
                  id: Date.now(),
                  position: enemy.currentPosition || enemy.position,
                  createdAt: Date.now(),
                },
              ])

              // Deactivate enemy and increment score and kill count
              setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))
              setScore((prev: number) => prev + 1)
              setKillCount((prev: number) => prev + 1)

              // Remove arrow
              setArrows((prev: any[]) => prev.filter((a) => a.id !== arrow.id))

              // Respawn enemy after 10 seconds at a random castle position
              setTimeout(() => {
                // Find a valid spawn position that doesn't collide with castle
                let spawnX: number, spawnZ: number
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
                
                setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { 
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
            setExplosions((prev: any[]) => [
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
              // Dragon defeated - DRAMATIC DEATH!
              const dragonPos = dragon.currentPosition || dragon.position
              
              // Multiple massive explosions at dragon location
              setExplosions((prev: any[]) => [
                ...prev,
                // Main dragon explosion
                {
                  id: Date.now() + 1,
                  position: dragonPos,
                  createdAt: Date.now(),
                },
                // Secondary explosions around dragon
                {
                  id: Date.now() + 2,
                  position: [dragonPos[0] + 5, dragonPos[1], dragonPos[2]],
                  createdAt: Date.now() + 100,
                },
                {
                  id: Date.now() + 3,
                  position: [dragonPos[0] - 5, dragonPos[1], dragonPos[2]],
                  createdAt: Date.now() + 200,
                },
                {
                  id: Date.now() + 4,
                  position: [dragonPos[0], dragonPos[1] + 5, dragonPos[2]],
                  createdAt: Date.now() + 300,
                },
                {
                  id: Date.now() + 5,
                  position: [dragonPos[0], dragonPos[1], dragonPos[2] + 5],
                  createdAt: Date.now() + 400,
                },
              ])

              // Massive dramatic dragon death effect (this is old code that should be removed)

              // Kill ALL remaining enemies simultaneously
              enemies.forEach((enemy) => {
                if (enemy.active) {
                  setEnemyPops((prev: any[]) => [
                    ...prev,
                    {
                      id: Date.now() + enemy.id * 100,
                      position: enemy.currentPosition || enemy.position,
                      createdAt: Date.now() + (enemy.id * 200), // Stagger slightly for visual effect
                    },
                  ])
                }
              })
              
              // Deactivate all enemies
              setEnemies((prev: any[]) => prev.map(e => ({ ...e, active: false })))
              
              // Instant confetti explosion and remove dragon immediately
              const dragonPosition = dragon.currentPosition || [0, 15, -60]
              
              // Create confetti explosion
              setConfetti((prev: any[]) => [
                ...prev,
                ...Array.from({ length: 20 }, (_, i) => ({
                  id: Date.now() + i,
                  position: [
                    dragonPosition[0] + (Math.random() - 0.5) * 4,
                    dragonPosition[1] + (Math.random() - 0.5) * 4,
                    dragonPosition[2] + (Math.random() - 0.5) * 4
                  ],
                  velocity: [
                    (Math.random() - 0.5) * 8,
                    Math.random() * 6 + 2,
                    (Math.random() - 0.5) * 8
                  ],
                  color: ['#FF69B4', '#00FF00', '#FFD700', '#FF4500', '#9370DB'][Math.floor(Math.random() * 5)],
                  createdAt: Date.now()
                }))
              ])
              
              // Remove dragon immediately and start two-stage victory
              setDragon(null)
              setScore((prev: number) => prev + 10) // Big score bonus for dragon
              
              // STAGE 1: Immediate victory notification (non-blocking)
              setShowVictoryMessage(true)
              setDragonDefeated(true)
              
              // Start 5-second sky transition to peaceful daytime
              setVictoryTransition(true)
              
              // STAGE 2: Full victory screen after exactly 10 seconds
              setTimeout(() => {
                setShowFullVictory(true)
              }, 10000)
              
            } else {
              setDragon((prev: any) => ({ ...prev, health: newHealth }))
            }

            // Remove arrow
            setArrows((prev: any[]) => prev.filter((a) => a.id !== arrow.id))
          }
        }
      })
      
      // Check rocket collisions (similar to arrows but more powerful)
      rockets.forEach((rocket) => {
        bombs.forEach((bomb) => {
          if (bomb.active) {
            const distance = new THREE.Vector3(...bomb.position).distanceTo(rocket.position)

            if (distance < 1.5) { // Rockets have larger hit radius
              // Create bigger explosion
              const explosionPos = bomb.position
              setExplosions((prev: any[]) => [
                ...prev,
                {
                  id: Date.now(),
                  position: explosionPos,
                  createdAt: Date.now(),
                },
              ])

              // Rocket explosions are more powerful
              if (playerPosition) {
                const explosionVec = new THREE.Vector3(...explosionPos)
                const playerDistance = playerPosition.distanceTo(explosionVec)
                
                if (playerDistance < 10.0) { // Larger blast radius
                  const damage = Math.max(8, 40 - playerDistance * 3) // More damage
                  damagePlayer(damage)
                }
              }

              // Rockets kill enemies in larger radius
              enemies.forEach((enemy) => {
                if (enemy.active) {
                  const enemyPos = new THREE.Vector3(...(enemy.currentPosition || enemy.position))
                  const explosionVec = new THREE.Vector3(...explosionPos)
                  const explosionDistance = enemyPos.distanceTo(explosionVec)
                  
                  if (explosionDistance < 8.0) { // Larger explosion radius
                    setEnemyPops((prev: any[]) => [
                      ...prev,
                      {
                        id: Date.now() + enemy.id,
                        position: enemy.currentPosition || enemy.position,
                        createdAt: Date.now(),
                      },
                    ])

                    setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))
                    setScore((prev: number) => prev + 1)
                    setKillCount((prev: number) => prev + 1)

                    // Respawn enemy after 10 seconds
                    setTimeout(() => {
                      let spawnX: number, spawnZ: number
                      let validSpawn = false
                      let attempts = 0
                      
                      const checkSpawnCollision = (x: number, z: number) => {
                        const mainTowerDistance = Math.sqrt(x * x + (z + 30) * (z + 30))
                        if (mainTowerDistance < 3.5) return true
                        const leftTowerDistance = Math.sqrt((x + 6) * (x + 6) + (z + 30) * (z + 30))
                        if (leftTowerDistance < 2.5) return true
                        const rightTowerDistance = Math.sqrt((x - 6) * (x - 6) + (z + 30) * (z + 30))
                        if (rightTowerDistance < 2.5) return true
                        if (x >= -7.5 && x <= 7.5 && z >= -28 && z <= -26) return true
                        return false
                      }
                      
                      while (!validSpawn && attempts < 20) {
                        spawnX = (Math.random() - 0.5) * 80
                        spawnZ = -30 + (Math.random() - 0.5) * 60
                        if (!checkSpawnCollision(spawnX, spawnZ)) {
                          validSpawn = true
                        }
                        attempts++
                      }
                      
                      if (!validSpawn) {
                        spawnX = (Math.random() - 0.5) * 20 > 0 ? 15 : -15
                        spawnZ = -45
                      }
                      
                      setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { 
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

              setBombs((prev: any[]) => prev.map((b) => (b.id === bomb.id ? { ...b, active: false } : b)))
              setRockets((prev: any[]) => prev.filter((r) => r.id !== rocket.id))

              setTimeout(() => {
                setBombs((prev: any[]) => prev.map((b) => (b.id === bomb.id ? { ...b, active: true } : b)))
              }, 15000)
            }
          }
        })

        // Rocket vs enemy collisions
        enemies.forEach((enemy) => {
          if (enemy.active) {
            const enemyPos = new THREE.Vector3(...(enemy.currentPosition || enemy.position))
            const distance = enemyPos.distanceTo(rocket.position)

            if (distance < 1.2) { // Rockets are easier to hit with
              setEnemyPops((prev: any[]) => [
                ...prev,
                {
                  id: Date.now() + enemy.id,
                  position: enemy.currentPosition || enemy.position,
                  createdAt: Date.now(),
                },
              ])

              setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { ...e, active: false } : e)))
              setScore((prev: number) => prev + 2) // More points for rocket kills
              setKillCount((prev: number) => prev + 1)
              setRockets((prev: any[]) => prev.filter((r) => r.id !== rocket.id))

              // Respawn enemy
              setTimeout(() => {
                let spawnX: number, spawnZ: number
                let validSpawn = false
                let attempts = 0
                
                const checkSpawnCollision = (x: number, z: number) => {
                  const mainTowerDistance = Math.sqrt(x * x + (z + 30) * (z + 30))
                  if (mainTowerDistance < 3.5) return true
                  const leftTowerDistance = Math.sqrt((x + 6) * (x + 6) + (z + 30) * (z + 30))
                  if (leftTowerDistance < 2.5) return true
                  const rightTowerDistance = Math.sqrt((x - 6) * (x - 6) + (z + 30) * (z + 30))
                  if (rightTowerDistance < 2.5) return true
                  if (x >= -7.5 && x <= 7.5 && z >= -28 && z <= -26) return true
                  return false
                }
                
                while (!validSpawn && attempts < 20) {
                  spawnX = (Math.random() - 0.5) * 80
                  spawnZ = -30 + (Math.random() - 0.5) * 60
                  if (!checkSpawnCollision(spawnX, spawnZ)) {
                    validSpawn = true
                  }
                  attempts++
                }
                
                if (!validSpawn) {
                  spawnX = (Math.random() - 0.5) * 20 > 0 ? 15 : -15
                  spawnZ = -45
                }
                
                setEnemies((prev: any[]) => prev.map((e) => (e.id === enemy.id ? { 
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

        // Rocket vs dragon collisions
        if (dragon && dragon.active) {
          const dragonPos = new THREE.Vector3(...(dragon.currentPosition || dragon.position))
          const distance = dragonPos.distanceTo(rocket.position)

          if (distance < 3.0) { // Rockets are easier to hit dragon with
            // Multiple explosions for rocket hit
            setExplosions((prev: any[]) => [
              ...prev,
              {
                id: Date.now(),
                position: dragon.currentPosition || dragon.position,
                createdAt: Date.now(),
              },
              {
                id: Date.now() + 1,
                position: [dragon.currentPosition[0] + 2, dragon.currentPosition[1], dragon.currentPosition[2]],
                createdAt: Date.now() + 50,
              },
            ])

            // Rockets do 2 damage to dragon
            const newHealth = dragon.health - 2
            if (newHealth <= 0) {
              // Dragon defeated by rocket - EXTRA DRAMATIC!
              const dragonPos = dragon.currentPosition || dragon.position
              
              // Even more explosions for rocket kill
              setExplosions((prev: any[]) => [
                ...prev,
                ...Array.from({ length: 8 }, (_, i) => ({
                  id: Date.now() + i * 10,
                  position: [
                    dragonPos[0] + (Math.random() - 0.5) * 10,
                    dragonPos[1] + (Math.random() - 0.5) * 6,
                    dragonPos[2] + (Math.random() - 0.5) * 10
                  ],
                  createdAt: Date.now() + i * 100,
                }))
              ])

              setEnemyPops((prev: any[]) => [
                ...prev,
                {
                  id: Date.now(),
                  position: dragonPos,
                  createdAt: Date.now(),
                },
              ])

              enemies.forEach((enemy) => {
                if (enemy.active) {
                  setEnemyPops((prev: any[]) => [
                    ...prev,
                    {
                      id: Date.now() + enemy.id * 100,
                      position: enemy.currentPosition || enemy.position,
                      createdAt: Date.now() + (enemy.id * 200),
                    },
                  ])
                }
              })
              
              setEnemies((prev: any[]) => prev.map(e => ({ ...e, active: false })))
              
              // Instant confetti explosion and remove dragon immediately
              const dragonPosition = dragon.currentPosition || [0, 15, -60]
              
              // Create confetti explosion
              setConfetti((prev: any[]) => [
                ...prev,
                ...Array.from({ length: 25 }, (_, i) => ({
                  id: Date.now() + i,
                  position: [
                    dragonPosition[0] + (Math.random() - 0.5) * 4,
                    dragonPosition[1] + (Math.random() - 0.5) * 4,
                    dragonPosition[2] + (Math.random() - 0.5) * 4
                  ],
                  velocity: [
                    (Math.random() - 0.5) * 10,
                    Math.random() * 8 + 2,
                    (Math.random() - 0.5) * 10
                  ],
                  color: ['#FF69B4', '#00FF00', '#FFD700', '#FF4500', '#9370DB'][Math.floor(Math.random() * 5)],
                  createdAt: Date.now()
                }))
              ])
              
              // Remove dragon immediately and show victory
              setDragon(null)
              setScore((prev: number) => prev + 20) // Bigger bonus for rocket dragon kill
              
              // STAGE 1: Immediate victory notification (non-blocking)
              setShowVictoryMessage(true)
              setDragonDefeated(true)
              
              // Start 5-second sky transition to peaceful daytime
              setVictoryTransition(true)
              
              // STAGE 2: Full victory screen after exactly 10 seconds
              setTimeout(() => {
                setShowFullVictory(true)
              }, 10000)
              
            } else {
              setDragon((prev: any) => ({ ...prev, health: newHealth }))
            }

            setRockets((prev: any[]) => prev.filter((r) => r.id !== rocket.id))
          }
        }
      })
    }

    checkCollisions()
  }, [arrows, rockets, fireProjectiles, bombs, enemies, dragon, playerHealth, lastDamageTime, damagePlayer, setDragon, setKillCount, setScore, setShowVictoryMessage])

  // Clean up old explosions and enemy pops
  useEffect(() => {
    const explosionDuration = 1500 // 1.5 seconds for better performance
    const popDuration = 3000 // 3 seconds for dramatic effect
    
    const interval = setInterval(() => {
      const now = Date.now()
      setExplosions((prev: any[]) => prev.filter((explosion) => now - explosion.createdAt < explosionDuration))
      setEnemyPops((prev: any[]) => prev.filter((pop) => now - pop.createdAt < popDuration))
      setConfetti((prev: any[]) => prev.filter((piece) => now - piece.createdAt < 8000)) // Confetti lasts 8 seconds
    }, 500) // Optimized cleanup frequency

    return () => clearInterval(interval)
  }, [])

  // Dragon entrance sequence after 5 kills (simplified)
  useEffect(() => {
    if (killCount >= 5 && !dragonSpawned) {
      setDragonSpawned(true)
      
      // Show subtle dragon warning and spawn immediately
      setShowDragonWarning(true)
      
      // Spawn dragon dramatically from high above
      setDragon({
        id: 'dragon',
        position: [0, 50, -60], // Start much higher for dramatic entrance
        health: 5,
        active: true,
        attackTimer: 0,
        currentPosition: [0, 50, -60],
        targetPosition: [0, 15, -60], // Will descend to normal height
        phase: 'entering' // new phase for entrance
      })
      
      // Add dramatic entrance explosions
      setExplosions((prev: any[]) => [
        ...prev,
        {
          id: Date.now() + 1000,
          position: [0, 45, -60],
          createdAt: Date.now(),
        },
        {
          id: Date.now() + 1001,
          position: [-10, 40, -55],
          createdAt: Date.now() + 500,
        },
        {
          id: Date.now() + 1002,
          position: [10, 40, -55],
          createdAt: Date.now() + 1000,
        },
      ])
      
      // Hide dragon warning after entrance is complete (after 4 seconds)
      setTimeout(() => {
        setShowDragonWarning(false)
      }, 4000)
      
      // Transition dragon from entering to circling phase (after 3 seconds)
      setTimeout(() => {
        setDragon((prev: any) => prev ? { ...prev, phase: 'circling' } : null)
      }, 3000)
    }
  }, [killCount, dragonSpawned, setDragon, setDragonSpawned, setShowDragonWarning])

  const handleRocketShoot = () => {
    if (!controlsRef.current) return

    const camera = controlsRef.current.getObject()
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(camera.quaternion)

    // Spawn rocket from crossbow position
    const crossbowOffset = new THREE.Vector3(0.4, -0.1, -0.3)
    crossbowOffset.applyQuaternion(camera.quaternion)
    const frontOffset = direction.clone().multiplyScalar(0.7)
    const startPosition = camera.position.clone().add(crossbowOffset).add(frontOffset)

    const newRocket = {
      id: Date.now(),
      position: startPosition,
      velocity: direction.multiplyScalar(80), // Super fast!
      life: 50
    }

    setRockets((prev: any[]) => [...prev, newRocket])
    setBowDrawn(true)
    setTimeout(() => setBowDrawn(false), 100)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        handleShoot()
      }
    }
    
    const handleRightClick = (e: MouseEvent) => {
      if (e.button === 2) { // Right click
        e.preventDefault()
        handleRocketShoot()
      }
    }
    
    const handleLock = () => setIsLocked(true)
    const handleUnlock = () => setIsLocked(false)

    document.addEventListener("mousedown", handleClick)
    document.addEventListener("mousedown", handleRightClick)
    document.addEventListener("contextmenu", (e) => e.preventDefault()) // Disable right-click menu
    document.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement) {
        handleLock()
      } else {
        handleUnlock()
      }
    })

    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("mousedown", handleRightClick)
      document.removeEventListener("contextmenu", (e) => e.preventDefault())
      document.removeEventListener("pointerlockchange", handleLock)
    }
  }, [setIsLocked])

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      
      {/* CINEMATIC LIGHTING SETUP */}
      {/* Atmospheric ambience with subtle blue tint */}
      <ambientLight intensity={0.2} color="#B3D9FF" />
      
      {/* Golden Hour Main Light - warm dramatic lighting */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.2}
        color="#FFB366"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Rim Lighting - cool blue backlight for depth */}
      <directionalLight
        position={[-10, 8, -5]}
        intensity={0.8}
        color="#4A90E2"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      {/* Atmospheric Fog for volumetric feel */}
      <fog attach="fog" args={['#87CEEB', 20, 200]} />

      {/* Dynamic Sky with Victory Transition */}
      <DynamicSky 
        dragon={dragon}
        victoryTransition={victoryTransition}
      />

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
            setEnemies((prev: any[]) => prev.map(e => 
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
            setDragon((prev: any) => prev ? { ...prev, currentPosition: newPosition } : null)
          }}
          onFireAttack={(fireProjectile) => {
            setFireProjectiles((prev: any[]) => {
              // Limit max fire projectiles for performance (keep only last 20)
              const newProjectiles = [...prev, fireProjectile]
              return newProjectiles.length > 20 ? newProjectiles.slice(-20) : newProjectiles
            })
          }}
        />
      )}

      {/* Render explosions */}
      {explosions.map((explosion) => (
        <Explosion key={explosion.id} position={explosion.position} />
      ))}

      {/* Render confetti */}
      {confetti.map((piece) => (
        <ConfettiPiece key={piece.id} piece={piece} />
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
            setArrows((prev: any[]) => prev.map((a) => (a.id === arrow.id ? updatedArrow : a)))
          }}
          onRemove={() => {
            setArrows((prev: any[]) => prev.filter((a) => a.id !== arrow.id))
          }}
        />
      ))}

      {/* Render rockets */}
      {rockets.map((rocket) => (
        <Rocket
          key={rocket.id}
          rocket={rocket}
          onUpdate={(updatedRocket) => {
            setRockets((prev: any[]) => prev.map((r) => (r.id === rocket.id ? updatedRocket : r)))
          }}
          onRemove={() => {
            setRockets((prev: any[]) => prev.filter((r) => r.id !== rocket.id))
          }}
        />
      ))}

      {/* Render fire projectiles */}
      {fireProjectiles.map((fire) => (
        <FireProjectile
          key={fire.id}
          fire={fire}
          playerPosition={controlsRef.current?.getObject()?.position}
          onUpdate={(updatedFire) => {
            setFireProjectiles((prev: any[]) => prev.map((f) => (f.id === fire.id ? updatedFire : f)))
          }}
          onRemove={() => {
            setFireProjectiles((prev: any[]) => prev.filter((f) => f.id !== fire.id))
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
  useFrame((_state, delta) => {
    if (explosionRef.current) {
      // Grow and fade out
      setScale((prev: number) => Math.min(prev + delta * 5, 4))
      setOpacity((prev: number) => Math.max(prev - delta * 0.8, 0))

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
  const direction = useRef(new THREE.Vector3())
  const keys = useRef<Record<string, boolean>>({})
  const isJumping = useRef(false)
  const jumpVelocity = useRef(0)
  const lastSpacePress = useRef(0)
  const spaceClickCount = useRef(0)
  const isBoosterActive = useRef(false)
  const boosterStartTime = useRef(0) // Track when booster started
  const maxBoosterDuration = 1000 // 1 second in milliseconds
  const secondClickHeld = useRef(false) // Track if second click is being held

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      
      // Booster jump detection - double click spacebar
      if (e.code === "Space") {
        const currentTime = Date.now()
        const timeSinceLastPress = currentTime - lastSpacePress.current
        
        // Reset click count if too much time has passed
        if (timeSinceLastPress > 500) {
          spaceClickCount.current = 0
        }
        
        spaceClickCount.current++
        lastSpacePress.current = currentTime
        
        // Second click within 300ms - activate booster
        if (spaceClickCount.current === 2 && timeSinceLastPress < 300 && timeSinceLastPress > 50) {
          if (!isBoosterActive.current) {
            isBoosterActive.current = true
            boosterStartTime.current = currentTime
            secondClickHeld.current = true
            spaceClickCount.current = 0 // Reset for next double-click
          }
        }
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
      
      // Deactivate booster when second spacebar click is released
      if (e.code === "Space") {
        secondClickHeld.current = false
        // Only deactivate if we're currently boosting
        if (isBoosterActive.current) {
          isBoosterActive.current = false
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  useFrame((_state, delta) => {
    const speed = 5
    const jumpForce = 8
    const gravity = -20
    const boosterForce = 15
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

    // Booster Jump Logic - Time-based (max 1 second) and hold-based
    if (isBoosterActive.current) {
      const currentTime = Date.now()
      const timeSinceStart = currentTime - boosterStartTime.current
      
      // Check if max duration exceeded or spacebar released
      if (timeSinceStart >= maxBoosterDuration || !secondClickHeld.current) {
        isBoosterActive.current = false
        secondClickHeld.current = false
        // Immediately apply gravity to stop upward motion
        jumpVelocity.current = Math.min(jumpVelocity.current, 0) // Stop upward motion completely
      } else {
        // Apply upward boost force
        jumpVelocity.current = boosterForce
        isJumping.current = true
      }
    }
    // Regular Jumping (only when not boosting)
    else if (keys.current["Space"] && !isJumping.current && camera.position.y <= 2.1 && !isBoosterActive.current) {
      isJumping.current = true
      jumpVelocity.current = jumpForce
    }

    // Apply jump/booster physics
    if (isJumping.current) {
      camera.position.y += jumpVelocity.current * delta
      
      // Apply gravity only when not actively boosting
      if (!isBoosterActive.current) {
        jumpVelocity.current += gravity * delta
      }


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

  useFrame((_state, delta) => {
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

      {/* Central bow riser - reinforced frame */}
      <mesh position={[0, 0.02, 0.4]}>
        <boxGeometry args={[0.15, 0.08, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Left bow limb - curved and substantial */}
      <group position={[-0.075, 0.02, 0.4]}>
        {/* Main limb shaft */}
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.3, 0.03, 0.04]} />
          <meshStandardMaterial color="#8B4513" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Limb tip curve */}
        <mesh position={[-0.28, 0.04, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.08, 0.025, 0.04]} />
          <meshStandardMaterial color="#654321" roughness={0.4} metalness={0.1} />
        </mesh>
      </group>

      {/* Right bow limb - mirrored */}
      <group position={[0.075, 0.02, 0.4]}>
        {/* Main limb shaft */}
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.3, 0.03, 0.04]} />
          <meshStandardMaterial color="#8B4513" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Limb tip curve */}
        <mesh position={[0.28, 0.04, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.08, 0.025, 0.04]} />
          <meshStandardMaterial color="#654321" roughness={0.4} metalness={0.1} />
        </mesh>
      </group>

      {/* Limb reinforcement bands */}
      <mesh position={[-0.2, 0.02, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.02, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* String nocks at limb tips */}
      <mesh position={[-0.32, 0.055, 0.4]}>
        <sphereGeometry args={[0.015]} />
        <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0.32, 0.055, 0.4]}>
        <sphereGeometry args={[0.015]} />
        <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Crossbow string connecting limb tips */}
      <mesh position={[0, 0.055, drawn ? 0.37 : 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.64]} />
        <meshStandardMaterial 
          color="#dddddd" 
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      
      {/* String center serving (where arrow sits) */}
      <mesh position={[0, 0.055, drawn ? 0.37 : 0.4]}>
        <cylinderGeometry args={[0.005, 0.005, 0.03]} />
        <meshStandardMaterial color="#444444" roughness={0.3} />
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

  useFrame((_state, delta) => {
    // Create new arrow state (immutable updates)
    const newVelocity = arrow.velocity.clone()
    newVelocity.y += gravity * delta

    const newPosition = arrow.position.clone()
    newPosition.add(newVelocity.clone().multiplyScalar(delta))

    // Update trail (limit to 8 points for performance)
    const newTrail = [...arrow.trail, newPosition.clone()]
    if (newTrail.length > 8) {
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

function Rocket({ rocket, onUpdate, onRemove }: { rocket: any; onUpdate: (rocket: any) => void; onRemove: () => void }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    // Update rocket position - no gravity, just fast travel
    const newPosition = rocket.position.clone()
    newPosition.add(rocket.velocity.clone().multiplyScalar(delta))

    // Update rocket group position and rotation
    if (groupRef.current && rocket.velocity.length() > 0) {
      groupRef.current.position.copy(newPosition)

      // Point rocket in direction of travel
      const direction = rocket.velocity.clone().normalize()
      const up = new THREE.Vector3(0, 1, 0)
      const quaternion = new THREE.Quaternion()

      const matrix = new THREE.Matrix4()
      matrix.lookAt(new THREE.Vector3(0, 0, 0), direction, up)
      quaternion.setFromRotationMatrix(matrix)

      groupRef.current.quaternion.copy(quaternion)
    }

    // Decrease life and remove if expired or hit ground
    const newLife = rocket.life - 1
    if (newLife <= 0 || newPosition.y < 0 || newPosition.length() > 200) {
      onRemove()
      return
    }

    // Update with new state
    onUpdate({
      ...rocket,
      position: newPosition,
      life: newLife,
    })
  })

  return (
    <group ref={groupRef}>
      {/* Rocket Body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.5]} />
        <meshStandardMaterial color="#FF4500" emissive="#FF4500" emissiveIntensity={0.3} />
      </mesh>

      {/* Rocket Tip */}
      <mesh position={[0, 0, -0.75]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.3]} />
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
      </mesh>

      {/* Rocket Fins */}
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.2, 0.01, 0.3]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.2, 0.01, 0.3]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>
      <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.01, 0.2, 0.3]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>
      <mesh position={[0, 0, 0.6]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.01, 0.2, 0.3]} />
        <meshStandardMaterial color="#8B0000" />
      </mesh>

      {/* Rocket Exhaust Light */}
      <pointLight position={[0, 0, 1]} intensity={2} distance={5} color="#FF4500" />
      
      {/* Rocket Trail Glow */}
      <mesh position={[0, 0, 1.2]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial 
          color="#FF4500" 
          emissive="#FF4500" 
          emissiveIntensity={0.8} 
          transparent 
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}

function FireProjectile({ fire, onUpdate, onRemove, playerPosition }: { fire: any; onUpdate: (fire: any) => void; onRemove: () => void; playerPosition?: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    // Update fire projectile position with optional tracking
    const newPosition = fire.position.clone ? fire.position.clone() : new THREE.Vector3(...fire.position)
    let velocity = new THREE.Vector3(...fire.velocity)
    
    // If tracking is enabled and we have player position, adjust velocity slightly
    if (fire.isTracking && playerPosition && fire.trackingStrength) {
      const directionToPlayer = new THREE.Vector3()
      directionToPlayer.subVectors(playerPosition, newPosition)
      directionToPlayer.normalize()
      
      // Blend current velocity with direction to player
      const trackingForce = directionToPlayer.multiplyScalar(fire.trackingStrength)
      velocity.add(trackingForce)
      velocity.normalize().multiplyScalar(15) // Maintain consistent speed
    }
    
    newPosition.add(velocity.clone().multiplyScalar(delta))

    // Update age
    const newAge = fire.age + delta

    // Remove after 5 seconds or if it hits the ground
    if (newAge > 5 || newPosition.y < 0) {
      onRemove()
      return
    }

    // Update fire projectile group position
    if (groupRef.current) {
      groupRef.current.position.copy(newPosition)
    }

    // Update the fire state with new velocity
    onUpdate({
      ...fire,
      position: newPosition,
      velocity: [velocity.x, velocity.y, velocity.z],
      age: newAge
    })
  })

  return (
    <group ref={groupRef} position={fire.position}>
      {/* Fire ball core */}
      <mesh scale={[0.3, 0.3, 0.3]}>
        <primitive object={GEOMETRIES.sphere} attach="geometry" />
        <meshStandardMaterial 
          color="#FF4500" 
          emissive="#FF4500"
          emissiveIntensity={1.0}
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Fire glow effect */}
      <mesh scale={[0.45, 0.45, 0.45]}>
        <primitive object={GEOMETRIES.sphere} attach="geometry" />
        <meshStandardMaterial 
          color="#FFD700" 
          emissive="#FFD700"
          emissiveIntensity={0.5}
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Fire light */}
      <pointLight 
        intensity={5} 
        distance={10} 
        color="#FF4500" 
        decay={2} 
      />
    </group>
  )
}

function ConfettiPiece({ piece }: { piece: any }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [currentPosition, setCurrentPosition] = useState(piece.position)
  const [currentVelocity, setCurrentVelocity] = useState(piece.velocity)

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Update confetti physics less frequently for performance
      if (state.clock.elapsedTime % 2 < delta) { // Update every 2nd frame
        const slowMotionFactor = 0.3 // Slow motion effect
        const newVelocity = [...currentVelocity]
        newVelocity[1] -= 9.8 * delta * 2 * slowMotionFactor // Adjust for frame skipping

        const newPosition = [
          currentPosition[0] + newVelocity[0] * delta * 2 * slowMotionFactor,
          currentPosition[1] + newVelocity[1] * delta * 2 * slowMotionFactor,
          currentPosition[2] + newVelocity[2] * delta * 2 * slowMotionFactor
        ]

        // Simple bounce when hitting ground (also slowed)
        if (newPosition[1] <= 0) {
          newPosition[1] = 0
          newVelocity[1] = Math.abs(newVelocity[1]) * 0.4 // Slightly higher bounce for slow motion
          newVelocity[0] *= 0.9 // Less friction for better slow motion effect
          newVelocity[2] *= 0.9 // Less friction for better slow motion effect
        }

        setCurrentPosition(newPosition)
        setCurrentVelocity(newVelocity)

        // Update mesh position
        meshRef.current.position.set(newPosition[0], newPosition[1], newPosition[2])
      }
      
      // Add slower rotation for dreamy effect (outside frame skip)
      meshRef.current.rotation.x += delta * 2
      meshRef.current.rotation.y += delta * 1.5
    }
  })

  return (
    <mesh ref={meshRef} position={currentPosition as [number, number, number]}>
      <boxGeometry args={[0.1, 0.1, 0.02]} />
      <meshStandardMaterial 
        color={piece.color}
        emissive={piece.color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function MedievalEnvironment() {
  return (
    <>
      <Ground />
      <Forest />
      <Castle />
      <Mountains />
      <AtmosphericParticles />
    </>
  )
}

function AtmosphericParticles() {
  const particleCount = 50
  const particles = useMemo(() => {
    const particleData: { position: [number, number, number], velocity: [number, number, number], size: number }[] = []
    
    for (let i = 0; i < particleCount; i++) {
      particleData.push({
        position: [
          (Math.random() - 0.5) * 100,
          Math.random() * 15 + 2,
          (Math.random() - 0.5) * 100
        ],
        velocity: [
          (Math.random() - 0.5) * 0.2,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.2
        ],
        size: 0.05 + Math.random() * 0.1
      })
    }
    return particleData
  }, [])

  useFrame((_state, delta) => {
    particles.forEach((particle) => {
      // Gentle floating motion
      particle.position[0] += particle.velocity[0] * delta
      particle.position[1] += particle.velocity[1] * delta
      particle.position[2] += particle.velocity[2] * delta
      
      // Reset particles that float too high or too far
      if (particle.position[1] > 20) {
        particle.position[1] = 2
      }
      if (Math.abs(particle.position[0]) > 50) {
        particle.position[0] = (Math.random() - 0.5) * 100
      }
      if (Math.abs(particle.position[2]) > 50) {
        particle.position[2] = (Math.random() - 0.5) * 100
      }
    })
  })

  return (
    <>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.size]} />
          <meshStandardMaterial 
            color="#FFD700"
            emissive="#FFB366"
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </>
  )
}

function Ground() {
  const groundMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#2F5F2F", // Richer, more cinematic forest green
      roughness: 0.9,
      metalness: 0.05,
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
  const treeRef = useRef<THREE.Group>(null)
  
  // Use useMemo to ensure tree dimensions are calculated once and remain stable
  const treeData = useMemo(() => {
    const height = 4 + Math.random() * 4 // 4-8 units height
    const trunkRadius = 0.15 + Math.random() * 0.1
    const leavesRadius = height * 0.25 // Proportional to height
    const swayOffset = Math.random() * Math.PI * 2 // Random phase for wind

    return {
      height,
      trunkRadius,
      leavesRadius,
      swayOffset,
    }
  }, []) // Empty dependency array ensures this only runs once

  // Subtle wind sway animation
  useFrame((state) => {
    if (treeRef.current) {
      const time = state.clock.elapsedTime
      const sway = Math.sin(time * 0.5 + treeData.swayOffset) * 0.02
      treeRef.current.rotation.z = sway
    }
  })

  return (
    <group ref={treeRef} position={position}>
      {/* Trunk - enhanced bark texture */}
      <mesh position={[0, treeData.height / 2, 0]} castShadow>
        <cylinderGeometry args={[treeData.trunkRadius * 0.8, treeData.trunkRadius, treeData.height]} />
        <meshStandardMaterial 
          color="#4A3728" 
          roughness={0.95} 
          metalness={0.05}
        />
      </mesh>

      {/* Leaves - deeper forest colors */}
      <mesh position={[0, treeData.height * 0.85, 0]} castShadow>
        <sphereGeometry args={[treeData.leavesRadius]} />
        <meshStandardMaterial 
          color="#1F4F1F" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Additional leaf layer for fuller cinematic look */}
      <mesh position={[0, treeData.height * 0.7, 0]} castShadow>
        <sphereGeometry args={[treeData.leavesRadius * 0.8]} />
        <meshStandardMaterial 
          color="#2F5F2F" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

function Castle() {
  return (
    <group position={[0, 0, -30]}>
      {/* Castle Foundation/Base */}
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[8, 8, 1]} />
        <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
      </mesh>

      {/* Main Keep (Central Tower) */}
      <group position={[0, 0, 0]}>
        {/* Base of tower with stone texture */}
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[3.2, 3.5, 6]} />
          <meshStandardMaterial color="#6a6a6a" roughness={0.9} />
        </mesh>
        
        {/* Upper tower section */}
        <mesh position={[0, 7.5, 0]} castShadow>
          <cylinderGeometry args={[2.8, 3.2, 3]} />
          <meshStandardMaterial color="#696969" roughness={0.9} />
        </mesh>

        {/* Battlements around tower top */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x = Math.cos(angle) * 3.2
          const z = Math.sin(angle) * 3.2
          return (
            <mesh key={i} position={[x, 9.5, z]} castShadow>
              <boxGeometry args={[0.6, 1, 0.6]} />
              <meshStandardMaterial color="#656565" roughness={0.9} />
            </mesh>
          )
        })}

        {/* Tower roof */}
        <mesh position={[0, 11, 0]} castShadow>
          <coneGeometry args={[3.8, 4]} />
          <meshStandardMaterial color="#8B0000" roughness={0.6} metalness={0.1} />
        </mesh>

        {/* Roof peak ornament */}
        <mesh position={[0, 13.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1]} />
          <meshStandardMaterial color="#FFD700" roughness={0.2} metalness={0.8} />
        </mesh>
        
        {/* Flag */}
        <mesh position={[0.5, 13.8, 0]} castShadow>
          <planeGeometry args={[1, 0.6]} />
          <meshStandardMaterial color="#cc0000" side={2} />
        </mesh>
      </group>

      {/* Corner Towers */}
      {[[-7, -4], [7, -4], [-7, 4], [7, 4]].map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          {/* Tower base */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[1.8, 2, 5]} />
            <meshStandardMaterial color="#6a6a6a" roughness={0.9} />
          </mesh>
          
          {/* Tower battlements */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2
            const bx = Math.cos(angle) * 2
            const bz = Math.sin(angle) * 2
            return (
              <mesh key={i} position={[bx, 5.5, bz]} castShadow>
                <boxGeometry args={[0.4, 0.8, 0.4]} />
                <meshStandardMaterial color="#656565" roughness={0.9} />
              </mesh>
            )
          })}
          
          {/* Small tower roof */}
          <mesh position={[0, 6.5, 0]} castShadow>
            <coneGeometry args={[2.2, 2.5]} />
            <meshStandardMaterial color="#8B0000" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Castle Walls */}
      {/* Front wall */}
      <mesh position={[0, 2.5, 5]} castShadow>
        <boxGeometry args={[16, 5, 1]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
      
      {/* Back wall */}
      <mesh position={[0, 2.5, -5]} castShadow>
        <boxGeometry args={[16, 5, 1]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-7.5, 2.5, 0]} castShadow>
        <boxGeometry args={[1, 5, 10]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[7.5, 2.5, 0]} castShadow>
        <boxGeometry args={[1, 5, 10]} />
        <meshStandardMaterial color="#696969" roughness={0.9} />
      </mesh>

      {/* Wall Battlements */}
      {/* Front wall battlements */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -7.5 + i * 1.5
        return (
          <mesh key={`front-${i}`} position={[x, 5.5, 5]} castShadow>
            <boxGeometry args={[0.5, 1, 0.5]} />
            <meshStandardMaterial color="#656565" roughness={0.9} />
          </mesh>
        )
      })}

      {/* Gateway */}
      <group position={[0, 0, 5]}>
        {/* Gate arch */}
        <mesh position={[0, 2.5, 0.2]} castShadow>
          <boxGeometry args={[3, 4, 0.8]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
        
        {/* Wooden gate */}
        <mesh position={[0, 1.5, 0.6]} castShadow>
          <boxGeometry args={[2.8, 3, 0.2]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        
        {/* Gate reinforcement bands */}
        {[0.5, -0.5].map((y, i) => (
          <mesh key={i} position={[0, 1.5 + y, 0.7]} castShadow>
            <boxGeometry args={[2.8, 0.2, 0.05]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Windows in main tower with warm glows */}
      {[4, 7].map((y, i) => 
        [0, Math.PI/2, Math.PI, 3*Math.PI/2].map((angle, j) => {
          const x = Math.cos(angle) * 3.1
          const z = Math.sin(angle) * 3.1
          return (
            <group key={`window-${i}-${j}`} position={[x, y, z]}>
              {/* Window frame */}
              <mesh castShadow>
                <boxGeometry args={[0.6, 1, 0.2]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
              </mesh>
              
              {/* Warm window glow */}
              <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[0.5, 0.8]} />
                <meshStandardMaterial 
                  color="#FFB366"
                  emissive="#FF8C42"
                  emissiveIntensity={0.6}
                  transparent
                  opacity={0.8}
                />
              </mesh>
              
              {/* Subtle interior light */}
              <pointLight 
                position={[0, 0, -0.3]}
                intensity={0.5}
                distance={5}
                color="#FFB366"
                decay={2}
              />
            </group>
          )
        })
      )}

      {/* Decorative banners on walls */}
      {[[-6, 4, 5.1], [6, 4, 5.1], [0, 4, 5.1]].map(([x, y, z], i) => (
        <mesh key={`banner-${i}`} position={[x, y, z]} castShadow>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial color={i === 1 ? "#4169E1" : "#800080"} side={2} />
        </mesh>
      ))}

      {/* Torch holders */}
      {[[-4, 4, 5.2], [4, 4, 5.2]].map(([x, y, z], i) => (
        <group key={`torch-${i}`} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1]} />
            <meshStandardMaterial color="#654321" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial 
              color="#ff4400" 
              emissive="#ff2200" 
              emissiveIntensity={0.5} 
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Mountains() {
  const mountains = useMemo(() => {
    const mountainData: { position: [number, number, number], scale: [number, number, number], color: string }[] = []
    
    // Create mountain ring around the perimeter
    const numMountains = 24
    const baseRadius = 120 // Distance from center
    
    for (let i = 0; i < numMountains; i++) {
      const angle = (i / numMountains) * Math.PI * 2
      const radius = baseRadius + Math.random() * 20 // Vary distance
      
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      // Vary mountain height and size
      const height = 15 + Math.random() * 25 // 15-40 units tall
      const width = 8 + Math.random() * 12   // 8-20 units wide
      const depth = 6 + Math.random() * 8    // 6-14 units deep
      
      // Mountain colors - mix of grays and blues for depth
      const colors = ['#555555', '#666666', '#4A4A4A', '#5A5A5A', '#444444']
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      mountainData.push({
        position: [x, height / 2, z],
        scale: [width, height, depth],
        color
      })
      
      // Add some smaller peaks around larger mountains
      if (Math.random() > 0.7) {
        const smallAngle = angle + (Math.random() - 0.5) * 0.3
        const smallRadius = radius + (Math.random() - 0.5) * 15
        const smallX = Math.cos(smallAngle) * smallRadius
        const smallZ = Math.sin(smallAngle) * smallRadius
        const smallHeight = height * (0.5 + Math.random() * 0.4)
        
        mountainData.push({
          position: [smallX, smallHeight / 2, smallZ],
          scale: [width * 0.6, smallHeight, depth * 0.7],
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }
    
    return mountainData
  }, [])
  
  return (
    <group>
      {mountains.map((mountain, index) => (
        <mesh 
          key={index}
          position={mountain.position}
          scale={mountain.scale}
          receiveShadow
        >
          {/* Use coneGeometry for mountain shape */}
          <coneGeometry args={[1, 1, 6]} />
          <meshStandardMaterial 
            color={mountain.color}
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
      ))}
      
      {/* Add some snow-capped peaks */}
      {mountains.filter((_, i) => i % 4 === 0).map((mountain, index) => (
        <mesh 
          key={`snow-${index}`}
          position={[
            mountain.position[0], 
            mountain.position[1] + mountain.scale[1] * 0.3, 
            mountain.position[2]
          ]}
          scale={[
            mountain.scale[0] * 0.7, 
            mountain.scale[1] * 0.3, 
            mountain.scale[2] * 0.7
          ]}
        >
          <coneGeometry args={[1, 1, 6]} />
          <meshStandardMaterial 
            color="#EEEEEE"
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}
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
  const [_baseHeight, _setBaseHeight] = useState(0.5)
  const [_targetHeight, setTargetHeight] = useState(0.5)

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
      setBobOffset((prev: number) => prev + delta * 3)
      
      // Check for player proximity (within 15 units)
      if (playerPosition) {
        const distanceToPlayer = currentPosition.distanceTo(playerPosition)
        if (distanceToPlayer < 15) {
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

      {/* Enhanced Spiky Bat Wings */}
      <group position={[0, 0.5, -0.1]}>
        {/* Left Wing */}
        <group position={[-0.3, 0, 0]} rotation={[0, 0, Math.sin(bobOffset * 2) * 0.4]}>
          {/* Main Wing membrane with jagged edges */}
          <mesh position={[-0.2, 0, 0]} rotation={[0, 0, 0.2]}>
            <planeGeometry args={[0.5, 0.8]} />
            <meshStandardMaterial 
              color="#0F0000" 
              transparent={true}
              opacity={0.9}
              side={THREE.DoubleSide}
              emissive="#AA0000"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Wing spikes along top edge */}
          {[...Array(5)].map((_, i) => (
            <mesh key={`left-spike-top-${i}`} position={[-0.05 - i * 0.08, 0.35 - i * 0.05, 0]}>
              <coneGeometry args={[0.015, 0.12, 4]} />
              <meshStandardMaterial color="#000000" metalness={1} roughness={0.1} emissive="#440000" />
            </mesh>
          ))}
          
          {/* Wing spikes along bottom edge */}
          {[...Array(4)].map((_, i) => (
            <mesh key={`left-spike-bottom-${i}`} position={[-0.1 - i * 0.08, -0.3 + i * 0.02, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.012, 0.1, 4]} />
              <meshStandardMaterial color="#000000" metalness={1} roughness={0.1} emissive="#440000" />
            </mesh>
          ))}
          
          {/* Wing bones/fingers with spikes */}
          <mesh position={[-0.1, 0.2, 0]} rotation={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.012, 0.012, 0.35]} />
            <meshStandardMaterial color="#000000" metalness={0.9} emissive="#220000" />
          </mesh>
          <mesh position={[-0.2, 0.1, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.01, 0.01, 0.3]} />
            <meshStandardMaterial color="#000000" metalness={0.9} emissive="#220000" />
          </mesh>
          <mesh position={[-0.3, -0.1, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.25]} />
            <meshStandardMaterial color="#000000" metalness={0.9} emissive="#220000" />
          </mesh>
          
          {/* Enhanced wing claw with extra spikes */}
          <mesh position={[-0.45, 0.25, 0]}>
            <coneGeometry args={[0.025, 0.12, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} emissive="#AA2222" />
          </mesh>
          <mesh position={[-0.42, 0.18, 0]}>
            <coneGeometry args={[0.015, 0.08, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} emissive="#AA2222" />
          </mesh>
        </group>

        {/* Right Wing */}
        <group position={[0.3, 0, 0]} rotation={[0, 0, -Math.sin(bobOffset * 2) * 0.4]}>
          {/* Main Wing membrane with jagged edges */}
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, -0.2]}>
            <planeGeometry args={[0.5, 0.8]} />
            <meshStandardMaterial 
              color="#0F0000" 
              transparent={true}
              opacity={0.9}
              side={THREE.DoubleSide}
              emissive="#AA0000"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Wing spikes along top edge */}
          {[...Array(5)].map((_, i) => (
            <mesh key={`right-spike-top-${i}`} position={[0.05 + i * 0.08, 0.35 - i * 0.05, 0]}>
              <coneGeometry args={[0.015, 0.12, 4]} />
              <meshStandardMaterial color="#000000" metalness={1} roughness={0.1} emissive="#440000" />
            </mesh>
          ))}
          
          {/* Wing spikes along bottom edge */}
          {[...Array(4)].map((_, i) => (
            <mesh key={`right-spike-bottom-${i}`} position={[0.1 + i * 0.08, -0.3 + i * 0.02, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.012, 0.1, 4]} />
              <meshStandardMaterial color="#000000" metalness={1} roughness={0.1} emissive="#440000" />
            </mesh>
          ))}
          
          {/* Wing bones/fingers with spikes */}
          <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.012, 0.012, 0.35]} />
            <meshStandardMaterial color="#000000" metalness={0.9} emissive="#220000" />
          </mesh>
          <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.01, 0.01, 0.3]} />
            <meshStandardMaterial color="#000000" metalness={0.9} emissive="#220000" />
          </mesh>
          <mesh position={[0.3, -0.1, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.01, 0.01, 0.25]} />
            <meshStandardMaterial color="#000000" metalness={0.9} emissive="#220000" />
          </mesh>
          
          {/* Enhanced wing claw with extra spikes */}
          <mesh position={[0.45, 0.25, 0]}>
            <coneGeometry args={[0.025, 0.12, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} emissive="#AA2222" />
          </mesh>
          <mesh position={[0.42, 0.18, 0]}>
            <coneGeometry args={[0.015, 0.08, 4]} />
            <meshStandardMaterial color="#FFFFFF" metalness={1} roughness={0.1} emissive="#AA2222" />
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
    const initialParticles = Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2
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
        setOpacity((prev: number) => Math.max(prev - delta * 2, 0))
      }

      // Update particles less frequently for performance
      if (state.clock.elapsedTime % 3 < delta) { // Update every 3rd frame
        setParticles((prev: any[]) =>
          prev.map((particle) => ({
            ...particle,
            position: [
              particle.position[0] + particle.velocity[0] * delta * 3,
              particle.position[1] + particle.velocity[1] * delta * 3,
              particle.position[2] + particle.velocity[2] * delta * 3,
            ],
            velocity: [
              particle.velocity[0] * 0.94, // Air resistance
              particle.velocity[1] - 9.8 * delta * 3, // Gravity
              particle.velocity[2] * 0.94,
            ],
          })),
        )
      }

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

function DragonBoss({ dragon, playerPosition, onPositionUpdate, onFireAttack }: { dragon: any, playerPosition?: THREE.Vector3, onPositionUpdate: (position: number[]) => void, onFireAttack: (fireProjectile: any) => void }) {
  const dragonRef = useRef<THREE.Group>(null)
  const [bobOffset, setBobOffset] = useState(0)
  const [wingFlap, setWingFlap] = useState(0)
  const [currentPosition, setCurrentPosition] = useState(dragon.position)
  const [attackTimer, setAttackTimer] = useState(0)

  // Dragon AI and movement
  useFrame((state, delta) => {
    if (!dragonRef.current || !playerPosition) return

    setBobOffset((prev: number) => prev + delta * 2)
    setWingFlap((prev: number) => prev + delta * 8)
    setAttackTimer((prev: number) => prev + delta)

    // Fire attack every 3 seconds when circling - shoot 3 tracking fire balls
    if (dragon.phase === 'circling' && attackTimer > 3) {
      const dragonPos = new THREE.Vector3(...currentPosition)
      
      // Create 3 fire projectiles in triangle formation with tracking behavior
      for (let i = 0; i < 3; i++) {
        // Calculate base direction to player
        const direction = new THREE.Vector3()
        direction.subVectors(playerPosition, dragonPos)
        direction.normalize()
        
        // Triangle formation: top, bottom-left, bottom-right
        let spreadDirection = direction.clone()
        if (i === 0) {
          // Top projectile - slightly upward
          spreadDirection.y += 0.3
        } else if (i === 1) {
          // Bottom-left projectile
          const angle = -Math.PI / 6 // -30 degrees
          spreadDirection.x += Math.sin(angle) * 0.7
          spreadDirection.z += Math.cos(angle) * 0.7
          spreadDirection.y -= 0.2
        } else if (i === 2) {
          // Bottom-right projectile  
          const angle = Math.PI / 6 // +30 degrees
          spreadDirection.x += Math.sin(angle) * 0.7
          spreadDirection.z += Math.cos(angle) * 0.7
          spreadDirection.y -= 0.2
        }
        spreadDirection.normalize()

        const fireProjectile = {
          id: Date.now() + Math.random() + i,
          position: [...currentPosition],
          velocity: [spreadDirection.x * 15, spreadDirection.y * 15, spreadDirection.z * 15], // Slightly slower for tracking
          damage: 20, // Reduced damage since there are 3 projectiles
          age: 0,
          isTracking: true, // Enable tracking behavior
          trackingStrength: 0.5 // Increased tracking strength for more challenge
        }

        onFireAttack(fireProjectile)
      }
      
      setAttackTimer(0) // Reset attack timer
    }

    // Update dragon's current position based on phase
    let newPosition = [...currentPosition]
    
    if (dragon.phase === 'entering') {
      // Dramatic entrance - descend from high above to normal position
      const targetPos = dragon.targetPosition || [0, 15, -60]
      const currentPos = new THREE.Vector3(...currentPosition)
      const target = new THREE.Vector3(...targetPos)
      
      // Move towards target position
      const direction = new THREE.Vector3()
      direction.subVectors(target, currentPos)
      
      if (direction.length() > 2) {
        // Still descending
        direction.normalize().multiplyScalar(15 * delta) // Descent speed
        newPosition[0] += direction.x
        newPosition[1] += direction.y
        newPosition[2] += direction.z
      } else {
        // Arrived at target - smoothly transition to circling
        newPosition = [...targetPos]
        // Don't immediately switch to circling - let the dragon settle first
        // We'll transition to circling phase through the parent component
      }
    } else if (dragon.phase === 'circling') {
      // Circle around the castle area - only start circling if we're not still entering
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
    dragonRef.current.position.set(newPosition[0], newPosition[1], newPosition[2])
    
    // Face towards player when alive
    if (playerPosition) {
      dragonRef.current.lookAt(playerPosition)
    }
    // Vertical bobbing motion when alive
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