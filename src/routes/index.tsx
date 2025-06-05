import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ArcheryGame from "@/components/ArcheryGame"

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Auto-enter fullscreen mode for optimal game experience
    setIsFullscreen(true);
  }, []);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-black z-50">
        <ArcheryGame />
        <button 
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medieval"
        >
          Exit Fullscreen
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <h1 className="text-4xl font-bold mb-4 font-medieval-ornate">Medieval Archery Adventure</h1>
      <p className="text-lg mb-6 font-medieval">Defend the realm against dragons and demons!</p>
      <button 
        onClick={() => setIsFullscreen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl font-medieval"
      >
        🏹 Start Game (Fullscreen)
      </button>
    </div>
  );
}
