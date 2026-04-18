import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { subscribeToGame, subscribeToTeam, subscribeToTeams } from "../../lib/firebase";
import GameScreen from "../../components/GameScreen";
import ResultsScreen from "../../components/ResultsScreen";
import Leaderboard from "../../components/Leaderboard";

export default function GamePage() {
  const router = useRouter();
  const { teamId, gameId } = router.query;
  const [game, setGame] = useState(null);
  const [team, setTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [lastSeenRound, setLastSeenRound] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setPlayerId(localStorage.getItem("playerId"));
  }, []);

  useEffect(() => {
    if (!gameId || !teamId) return;
    const unsub1 = subscribeToGame(gameId, setGame);
    const unsub2 = subscribeToTeam(gameId, teamId, setTeam);
    const unsub3 = subscribeToTeams(gameId, setTeams);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [gameId, teamId]);

  useEffect(() => {
    if (game && game.currentRound > lastSeenRound) {
      setShowResults(true);
    }
  }, [game?.currentRound]);

  if (!game || !team) {
    return (
      <div className="container">
        <div className="card center-card">
          <p>Waiting for game data...</p>
          <p className="subtitle">Game: {gameId} | Team: {teamId}</p>
        </div>
      </div>
    );
  }

  if (game.status === "lobby") {
    const player = team.players.find((p) => p.playerId === playerId);
    return (
      <div className="container">
        <div className="card center-card">
          <h1>Waiting for Game to Start</h1>
          <div className="game-code-display">
            Game: <span className="code">{gameId}</span>
          </div>
          <h2>Team: {team.teamName}</h2>
          {player && (
            <p>Your role: <span className={`role-badge role-${player.role.toLowerCase()}`}>{player.role}</span></p>
          )}
          <div className="players-list">
            {team.players.map((p, i) => (
              <div key={i} className="player-tag">
                <span className={`role-badge role-${p.role.toLowerCase()}`}>{p.role}</span>
                {p.name} {p.playerId === playerId && "(You)"}
              </div>
            ))}
          </div>
          <p className="subtitle">The host will start the game soon...</p>
        </div>
      </div>
    );
  }

  if (game.status === "finished") {
    const lastRoundKey = `round_${game.totalRounds}`;
    const lastResult = team.rounds?.[lastRoundKey];
    return (
      <div className="container">
        <div className="card center-card">
          <h1>Game Over!</h1>
          <h2>Team: {team.teamName}</h2>
          <div className="final-score">
            Final Score: <span className="score-big">{team.totalScore || 0}</span>
          </div>
          {lastResult && <ResultsScreen result={lastResult} round={game.totalRounds} />}
          <Leaderboard teams={teams} />
        </div>
      </div>
    );
  }

  // Playing state
  const prevRoundKey = `round_${game.currentRound - 1}`;
  const prevResult = team.rounds?.[prevRoundKey];

  if (showResults && prevResult) {
    return (
      <div className="container">
        <div className="card">
          <ResultsScreen result={prevResult} round={game.currentRound - 1} />
          <Leaderboard teams={teams} />
          <button
            className="btn btn-primary full-width"
            onClick={() => {
              setShowResults(false);
              setLastSeenRound(game.currentRound);
            }}
          >
            Continue to Round {game.currentRound}
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameScreen
      game={game}
      team={team}
      teams={teams}
      playerId={playerId}
    />
  );
}

