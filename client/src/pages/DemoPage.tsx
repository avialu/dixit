import { useState, useEffect } from "react";
import { RoomState, PlayerState } from "../hooks/useGameState";
import { UnifiedGamePage } from "./UnifiedGamePage";

// Mock data generator for different game phases
const generateMockRoomState = (
  phase: string,
  customPlayerScores?: { [playerId: string]: number },
  customScoreDeltas?: { playerId: string; delta: number }[]
): RoomState | null => {
  // Get the current server URL from window location
  const port = window.location.port || "3000";
  const currentUrl = `${window.location.protocol}//${window.location.hostname}:${port}`;

  // Special case: NOT_JOINED - return minimal state for join screen with QR code
  if (phase === "NOT_JOINED") {
    return {
      phase: "DECK_BUILDING" as any,
      players: [],
      allowPlayerUploads: true,
      deckSize: 0,
      deckLocked: false,
      deckImages: [],
      currentRound: 0,
      storytellerId: "",
      currentClue: "",
      revealedCards: [],
      votes: [],
      lastScoreDeltas: [],
      winTarget: 30,
      boardBackgroundImage: null,
      boardPattern: "snake",
      serverUrl: currentUrl,
    };
  }

  const basePlayers = [
    {
      id: "1",
      name: "Alice",
      score: customPlayerScores?.["1"] ?? 0,
      isAdmin: true,
      isConnected: true,
      handSize: 6,
      tokenImage: null,
    },
    {
      id: "2",
      name: "Bob",
      score: customPlayerScores?.["2"] ?? 0,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
      tokenImage: null,
    },
    {
      id: "3",
      name: "Charlie",
      score: customPlayerScores?.["3"] ?? 0,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
      tokenImage: null,
    },
    {
      id: "4",
      name: "Diana",
      score: customPlayerScores?.["4"] ?? 0,
      isAdmin: false,
      isConnected: true,
      handSize: 6,
      tokenImage: null,
    },
  ];

  const baseState: RoomState = {
    phase: phase as any,
    players: basePlayers,
    allowPlayerUploads: true,
    deckSize: 100,
    deckLocked: false,
    deckImages: [],
    currentRound: 5,
    storytellerId: "1",
    currentClue: phase === "STORYTELLER_CHOICE" ? "" : "A magical journey",
    revealedCards: [],
    votes: [],
    lastScoreDeltas: [],
    winTarget: 30,
    boardBackgroundImage: null,
    boardPattern: "snake",
    serverUrl: currentUrl,
  };

  // Phase-specific modifications
  switch (phase) {
    case "DECK_BUILDING":
      return {
        ...baseState,
        phase: "DECK_BUILDING",
        players: basePlayers.slice(0, 2),
        currentRound: 0,
        currentClue: "",
        deckSize: 45,
      };

    case "STORYTELLER_CHOICE":
      return {
        ...baseState,
        phase: "STORYTELLER_CHOICE",
        currentClue: "",
      };

    case "PLAYERS_CHOICE":
      return {
        ...baseState,
        phase: "PLAYERS_CHOICE",
      };

    case "VOTING":
      return {
        ...baseState,
        phase: "VOTING",
        revealedCards: [
          {
            cardId: "c1",
            imageData: "https://picsum.photos/seed/card1/400/600",
            position: 0,
            playerId: "1", // Alice (storyteller)
          } as any,
          {
            cardId: "c2",
            imageData: "https://picsum.photos/seed/card2/400/600",
            position: 1,
            playerId: "2", // Bob
          } as any,
          {
            cardId: "c3",
            imageData: "https://picsum.photos/seed/card3/400/600",
            position: 2,
            playerId: "3", // Charlie
          } as any,
          {
            cardId: "c4",
            imageData: "https://picsum.photos/seed/card4/400/600",
            position: 3,
            playerId: "4", // Diana
          } as any,
        ],
        votes: [], // Start with no votes, will be filled as demo progresses
      };

    case "REVEAL":
      // Calculate correct scoring based on demo votes
      // Storyteller: Alice (1) with card c1
      // Votes: Bob->c4, Charlie->c4, Diana->c2
      // Nobody voted for storyteller's card (c1), so:
      // - Storyteller gets 0
      // - Everyone else gets 2 base points
      // - Diana got 2 votes on her card (c4) = +2 bonus
      // - Bob got 1 vote on his card (c2) = +1 bonus
      const defaultDeltas = [
        { playerId: "1", delta: 0 }, // Alice (storyteller) - nobody guessed
        { playerId: "2", delta: 3 }, // Bob - 2 base + 1 vote on his card
        { playerId: "3", delta: 2 }, // Charlie - 2 base + 0 votes
        { playerId: "4", delta: 4 }, // Diana - 2 base + 2 votes on her card
      ];
      const deltas = customScoreDeltas || defaultDeltas;

      return {
        ...baseState,
        phase: "REVEAL",
        players: basePlayers, // Use basePlayers which already has custom scores
        revealedCards: [
          {
            cardId: "c1",
            imageData: "https://picsum.photos/seed/card1/400/600",
            position: 0,
            playerId: "1", // Alice (storyteller)
          } as any,
          {
            cardId: "c2",
            imageData: "https://picsum.photos/seed/card2/400/600",
            position: 1,
            playerId: "2", // Bob
          } as any,
          {
            cardId: "c3",
            imageData: "https://picsum.photos/seed/card3/400/600",
            position: 2,
            playerId: "3", // Charlie
          } as any,
          {
            cardId: "c4",
            imageData: "https://picsum.photos/seed/card4/400/600",
            position: 3,
            playerId: "4", // Diana
          } as any,
        ],
        votes: [
          { voterId: "2", cardId: "c4" }, // Bob voted for Diana's card
          { voterId: "3", cardId: "c4" }, // Charlie voted for Diana's card
          { voterId: "4", cardId: "c2" }, // Diana voted for Bob's card
        ],
        lastScoreDeltas: deltas,
      };

    case "GAME_END":
      return {
        ...baseState,
        phase: "GAME_END",
        players: [
          {
            id: "1",
            name: "Alice",
            score: 32,
            isAdmin: true,
            isConnected: true,
            handSize: 0,
            tokenImage: null,
          },
          {
            id: "2",
            name: "Bob",
            score: 28,
            isAdmin: false,
            isConnected: true,
            handSize: 0,
            tokenImage: null,
          },
          {
            id: "3",
            name: "Charlie",
            score: 25,
            isAdmin: false,
            isConnected: true,
            handSize: 0,
            tokenImage: null,
          },
          {
            id: "4",
            name: "Diana",
            score: 22,
            isAdmin: false,
            isConnected: true,
            handSize: 0,
            tokenImage: null,
          },
        ],
        currentClue: "",
      };

    default:
      return baseState;
  }
};

