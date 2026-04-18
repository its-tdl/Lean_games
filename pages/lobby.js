import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

export default function Lobby() {
  const router = useRouter();
  const { gameId } = router.query;

  const [game, setGame] = useState(null);
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    if (!gameId) return;

    // Get playerId from localStorage
    const storedPlayerId = localStorage.getItem("playerId");
    setPlayerId(storedPlayerId);

    const unsub = onSnapshot(doc(db, "games", gameId), async (docSnap) => {
      if (!docSnap.exists()) return;

      const gameData = docSnap.data();
      console.log("LOBBY GAME STATUS:", gameData.status);

      setGame(gameData);

      // 🔥 AUTO REDIRECT WHEN GAME STARTS
      if (gameData.status === "playing") {
        const teamId = await getPlayerTeam(gameId, storedPlayerId);

        console.log("Redirecting to team:", teamId);

        if (teamId) {
          router.push(`/game/${gameId}/${teamId}`);
        }
      }
    });

    return () => unsub();
  }, [gameId]);

  const getPlayerTeam = async (gameId, playerId) => {
    if (!playerId) return null;

    const playerRef = doc(db, "games", gameId, "players", playerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) return null;

    return playerSnap.data().teamId;
  };

  if (!game) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Lobby</h1>

      <p><b>Game Code:</b> {gameId}</p>
      <p><b>Player ID:</b> {playerId}</p>

      <h3>Waiting for other players...</h3>
    </div>
  );
}
