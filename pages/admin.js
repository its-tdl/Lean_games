import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

export default function Admin() {
  const router = useRouter();
  const { gameId } = router.query;

  const [game, setGame] = useState(null);

  useEffect(() => {
    if (!gameId) return;

    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("ADMIN GAME DATA:", data);
        setGame(data);
      }
    });

    return () => unsub();
  }, [gameId]);

  const startGame = async () => {
    try {
      await updateDoc(doc(db, "games", gameId), {
        status: "playing",
        currentRound: 1,
      });

      console.log("Game started successfully");
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  if (!game) return <div>Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Panel</h1>

      <p><b>Game Code:</b> {gameId}</p>
      <p><b>Status:</b> {game.status}</p>
      <p><b>Round:</b> {game.currentRound || 0}</p>

      <button onClick={startGame}>Start Game</button>
    </div>
  );
}