const generateMockPlayerState = (
  phase: string,
  playerId: string
): PlayerState => {
  const baseHand = [
    {
      id: "h1",
      imageData: "https://picsum.photos/seed/dixit1/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h2",
      imageData: "https://picsum.photos/seed/dixit2/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h3",
      imageData: "https://picsum.photos/seed/dixit3/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h4",
      imageData: "https://picsum.photos/seed/dixit4/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h5",
      imageData: "https://picsum.photos/seed/dixit5/400/600",
      uploadedBy: playerId,
    },
    {
      id: "h6",
      imageData: "https://picsum.photos/seed/dixit6/400/600",
      uploadedBy: playerId,
    },
  ];

  // Player 1 (Alice, admin, storyteller) behavior
  // Player 2 (Bob, regular player) behavior
  const isStoryteller = playerId === "1";

  return {
    playerId: playerId,
    hand: baseHand,
    // Only non-storytellers submit cards during PLAYERS_CHOICE
    mySubmittedCardId:
      (phase === "PLAYERS_CHOICE" || phase === "VOTING") && !isStoryteller
        ? "h2"
        : null,
    // Only non-storytellers vote during VOTING
    myVote: phase === "VOTING" && !isStoryteller ? "c1" : null,
  };
};

const allPhases = [
  "NOT_JOINED", // Special phase for demo to show join screen
  "DECK_BUILDING",
  "STORYTELLER_CHOICE",
  "PLAYERS_CHOICE",
  "VOTING", // Vote on cards (hidden who drew)
  "REVEAL", // Show who drew and who voted + scoring
  "GAME_END",
];

