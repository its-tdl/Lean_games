// =======================
// FIREBASE SETUP
// =======================

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";

// 🔥 Your Firebase config (make sure env vars are set in Vercel)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase safely
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const db = getFirestore(app);

// =======================
// CREATE GAME
// =======================

export async function createGameSession(hostName) {
  const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();

  await setDoc(doc(db, "games", gameId), {
    gameId,
    host: hostName,
    status: "lobby",
    currentRound: 0,
    totalRounds: 5,
    createdAt: serverTimestamp(),
  });

  return gameId;
}

// =======================
// ADD PLAYER + AUTO TEAM ASSIGN
// =======================

export async function addPlayerToGame(gameId, playerName, playerId) {
  const playerRef = doc(db, "games", gameId, "players", playerId);

  // Prevent duplicate
  const playersSnapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  let alreadyExists = false;
  playersSnapshot.forEach((docSnap) => {
    if (docSnap.id === playerId) {
      alreadyExists = true;
    }
  });

  if (alreadyExists) return;

  // Fetch teams
  const teamsSnapshot = await getDocs(
    collection(db, "games", gameId, "teams")
  );

  const teams = teamsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const roles = ["Supplier", "Manufacturing", "Transport", "Sales"];

  let chosenTeam = null;

  // Find team with space
  for (let team of teams) {
    if ((team.playerCount || 0) < 4) {
      chosenTeam = team;
      break;
    }
  }

  // If no team → create new
  if (!chosenTeam) {
    const newTeamId = Math.random().toString(36).substring(2, 8);

    await setDoc(doc(db, "games", gameId, "teams", newTeamId), {
      teamName: `Team ${teams.length + 1}`,
      playerCount: 0,
      totalScore: 0,
    });

    chosenTeam = {
      id: newTeamId,
      playerCount: 0,
    };
  }

  const role = roles[chosenTeam.playerCount];

  // Add player
  await setDoc(playerRef, {
    name: playerName,
    teamId: chosenTeam.id,
    role,
    invested: false,
    joinedAt: new Date(),
  });

  // Update team count
  await updateDoc(doc(db, "games", gameId, "teams", chosenTeam.id), {
    playerCount: increment(1),
  });
}

// =======================
// SUBSCRIPTIONS (REAL-TIME)
// =======================

export function subscribeToGame(gameId, callback) {
  return onSnapshot(doc(db, "games", gameId), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}

export function subscribeToTeams(gameId, callback) {
  return onSnapshot(
    collection(db, "games", gameId, "teams"),
    (snap) => {
      const teams = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(teams);
    }
  );
}

export function subscribeToPlayers(gameId, callback) {
  return onSnapshot(
    collection(db, "games", gameId, "players"),
    (snap) => {
      const players = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(players);
    }
  );
}

// =======================
// GAME CONTROL
// =======================

export async function updateGame(gameId, data) {
  await updateDoc(doc(db, "games", gameId), data);
}

export async function startGame(gameId) {
  await updateDoc(doc(db, "games", gameId), {
    status: "playing",
    currentRound: 1,
  });
}

export async function advanceRound(gameId) {
  await updateDoc(doc(db, "games", gameId), {
    currentRound: increment(1),
  });
}

export async function processRound() {
  console.log("Processing round...");
}

// =======================
// 🔥 GET PLAYER TEAM (FIXED)
// =======================

export const getPlayerTeam = async (gameId, playerId) => {
  const playersSnapshot = await getDocs(
    collection(db, "games", gameId, "players")
  );

  for (const docSnap of playersSnapshot.docs) {
    if (docSnap.id === playerId) {
      const player = docSnap.data();
      return player.teamId;
    }
  }

  return null;
};

// =======================
// TEAM SUBSCRIPTION
// =======================

export function subscribeToTeam(gameId, teamId, callback) {
  return onSnapshot(
    doc(db, "games", gameId, "teams", teamId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() });
      }
    }
  );
}

// =======================
// PLAYER ACTION
// =======================

export async function submitInvestment(gameId, playerId, amount) {
  const playerRef = doc(db, "games", gameId, "players", playerId);

  await updateDoc(playerRef, {
    investment: amount,
    invested: true,
  });
}
