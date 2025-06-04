import { createFileRoute } from "@tanstack/react-router";
import ArcheryGame from "@/components/ArcheryGame"

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <ArcheryGame />
}
