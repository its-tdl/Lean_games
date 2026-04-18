import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  addPlayerToGame,
  subscribeToGame,
  getPlayerTeam,
} from "../lib/firebase";

export default function Lobby() {
  const router = useRouter();
  const { gameId } = router.query;

  const [playerId, setPlayerId] = useState(null);
  const [name, setName] = useState("");

  // Load player info from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    const storedId = localStorage.getItem("playerId");

    if (storedName && storedId) {
      setName(storedName);
      setPlayerId(storedId);
    }
  }, []);

  // Add player to game
  useEffect(() => {
    if (!gameId || !playerId) return;

    addPlayerToGame(gameId, name, playerId);
  }, [gameId, playerId]);

  // 🔥 REAL-TIME LISTENER (MAIN FIX)
  useEffect(() => {
    if (!gameId || !playerId) return;

    const unsubscribe = subscribeToGame(gameId, async (game) => {
      if (!game) return;

      // When host starts game
      if (game.status === "playing") {
        const teamId = await getPlayerTeam(gameId, playerId);

        if (teamId) {
          router.push(`/game/${teamId}?gameId=${gameId}`);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId, playerId]);

return (
  <div>
    <h1>Lobby</h1>
    <p>Game Code: {gameId}</p>
    <p>Player: {name}</p>
    <p>ID: {playerId}</p>
    <h3>⏳ Waiting for host to start the game...</h3>
  </div>
);
}
