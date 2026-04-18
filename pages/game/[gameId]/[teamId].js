import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// 🔌 import your firebase functions
import {
  subscribeToGame,
  subscribeToTeam,
  subscribeToTeams,
} from "../../../lib/firebase"; // adjust path if needed

export default function GamePage() {
  const router = useRouter();

  // ✅ FIX 1: Correct routing params
  const { gameId, teamId } = router.query;

  const [game, setGame] = useState(null);
  const [team, setTeam] = useState(null);
  const [teams, setTeams] = useState([]);

  const [showResults, setShowResults] = useState(false);
  const [lastSeenRound, setLastSeenRound] = useState(0);

  // ✅ FIX 2: Firebase subscriptions
  useEffect(() => {
    if (!gameId || !teamId) return;

    console.log("Subscribing with:", gameId, teamId);

    const unsubGame = subscribeToGame(gameId, setGame);
    const unsubTeam = subscribeToTeam(gameId, teamId, setTeam);
    const unsubTeams = subscribeToTeams(gameId, setTeams);

    return () => {
      if (unsubGame) unsubGame();
      if (unsubTeam) unsubTeam();
      if (unsubTeams) unsubTeams();
    };
  }, [gameId, teamId]);

  // ✅ FIX 3: Results screen update bug
  useEffect(() => {
    if (game && game.currentRound > lastSeenRound) {
      setShowResults(true);
      setLastSeenRound(game.currentRound); // IMPORTANT FIX
    }
  }, [game?.currentRound]);

  // ⏳ Loading state
  if (!gameId || !teamId) {
    return <div>Loading...</div>;
  }

  if (!game || !team) {
    return <div>Connecting to game...</div>;
  }

  // 🎮 Phase-based UI (basic version)
  const renderContent = () => {
    switch (game.phase) {
      case "LOBBY":
        return <h2>Waiting for host to start the game...</h2>;

      case "DEMAND_REVEAL":
      case "INVESTMENT":
        return (
          <div>
            <h2>Round {game.currentRound}</h2>
            <p>Demand: {game.currentDemand}</p>
            <p>Your Role: {team.role}</p>

            {/* TODO: Add your investment UI here */}
            <button>Submit Investment</button>
          </div>
        );

      case "RESULTS":
        return (
          <div>
            <h2>Round Results</h2>
            <p>Produced: {team.lastResult?.unitsProduced}</p>
            <p>Sold: {team.lastResult?.unitsSold}</p>
            <p>Score: {team.lastResult?.roundScore}</p>
          </div>
        );

      case "GAME_OVER":
        return (
          <div>
            <h2>Game Over</h2>
            <p>Final Score: {team.cumulativeScore}</p>
          </div>
        );

      default:
        return <p>Waiting...</p>;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Game ID: {gameId}</h1>
      <h3>Team ID: {teamId}</h3>

      {renderContent()}
    </div>
  );
}