export function DemoPage() {
  // NEW: Flow test mode state
  const [demoMode, setDemoMode] = useState<"component" | "flow">("component");
  const [flowPhase, setFlowPhase] = useState<string>("STORYTELLER_CHOICE");
  const [flowRound, setFlowRound] = useState(1);
  const [flowStorytellerIndex, setFlowStorytellerIndex] = useState(0);
  const [flowSubmittedCards, setFlowSubmittedCards] = useState<
    Array<{ cardId: string; playerId: string; position?: number }>
  >([]);
  const [flowVotes, setFlowVotes] = useState<
    Array<{ voterId: string; cardId: string }>
  >([]);
  const [flowCurrentClue, setFlowCurrentClue] = useState("");
  const [flowPlayerScores, setFlowPlayerScores] = useState({
    "1": 0,
    "2": 0,
    "3": 0,
  });
  const [flowLastDeltas, setFlowLastDeltas] = useState<
    Array<{ playerId: string; delta: number }>
  >([]);

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"player" | "admin" | "spectator">(
    "player"
  );
  const [forcePlayerView, setForcePlayerView] = useState(false); // Toggle storyteller/player in demo
  const [demoVotes, setDemoVotes] = useState<
    { voterId: string; cardId: string }[]
  >([]);
  const [demoVotedCardId, setDemoVotedCardId] = useState<string | null>(null);
  const [detectedServerUrl, setDetectedServerUrl] = useState<string | null>(
    null
  );

  // Interactive demo state
  const [allowPlayerUploads, setAllowPlayerUploads] = useState(true);
  const [winTarget, setWinTarget] = useState<number | null>(30);
  const [deckSize, setDeckSize] = useState(45);
  const [deckLocked, setDeckLocked] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ id: string; uploadedBy: string; imageData: string }>
  >([]);

  // Animation testing states
  const [customPlayerScores, setCustomPlayerScores] = useState<
    { [playerId: string]: number } | undefined
  >(undefined);
  const [customScoreDeltas, setCustomScoreDeltas] = useState<
    { playerId: string; delta: number }[] | undefined
  >(undefined);
  const [animationRound, setAnimationRound] = useState(0);

  // Fetch server URL on mount
  useEffect(() => {
    fetch("/api/server-info")
      .then((res) => res.json())
      .then((data) => setDetectedServerUrl(data.serverUrl))
      .catch((err) => {
        console.warn("Could not fetch server URL:", err);
        // Fallback to window location
        const port = window.location.port || "3000";
        setDetectedServerUrl(
          `${window.location.protocol}//${window.location.hostname}:${port}`
        );
      });
  }, []);

  const currentPhase = allPhases[currentPhaseIndex];
  const mockRoomState = generateMockRoomState(
    currentPhase,
    customPlayerScores,
    customScoreDeltas
  );

  // Update with interactive demo state
  if (mockRoomState) {
    mockRoomState.allowPlayerUploads = allowPlayerUploads;
    mockRoomState.winTarget = winTarget;
    mockRoomState.deckSize = deckSize;
    mockRoomState.deckLocked = deckLocked;
    mockRoomState.deckImages = uploadedImages;

    // Update serverUrl with detected one
    if (detectedServerUrl) {
      mockRoomState.serverUrl = detectedServerUrl;
    }
  }

  // Override current round for animation testing in REVEAL phase
  if (
    mockRoomState &&
    currentPhase === "REVEAL" &&
    (customPlayerScores || customScoreDeltas)
  ) {
    mockRoomState.currentRound = 5 + animationRound;
  }

  // Update mockRoomState with demo votes if in VOTING phase
  // For REVEAL, use demo votes if they exist, otherwise keep the default votes from the mock
  if (mockRoomState && currentPhase === "VOTING") {
    mockRoomState.votes = demoVotes;
  } else if (
    mockRoomState &&
    currentPhase === "REVEAL" &&
    demoVotes.length > 0
  ) {
    mockRoomState.votes = demoVotes;
  }

  // Reset votes when leaving REVEAL phase or going backwards to before VOTING
  useEffect(() => {
    const isBeforeVoting = [
      "NOT_JOINED",
      "DECK_BUILDING",
      "STORYTELLER_CHOICE",
      "PLAYERS_CHOICE",
    ].includes(currentPhase);
    const isAfterReveal = ["GAME_END"].includes(currentPhase);

    if (isBeforeVoting || isAfterReveal) {
      setDemoVotes([]);
      setDemoVotedCardId(null);
    }

    // Reset animation test data when leaving REVEAL phase
    if (currentPhase !== "REVEAL") {
      setCustomPlayerScores(undefined);
      setCustomScoreDeltas(undefined);
      setAnimationRound(0);
    }
  }, [currentPhaseIndex, currentPhase]);

  // Different player IDs for different modes
  // Admin = Alice (player 1, storyteller), Player = Bob (player 2)
  // In phases where we can toggle, use forcePlayerView to override
  const shouldShowAsPlayer =
    forcePlayerView &&
    (currentPhase === "STORYTELLER_CHOICE" ||
      currentPhase === "PLAYERS_CHOICE" ||
      currentPhase === "VOTING");

  const currentPlayerId =
    viewMode === "spectator"
      ? "spectator"
      : shouldShowAsPlayer
      ? "2" // Force player view
      : viewMode === "admin"
      ? "1"
      : "2";

  // Generate appropriate player state based on view mode
  const mockPlayerState = generateMockPlayerState(
    currentPhase,
    currentPlayerId
  );

  // Update player state with demo vote
  if (mockPlayerState && demoVotedCardId) {
    mockPlayerState.myVote = demoVotedCardId;
  }

  // Mock action handlers
  const mockActions = {
    storytellerSubmit: () => console.log("Demo: storyteller submit"),
    playerSubmitCard: () => console.log("Demo: player submit"),
    playerVote: (cardId: string) => {
      console.log("Demo: player vote", cardId);
      setDemoVotedCardId(cardId);
      setDemoVotes((prev) => [...prev, { voterId: currentPlayerId, cardId }]);
    },
    advanceRound: () => console.log("Demo: advance round"),
    resetGame: () => console.log("Demo: reset game"),
    newDeck: () => console.log("Demo: new deck"),
    setAllowPlayerUploads: (allow: boolean) => {
      console.log("Demo: setAllowPlayerUploads", allow);
      setAllowPlayerUploads(allow);
    },
    setWinTarget: (target: number | null) => {
      console.log("Demo: setWinTarget", target);
      setWinTarget(target);
    },
    lockDeck: () => {
      console.log("Demo: lockDeck");
      setDeckLocked(true);
    },
    unlockDeck: () => {
      console.log("Demo: unlockDeck");
      setDeckLocked(false);
    },
    uploadImage: (imageData: string) => {
      console.log("Demo: uploadImage", imageData.substring(0, 50) + "...");
      const newImage = {
        id: `demo-img-${Date.now()}`,
        uploadedBy: currentPlayerId,
        imageData: imageData, // Include actual image data
      };
      setUploadedImages((prev) => [...prev, newImage]);
      setDeckSize((prev) => prev + 1);
    },
    deleteImage: (imageId: string) => {
      console.log("Demo: deleteImage", imageId);
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
      setDeckSize((prev) => Math.max(0, prev - 1));
    },
  };

  const testAnimation = () => {
    // Add exactly 1 point to each player
    const deltas = [
      { playerId: "1", delta: 1 },
      { playerId: "2", delta: 1 },
      { playerId: "3", delta: 1 },
      { playerId: "4", delta: 1 },
    ];

    // Get current scores or use defaults (starting from 0)
    const currentScores = customPlayerScores || {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
    };

    // Calculate new scores (cap at 29)
    const newScores = {
      "1": Math.min(29, currentScores["1"] + deltas[0].delta),
      "2": Math.min(29, currentScores["2"] + deltas[1].delta),
      "3": Math.min(29, currentScores["3"] + deltas[2].delta),
      "4": Math.min(29, currentScores["4"] + deltas[3].delta),
    };

    console.log("🎲 Test Animation - Round", animationRound + 1);
    console.log("Deltas:", deltas);
    console.log("New scores:", newScores);

    setCustomScoreDeltas(deltas);
    setCustomPlayerScores(newScores);
    setAnimationRound((prev) => prev + 1); // Increment to trigger new animation
  };

  const nextPhase = () => {
    setCurrentPhaseIndex((prev) => (prev + 1) % allPhases.length);
  };

  const prevPhase = () => {
    setCurrentPhaseIndex(
      (prev) => (prev - 1 + allPhases.length) % allPhases.length
    );
  };

  // NEW: Flow test functions
  const flowPlayers = [
    { id: "1", name: "You (Alice)", isStoryteller: false },
    { id: "2", name: "Bob (AI)", isStoryteller: false },
    { id: "3", name: "Charlie (AI)", isStoryteller: false },
  ];

  const getFlowStorytellerId = () => {
    return flowPlayers[flowStorytellerIndex].id;
  };

  // Generate flow test room state
  const generateFlowRoomState = (): RoomState => {
    const storytellerId = getFlowStorytellerId();
    const players = flowPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      score: flowPlayerScores[p.id as "1" | "2" | "3"],
      isAdmin: p.id === "1",
      isConnected: true,
      handSize: 6,
      tokenImage: null,
    }));

    const port = window.location.port || "3000";
    const currentUrl = `${window.location.protocol}//${window.location.hostname}:${port}`;

    const baseState: RoomState = {
      phase: flowPhase as any,
      players,
      allowPlayerUploads: true,
      deckSize: 100,
      deckLocked: true,
      deckImages: [],
      currentRound: flowRound,
      storytellerId,
      currentClue: flowCurrentClue,
      revealedCards: [],
      votes: [],
      lastScoreDeltas: flowLastDeltas,
      winTarget: 30,
      boardBackgroundImage: null,
      boardPattern: "snake",
      serverUrl: detectedServerUrl || currentUrl,
    };

    // Phase-specific data
    if (flowPhase === "VOTING" || flowPhase === "REVEAL") {
      // Generate revealed cards with actual image data
      baseState.revealedCards = flowSubmittedCards.map((sc) => ({
        cardId: sc.cardId,
        imageData: `https://picsum.photos/seed/${sc.cardId}/400/600`,
        position: sc.position || 0,
        playerId: sc.playerId, // Include playerId for card ownership
      })) as any;

      // For REVEAL, show votes and score deltas
      if (flowPhase === "REVEAL") {
        baseState.votes = flowVotes;
        baseState.lastScoreDeltas = flowLastDeltas;
      }
    }

    return baseState;
  };

  const generateFlowPlayerState = (): PlayerState => {
    return {
      playerId: "1",
      hand: [
        {
          id: "h1",
          imageData: "https://picsum.photos/seed/hand1/400/600",
          uploadedBy: "1",
        },
        {
          id: "h2",
          imageData: "https://picsum.photos/seed/hand2/400/600",
          uploadedBy: "1",
        },
        {
          id: "h3",
          imageData: "https://picsum.photos/seed/hand3/400/600",
          uploadedBy: "1",
        },
        {
          id: "h4",
          imageData: "https://picsum.photos/seed/hand4/400/600",
          uploadedBy: "1",
        },
        {
          id: "h5",
          imageData: "https://picsum.photos/seed/hand5/400/600",
          uploadedBy: "1",
        },
        {
          id: "h6",
          imageData: "https://picsum.photos/seed/hand6/400/600",
          uploadedBy: "1",
        },
      ],
      mySubmittedCardId:
        flowSubmittedCards.find((sc) => sc.playerId === "1")?.cardId || null,
      myVote: flowVotes.find((v) => v.voterId === "1")?.cardId || null,
    };
  };

  // Flow test action handlers
  const flowActions = {
    storytellerSubmit: (cardId: string, clue: string) => {
      const storytellerId = getFlowStorytellerId();
      console.log(
        "Flow: Storyteller",
        storytellerId,
        "submitted",
        cardId,
        clue
      );
      setFlowCurrentClue(clue);
      setFlowSubmittedCards([{ cardId, playerId: storytellerId, position: 0 }]);
      setFlowPhase("PLAYERS_CHOICE");

      // If player 1 is the storyteller, AI players need to submit cards
      // If AI is the storyteller, player 1 needs to submit their card manually
      if (storytellerId === "1") {
        // Player 1 is storyteller - AI players submit cards after a delay
        setTimeout(() => {
          const aiCards = [
            { cardId: "ai-card-2", playerId: "2", position: 1 },
            { cardId: "ai-card-3", playerId: "3", position: 2 },
          ];
          setFlowSubmittedCards((prev) => {
            // Shuffle all cards using a deterministic shuffle based on card IDs
            const allCards = [...prev, ...aiCards];
            // Create a deterministic seed from card IDs
            const seed = allCards
              .map((c) => c.cardId)
              .sort()
              .join("");
            const deterministicRandom = (idx: number) => {
              // Simple hash function for deterministic "random" ordering
              let hash = 0;
              const str = seed + idx;
              for (let i = 0; i < str.length; i++) {
                hash = (hash << 5) - hash + str.charCodeAt(i);
                hash = hash & hash;
              }
              return Math.abs(hash);
            };
            const shuffled = allCards.sort((a, b) => {
              const hashA = deterministicRandom(allCards.indexOf(a));
              const hashB = deterministicRandom(allCards.indexOf(b));
              return hashA - hashB;
            });
            return shuffled.map((card, idx) => ({ ...card, position: idx }));
          });
          setFlowPhase("VOTING");

          // AI players vote automatically
          setTimeout(() => {
            const stCard = { cardId, playerId: "1" };
            const allSubmittedCards = [
              stCard,
              { cardId: "ai-card-2", playerId: "2" },
              { cardId: "ai-card-3", playerId: "3" },
            ];
            const nonStorytellerCards = allSubmittedCards.filter(
              (sc) => sc.playerId !== "1"
            );

            // AI players vote
            const aiVotes: Array<{ voterId: string; cardId: string }> = [];

            // AI player 2 votes
            const shouldVoteCorrect2 = Math.random() > 0.5;
            let choice2: string | undefined;
            if (shouldVoteCorrect2) {
              choice2 = cardId; // Vote for storyteller's card
            } else if (nonStorytellerCards.length > 0) {
              const randomCard =
                nonStorytellerCards[
                  Math.floor(Math.random() * nonStorytellerCards.length)
                ];
              choice2 = randomCard?.cardId;
            }
            if (choice2) {
              aiVotes.push({ voterId: "2", cardId: choice2 });
            }

            // AI player 3 votes
            const shouldVoteCorrect3 = Math.random() > 0.5;
            let choice3: string | undefined;
            if (shouldVoteCorrect3) {
              choice3 = cardId; // Vote for storyteller's card
            } else if (nonStorytellerCards.length > 0) {
              const randomCard =
                nonStorytellerCards[
                  Math.floor(Math.random() * nonStorytellerCards.length)
                ];
              choice3 = randomCard?.cardId;
            }
            if (choice3) {
              aiVotes.push({ voterId: "3", cardId: choice3 });
            }

            setFlowVotes(aiVotes);

            // Go to REVEAL phase and calculate scores immediately
            const storytellerId = getFlowStorytellerId();
            const storytellerCard = flowSubmittedCards.find(
              (sc) => sc.playerId === storytellerId
            );

            const storytellerCardId = storytellerCard?.cardId;
            const votesForStoryteller = aiVotes.filter(
              (v) => v.cardId === storytellerCardId
            ).length;
            const totalVoters = aiVotes.length;

            const deltas: { [key: string]: number } = {
              "1": 0,
              "2": 0,
              "3": 0,
            };

            // If everyone or no one found the card, storyteller gets 0
            if (
              votesForStoryteller === 0 ||
              votesForStoryteller === totalVoters
            ) {
              deltas[storytellerId] = 0;
              // Others get 2 points
              flowPlayers.forEach((p) => {
                if (p.id !== storytellerId) {
                  deltas[p.id] = 2;
                }
              });
            } else {
              // Storyteller gets 3 points
              deltas[storytellerId] = 3;
              // Players who found it get 3 points
              aiVotes.forEach((vote) => {
                if (vote.cardId === storytellerCardId) {
                  deltas[vote.voterId] = 3;
                }
              });
            }

            // Players get 1 point for each vote on their card (not storyteller's)
            flowSubmittedCards.forEach((sc) => {
              if (sc.playerId !== storytellerId) {
                const votesForCard = aiVotes.filter(
                  (v) => v.cardId === sc.cardId
                ).length;
                deltas[sc.playerId] = (deltas[sc.playerId] || 0) + votesForCard;
              }
            });

            const deltaArray = Object.entries(deltas).map(
              ([playerId, delta]) => ({
                playerId,
                delta,
              })
            );

            setFlowLastDeltas(deltaArray);
            setFlowPlayerScores((prev) => ({
              "1": prev["1"] + deltas["1"],
              "2": prev["2"] + deltas["2"],
              "3": prev["3"] + deltas["3"],
            }));

            setFlowPhase("REVEAL");
          }, 2000);
        }, 1500);
      } else {
        // AI is storyteller - player 1 will manually submit card
        // AI players (not storyteller) will auto-submit after player 1 submits
        // This is handled in playerSubmitCard
      }
    },

    playerSubmitCard: (cardId: string) => {
      console.log("Flow: Player submitted card", cardId);
      const storytellerId = getFlowStorytellerId();

      setFlowSubmittedCards((prev) => [
        ...prev,
        { cardId, playerId: "1", position: prev.length },
      ]);

      // AI players (who are NOT the storyteller) submit after delay
      setTimeout(() => {
        const aiCards: Array<{
          cardId: string;
          playerId: string;
          position: number;
        }> = [];

        // Only add AI player 2's card if they're not the storyteller
        if (storytellerId !== "2") {
          aiCards.push({
            cardId: "ai-card-2",
            playerId: "2",
            position: flowSubmittedCards.length + aiCards.length + 1,
          });
        }

        // Only add AI player 3's card if they're not the storyteller
        if (storytellerId !== "3") {
          aiCards.push({
            cardId: "ai-card-3",
            playerId: "3",
            position: flowSubmittedCards.length + aiCards.length + 1,
          });
        }

        setFlowSubmittedCards((prev) => {
          const allCards = [...prev, ...aiCards];
          // Create a deterministic seed from card IDs
          const seed = allCards
            .map((c) => c.cardId)
            .sort()
            .join("");
          const deterministicRandom = (idx: number) => {
            // Simple hash function for deterministic "random" ordering
            let hash = 0;
            const str = seed + idx;
            for (let i = 0; i < str.length; i++) {
              hash = (hash << 5) - hash + str.charCodeAt(i);
              hash = hash & hash;
            }
            return Math.abs(hash);
          };
          const shuffled = allCards.sort((a, b) => {
            const hashA = deterministicRandom(allCards.indexOf(a));
            const hashB = deterministicRandom(allCards.indexOf(b));
            return hashA - hashB;
          });
          return shuffled.map((card, idx) => ({ ...card, position: idx }));
        });
        setFlowPhase("VOTING");
      }, 1500);
    },

    playerVote: (cardId: string) => {
      console.log("Flow: Player voted for", cardId);

      // Update votes with the player's vote
      setFlowVotes((prev) => {
        const newVotes = [...prev, { voterId: "1", cardId }];

        // AI players vote after delay
        setTimeout(() => {
          const storytellerId = getFlowStorytellerId();
          const storytellerCard = flowSubmittedCards.find(
            (sc) => sc.playerId === storytellerId
          );

          // AI players randomly vote (sometimes correctly, sometimes not)
          const aiVotes: Array<{ voterId: string; cardId: string }> = [];
          const nonStorytellerCards = flowSubmittedCards.filter(
            (sc) => sc.playerId !== storytellerId
          );

          // AI player 2 votes (if not storyteller)
          if (storytellerId !== "2") {
            // 50% chance to vote for storyteller's card, 50% for random other card
            const shouldVoteForStoryteller = Math.random() > 0.5;
            let cardChoice: string | undefined;

            if (shouldVoteForStoryteller && storytellerCard?.cardId) {
              cardChoice = storytellerCard.cardId;
            } else if (nonStorytellerCards.length > 0) {
              const randomCard =
                nonStorytellerCards[
                  Math.floor(Math.random() * nonStorytellerCards.length)
                ];
              // Don't vote for own card
              if (randomCard.playerId !== "2") {
                cardChoice = randomCard.cardId;
              } else if (storytellerCard?.cardId) {
                cardChoice = storytellerCard.cardId;
              }
            }

            if (cardChoice) {
              aiVotes.push({ voterId: "2", cardId: cardChoice });
            }
          }

          // AI player 3 votes (if not storyteller)
          if (storytellerId !== "3") {
            // 50% chance to vote for storyteller's card, 50% for random other card
            const shouldVoteForStoryteller = Math.random() > 0.5;
            let cardChoice: string | undefined;

            if (shouldVoteForStoryteller && storytellerCard?.cardId) {
              cardChoice = storytellerCard.cardId;
            } else if (nonStorytellerCards.length > 0) {
              const randomCard =
                nonStorytellerCards[
                  Math.floor(Math.random() * nonStorytellerCards.length)
                ];
              // Don't vote for own card
              if (randomCard.playerId !== "3") {
                cardChoice = randomCard.cardId;
              } else if (storytellerCard?.cardId) {
                cardChoice = storytellerCard.cardId;
              }
            }

            if (cardChoice) {
              aiVotes.push({ voterId: "3", cardId: cardChoice });
            }
          }

          // Update votes with AI votes and transition to REVEAL
          setFlowVotes((currentVotes) => {
            const allVotes = [...currentVotes, ...aiVotes];

            // Calculate scores immediately after all votes are in
            setTimeout(() => {
              const stId = getFlowStorytellerId();
              const stCard = flowSubmittedCards.find(
                (sc) => sc.playerId === stId
              );

              const stCardId = stCard?.cardId;
              const votesForStoryteller = allVotes.filter(
                (v: { cardId: string }) => v.cardId === stCardId
              ).length;
              const totalVoters = allVotes.length;

              const deltas: { [key: string]: number } = {
                "1": 0,
                "2": 0,
                "3": 0,
              };

              // If everyone or no one found the card, storyteller gets 0
              if (
                votesForStoryteller === 0 ||
                votesForStoryteller === totalVoters
              ) {
                deltas[stId] = 0;
                // Others get 2 points
                flowPlayers.forEach((p) => {
                  if (p.id !== stId) {
                    deltas[p.id] = 2;
                  }
                });
              } else {
                // Storyteller gets 3 points
                deltas[stId] = 3;
                // Players who found it get 3 points
                allVotes.forEach(
                  (vote: { cardId: string; voterId: string }) => {
                    if (vote.cardId === stCardId) {
                      deltas[vote.voterId] = 3;
                    }
                  }
                );
              }

              // Players get 1 point for each vote on their card (not storyteller's)
              flowSubmittedCards.forEach((sc) => {
                if (sc.playerId !== stId) {
                  const votesForCard = allVotes.filter(
                    (v: { cardId: string }) => v.cardId === sc.cardId
                  ).length;
                  deltas[sc.playerId] =
                    (deltas[sc.playerId] || 0) + votesForCard;
                }
              });

              const deltaArray = Object.entries(deltas).map(
                ([playerId, delta]) => ({
                  playerId,
                  delta,
                })
              );

              setFlowLastDeltas(deltaArray);
              setFlowPlayerScores((prev) => ({
                "1": prev["1"] + deltas["1"],
                "2": prev["2"] + deltas["2"],
                "3": prev["3"] + deltas["3"],
              }));

              setFlowPhase("REVEAL");
            }, 0);

            return allVotes;
          });
        }, 2000);

        return newVotes;
      });
    },

    advanceRound: () => {
      console.log("Flow: Advancing to next round");

      // Check for winner
      const maxScore = Math.max(
        flowPlayerScores["1"],
        flowPlayerScores["2"],
        flowPlayerScores["3"]
      );
      if (maxScore >= 30) {
        setFlowPhase("GAME_END");
        return;
      }

      // Rotate storyteller
      setFlowStorytellerIndex((prev) => (prev + 1) % 3);
      setFlowRound((prev) => prev + 1);
      setFlowPhase("STORYTELLER_CHOICE");
      setFlowSubmittedCards([]);
      setFlowVotes([]);
      setFlowCurrentClue("");
      setFlowLastDeltas([]);
    },

    resetGame: () => {
      console.log("Flow: Resetting game");
      setFlowPhase("STORYTELLER_CHOICE");
      setFlowRound(1);
      setFlowStorytellerIndex(0);
      setFlowSubmittedCards([]);
      setFlowVotes([]);
      setFlowCurrentClue("");
      setFlowPlayerScores({ "1": 0, "2": 0, "3": 0 });
      setFlowLastDeltas([]);
    },

    newDeck: () => {
      console.log("Flow: New deck");
      flowActions.resetGame();
    },
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only allow keyboard navigation in component mode
      if (demoMode === "component") {
        if (e.key === "ArrowLeft") {
          prevPhase();
        } else if (e.key === "ArrowRight") {
          nextPhase();
        } else if (e.key === "v" || e.key === "V") {
          // Cycle through modes: player -> admin -> spectator -> player
          setViewMode((prev) => {
            if (prev === "player") return "admin";
            if (prev === "admin") return "spectator";
            return "player";
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [demoMode]);

  // AUTO AI STORYTELLER: When player 1 is NOT the storyteller, AI automatically submits
  useEffect(() => {
    if (demoMode === "flow" && flowPhase === "STORYTELLER_CHOICE") {
      const storytellerId = getFlowStorytellerId();

      // If AI is the storyteller (not player 1), automatically submit after delay
      if (storytellerId !== "1") {
        console.log(
          `AI Storyteller ${storytellerId} choosing card and clue...`
        );

        setTimeout(() => {
          // AI picks a random card and clue
          const aiClues = [
            "Mystery and wonder",
            "A dream come true",
            "Lost in time",
            "Pure happiness",
            "Dark and stormy",
            "Adventure awaits",
          ];
          const randomClue =
            aiClues[Math.floor(Math.random() * aiClues.length)];
          const aiCardId = `ai-storyteller-card-${storytellerId}`;

          flowActions.storytellerSubmit(aiCardId, randomClue);
        }, 2000); // 2 second delay for AI to "think"
      }
    }
  }, [demoMode, flowPhase, flowStorytellerIndex]);

  return (
    <div className="demo-page">
      {/* Minimized Combined Controls */}
      <div
        className="demo-controls-mini"
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          zIndex: 10000,
          display: "flex",
          gap: "4px",
          background: "rgba(26, 26, 46, 0.85)",
          padding: "4px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          fontSize: "11px",
        }}
      >
        {/* Mode Toggle */}
        <button
          onClick={() =>
            setDemoMode(demoMode === "component" ? "flow" : "component")
          }
          style={{
            padding: "4px 8px",
            borderRadius: "6px",
            border: "1px solid #4a90e2",
            background: "#4a90e2",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "11px",
            whiteSpace: "nowrap",
          }}
          title={
            demoMode === "component"
              ? "Switch to Flow Test"
              : "Switch to Component View"
          }
        >
          {demoMode === "component" ? "📱" : "🎮"}
        </button>

        {demoMode === "component" && (
          <>
            {/* Phase Navigation */}
            <button
              onClick={prevPhase}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "rgba(74, 144, 226, 0.2)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "11px",
              }}
              title="Previous Phase"
            >
              ◀
            </button>
            <span
              style={{
                padding: "4px 6px",
                color: "#fff",
                fontSize: "10px",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
              }}
            >
              {currentPhaseIndex + 1}/{allPhases.length}
            </span>
            <button
              onClick={nextPhase}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "rgba(74, 144, 226, 0.2)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "11px",
              }}
              title="Next Phase"
            >
              ▶
            </button>

            {/* View Mode */}
            <button
              onClick={() =>
                setViewMode(
                  viewMode === "player"
                    ? "admin"
                    : viewMode === "admin"
                    ? "spectator"
                    : "player"
                )
              }
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "rgba(74, 144, 226, 0.2)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "11px",
              }}
              title="Cycle View Mode"
            >
              {viewMode === "player"
                ? "🎮"
                : viewMode === "admin"
                ? "👑"
                : "📺"}
            </button>

            {(currentPhase === "STORYTELLER_CHOICE" ||
              currentPhase === "PLAYERS_CHOICE" ||
              currentPhase === "VOTING") &&
              viewMode === "admin" && (
                <button
                  onClick={() => setForcePlayerView(!forcePlayerView)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    background: forcePlayerView
                      ? "#4a90e2"
                      : "rgba(74, 144, 226, 0.2)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "11px",
                  }}
                  title="Toggle Storyteller/Player"
                >
                  {forcePlayerView ? "👤" : "🎭"}
                </button>
              )}

            {currentPhase === "REVEAL" && (
              <button
                onClick={testAnimation}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid #555",
                  background: "rgba(74, 144, 226, 0.2)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
                title="Test Animation"
              >
                🎲
              </button>
            )}
          </>
        )}

        {demoMode === "flow" && (
          <span
            style={{
              padding: "4px 6px",
              color: "#fff",
              fontSize: "10px",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>R{flowRound}</span>
            <span>|</span>
            <span>
              {flowPlayerScores["1"]}/{flowPlayerScores["2"]}/
              {flowPlayerScores["3"]}
            </span>
          </span>
        )}
      </div>

      {demoMode === "component" ? (
        <>
          {/* Game Screen */}
          <div className="demo-screen">
            <UnifiedGamePage
              roomState={mockRoomState}
              playerState={mockPlayerState}
              playerId={currentPlayerId}
              clientId="demo-client-123"
              socket={null}
              onJoin={mockActions.storytellerSubmit}
              onJoinSpectator={() => console.log("Demo: spectator join")}
              onLeave={() => console.log("Demo: leave")}
              onUploadImage={mockActions.uploadImage}
              onDeleteImage={mockActions.deleteImage}
              onSetAllowPlayerUploads={mockActions.setAllowPlayerUploads}
              onSetBoardBackground={() => console.log("Demo: set board background")}
              onSetBoardPattern={() => console.log("Demo: set board pattern")}
              onStartGame={mockActions.storytellerSubmit}
              onChangeName={mockActions.storytellerSubmit}
              onStorytellerSubmit={mockActions.storytellerSubmit}
              onPlayerSubmitCard={mockActions.playerSubmitCard}
              onPlayerVote={mockActions.playerVote}
              onAdvanceRound={mockActions.advanceRound}
              onResetGame={mockActions.resetGame}
              onNewDeck={mockActions.newDeck}
              onUploadTokenImage={() => console.log("Demo: upload token")}
            />
          </div>
        </>
      ) : (
        <>
          {/* Flow Test Mode */}
          <div className="demo-screen">
            <UnifiedGamePage
              roomState={generateFlowRoomState()}
              playerState={generateFlowPlayerState()}
              playerId="1"
              clientId="flow-test-client"
              socket={
                {
                  emit: (event: string) => {
                    if (event === "advanceRound") {
                      flowActions.advanceRound();
                    }
                  },
                } as any
              }
              onJoin={() => {}}
              onJoinSpectator={() => {}}
              onLeave={() => {}}
              onUploadImage={() => {}}
              onDeleteImage={() => {}}
              onSetAllowPlayerUploads={() => {}}
              onSetBoardBackground={() => {}}
              onSetBoardPattern={() => {}}
              onStartGame={() => {}}
              onChangeName={() => {}}
              onStorytellerSubmit={flowActions.storytellerSubmit}
              onPlayerSubmitCard={flowActions.playerSubmitCard}
              onPlayerVote={flowActions.playerVote}
              onAdvanceRound={flowActions.advanceRound}
              onResetGame={flowActions.resetGame}
              onNewDeck={flowActions.newDeck}
              onUploadTokenImage={() => console.log("Flow: upload token")}
            />
          </div>
        </>
      )}
    </div>
  );
}
