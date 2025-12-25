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
      submittedPlayerIds: [],
      revealedCards: [],
      votes: [],
      lastScoreDeltas: [],
      winTarget: 30,
      boardBackgroundImage: null,
      boardPattern: "spiral",
      language: "en",
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
    submittedPlayerIds: [],
    revealedCards: [],
    votes: [],
    lastScoreDeltas: [],
    winTarget: 30,
    boardBackgroundImage: null,
    boardPattern: "spiral",
    language: "en",
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
        // Simulate: storyteller + 2 players have submitted, 2 still pending
        submittedPlayerIds: ["1", "2", "3"], // Alice (storyteller), Bob, Charlie submitted
        // Diana still needs to submit
      };

    case "VOTING":
      return {
        ...baseState,
        phase: "VOTING",
        submittedPlayerIds: ["1", "2", "3", "4"], // All players have submitted cards
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
        // Simulate: Bob and Charlie have voted, Diana still needs to vote
        votes: [
          { voterId: "2", cardId: "c4" }, // Bob voted
          { voterId: "3", cardId: "c4" }, // Charlie voted
        ],
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
        submittedPlayerIds: ["1", "2", "3", "4"], // All players submitted
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
  const [flowPhase, setFlowPhase] = useState<string>("CONFIG"); // Start with config
  const [flowRound, setFlowRound] = useState(1);
  const [flowStorytellerIndex, setFlowStorytellerIndex] = useState(0);
  const [flowSubmittedCards, setFlowSubmittedCards] = useState<
    Array<{ cardId: string; playerId: string; position?: number }>
  >([]);
  const [flowVotes, setFlowVotes] = useState<
    Array<{ voterId: string; cardId: string }>
  >([]);
  const [flowCurrentClue, setFlowCurrentClue] = useState("");
  const [flowPlayerScores, setFlowPlayerScores] = useState<{ [key: string]: number }>({});
  const [flowLastDeltas, setFlowLastDeltas] = useState<
    Array<{ playerId: string; delta: number }>
  >([]);
  
  // Flow configuration
  const [flowNumPlayers, setFlowNumPlayers] = useState(3); // Total players (including user)
  const [flowWinTarget, setFlowWinTarget] = useState(30);
  const [flowBoardPattern, setFlowBoardPattern] = useState<"snake" | "spiral">("spiral");
  const [flowAllowPlayerUploads, setFlowAllowPlayerUploads] = useState(true);

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
  const [boardPattern, setBoardPattern] = useState<"snake" | "spiral">("spiral");
  const [boardBackgroundImage, setBoardBackgroundImage] = useState<string | null>(null);
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
    mockRoomState.boardPattern = boardPattern;
    mockRoomState.boardBackgroundImage = boardBackgroundImage;
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
  const aiNames = [
    "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Iris", 
    "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tina"
  ];
  
  const flowPlayers = [
    { id: "1", name: "You (Alice)", isStoryteller: false },
    ...Array.from({ length: flowNumPlayers - 1 }, (_, i) => ({
      id: String(i + 2),
      name: `${aiNames[i]} (AI)`,
      isStoryteller: false,
    })),
  ];
  
  // Initialize scores for all players
  if (Object.keys(flowPlayerScores).length === 0 && flowNumPlayers > 0) {
    const initialScores: { [key: string]: number } = {};
    flowPlayers.forEach(p => {
      initialScores[p.id] = 0;
    });
    setFlowPlayerScores(initialScores);
  }

  const getFlowStorytellerId = () => {
    return flowPlayers[flowStorytellerIndex].id;
  };

  // Generate flow test room state
  const generateFlowRoomState = (): RoomState => {
    const storytellerId = getFlowStorytellerId();
    const players = flowPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      score: flowPlayerScores[p.id] || 0,
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
      allowPlayerUploads: flowAllowPlayerUploads,
      deckSize: 100,
      deckLocked: true,
      deckImages: [],
      currentRound: flowRound,
      storytellerId,
      currentClue: flowCurrentClue,
      submittedPlayerIds: [],
      revealedCards: [],
      votes: [],
      lastScoreDeltas: flowLastDeltas,
      winTarget: flowWinTarget,
      boardBackgroundImage: boardBackgroundImage,
      boardPattern: flowBoardPattern,
      language: "en",
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
          // Generate AI cards for all AI players (2 through flowNumPlayers)
          const aiCards = flowPlayers
            .filter(p => p.id !== "1") // Exclude player 1 (the user)
            .map((p, idx) => ({
              cardId: `ai-card-${p.id}`,
              playerId: p.id,
              position: idx + 1,
            }));
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
            const nonStorytellerCards = flowSubmittedCards.filter(
              (sc) => sc.playerId !== storytellerId
            );

            // AI players vote (all AI players except storyteller)
            const aiVotes: Array<{ voterId: string; cardId: string }> = [];
            
            flowPlayers.forEach(p => {
              // Skip player 1 (user) and storyteller
              if (p.id === "1" || p.id === storytellerId) return;
              
              // 50% chance to vote for storyteller's card, 50% for random other card
              const shouldVoteCorrect = Math.random() > 0.5;
              let cardChoice: string | undefined;
              
              if (shouldVoteCorrect) {
                cardChoice = cardId; // Vote for storyteller's card
              } else if (nonStorytellerCards.length > 0) {
                const randomCard =
                  nonStorytellerCards[
                    Math.floor(Math.random() * nonStorytellerCards.length)
                  ];
                cardChoice = randomCard?.cardId;
              }
              
              if (cardChoice) {
                aiVotes.push({ voterId: p.id, cardId: cardChoice });
              }
            });

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

            // Initialize deltas for all players
            const deltas: { [key: string]: number } = {};
            flowPlayers.forEach(p => {
              deltas[p.id] = 0;
            });

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
            setFlowPlayerScores((prev) => {
              const newScores = { ...prev };
              flowPlayers.forEach(p => {
                newScores[p.id] = (prev[p.id] || 0) + (deltas[p.id] || 0);
              });
              return newScores;
            });

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
      const currentFlowPlayers = flowPlayers; // Capture current value

      // Add player's card and AI cards together
      setFlowSubmittedCards((prev) => {
        // Player's card
        const playerCard = { cardId, playerId: "1", position: prev.length };
        
        // Generate AI cards for all AI players except storyteller
        const aiCards = currentFlowPlayers
          .filter(p => p.id !== "1" && p.id !== storytellerId) // Exclude user and storyteller
          .map((p, idx) => ({
            cardId: `ai-card-${p.id}`,
            playerId: p.id,
            position: prev.length + idx + 1,
          }));

        // Combine all cards
        const allCards = [...prev, playerCard, ...aiCards];
        
        // Shuffle all cards
        const seed = allCards
          .map((c) => c.cardId)
          .sort()
          .join("");
        const deterministicRandom = (idx: number) => {
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
      
      // Transition to voting after delay
      setTimeout(() => {
        setFlowPhase("VOTING");
      }, 1500);
    },

    playerVote: (cardId: string) => {
      console.log("Flow: Player voted for", cardId);
      
      // Just add player's vote - AI voting is handled automatically in useEffect
      setFlowVotes((prev) => [...prev, { voterId: "1", cardId }]);
    },

    advanceRound: () => {
      console.log("Flow: Advancing to next round");

      // Check for winner
      const maxScore = Math.max(...Object.values(flowPlayerScores));
      if (maxScore >= flowWinTarget) {
        setFlowPhase("GAME_END");
        return;
      }

      // Rotate storyteller
      setFlowStorytellerIndex((prev) => (prev + 1) % flowNumPlayers);
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
      const resetScores: { [key: string]: number } = {};
      flowPlayers.forEach(p => {
        resetScores[p.id] = 0;
      });
      setFlowPlayerScores(resetScores);
      setFlowLastDeltas([]);
    },

    newDeck: () => {
      console.log("Flow: New deck");
      flowActions.resetGame();
    },
    
    setAllowPlayerUploads: (allow: boolean) => {
      console.log("Flow: setAllowPlayerUploads", allow);
      setFlowAllowPlayerUploads(allow);
    },
    
    setWinTarget: (target: number | null) => {
      console.log("Flow: setWinTarget", target);
      if (target) setFlowWinTarget(target);
    },
    
    setBoardBackground: (imageData: string | null) => {
      console.log("Flow: setBoardBackground", imageData ? "set" : "cleared");
      setBoardBackgroundImage(imageData);
    },
    
    setBoardPattern: (pattern: "snake" | "spiral") => {
      console.log("Flow: setBoardPattern", pattern);
      setFlowBoardPattern(pattern);
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

  // AUTO AI VOTING: All AI players automatically vote when VOTING phase starts
  useEffect(() => {
    if (demoMode === "flow" && flowPhase === "VOTING") {
      const storytellerId = getFlowStorytellerId();
      const currentSubmittedCards = [...flowSubmittedCards];
      const currentPlayers = [...flowPlayers];

      console.log("AI players voting automatically...");

      setTimeout(() => {
        const storytellerCard = currentSubmittedCards.find(
          (sc) => sc.playerId === storytellerId
        );
        
        const nonStorytellerCards = currentSubmittedCards.filter(
          (sc) => sc.playerId !== storytellerId
        );

        // Generate AI votes
        const aiVotes: Array<{ voterId: string; cardId: string }> = [];
        
        currentPlayers.forEach(p => {
          // Skip player 1 (user) and storyteller
          if (p.id === "1" || p.id === storytellerId) return;
          
          // 50% chance to vote for storyteller's card, 50% for random other card
          const shouldVoteForStoryteller = Math.random() > 0.5;
          let cardChoice: string | undefined;

          if (shouldVoteForStoryteller && storytellerCard?.cardId) {
            cardChoice = storytellerCard.cardId;
          } else if (nonStorytellerCards.length > 0) {
            // Pick a random card that's not their own
            const eligibleCards = nonStorytellerCards.filter(c => c.playerId !== p.id);
            if (eligibleCards.length > 0) {
              const randomCard =
                eligibleCards[
                  Math.floor(Math.random() * eligibleCards.length)
                ];
              cardChoice = randomCard.cardId;
            } else if (storytellerCard?.cardId) {
              cardChoice = storytellerCard.cardId;
            }
          }

          if (cardChoice) {
            aiVotes.push({ voterId: p.id, cardId: cardChoice });
          }
        });

        // Add AI votes
        setFlowVotes((currentVotes) => {
          const allVotes = [...currentVotes, ...aiVotes];
          
          // Calculate scores
          const stCard = currentSubmittedCards.find(
            (sc) => sc.playerId === storytellerId
          );
          const stCardId = stCard?.cardId;
          const votesForStoryteller = allVotes.filter(
            (v) => v.cardId === stCardId
          ).length;
          const totalVoters = allVotes.length;

          // Initialize deltas for all players
          const deltas: { [key: string]: number } = {};
          currentPlayers.forEach(p => {
            deltas[p.id] = 0;
          });

          // Scoring logic
          if (
            votesForStoryteller === 0 ||
            votesForStoryteller === totalVoters
          ) {
            deltas[storytellerId] = 0;
            currentPlayers.forEach((p) => {
              if (p.id !== storytellerId) {
                deltas[p.id] = 2;
              }
            });
          } else {
            deltas[storytellerId] = 3;
            allVotes.forEach((vote) => {
              if (vote.cardId === stCardId) {
                deltas[vote.voterId] = 3;
              }
            });
          }

          // Bonus points for votes on player's cards
          currentSubmittedCards.forEach((sc) => {
            if (sc.playerId !== storytellerId) {
              const votesForCard = allVotes.filter(
                (v) => v.cardId === sc.cardId
              ).length;
              deltas[sc.playerId] =
                (deltas[sc.playerId] || 0) + votesForCard;
            }
          });

          const deltaArray = Object.entries(deltas).map(
            ([playerId, delta]) => ({ playerId, delta })
          );

          setFlowLastDeltas(deltaArray);
          setFlowPlayerScores((prev) => {
            const newScores = { ...prev };
            currentPlayers.forEach(p => {
              newScores[p.id] = (prev[p.id] || 0) + (deltas[p.id] || 0);
            });
            return newScores;
          });

          // Transition to REVEAL
          setTimeout(() => {
            setFlowPhase("REVEAL");
          }, 500);

          return allVotes;
        });
      }, 2500); // 2.5 second delay for AI to "vote"
    }
  }, [demoMode, flowPhase, flowSubmittedCards, flowPlayers]);

  // Start game with selected configuration
  const startFlowGame = () => {
    console.log("Starting flow game with config:", {
      players: flowNumPlayers,
      winTarget: flowWinTarget,
      boardPattern: flowBoardPattern,
      allowPlayerUploads: flowAllowPlayerUploads,
    });
    
    // Initialize scores
    const initialScores: { [key: string]: number } = {};
    flowPlayers.forEach(p => {
      initialScores[p.id] = 0;
    });
    setFlowPlayerScores(initialScores);
    
    setFlowPhase("STORYTELLER_CHOICE");
  };

  return (
    <div className="demo-page">
      {/* Configuration Screen for Flow Mode */}
      {demoMode === "flow" && flowPhase === "CONFIG" && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            padding: "40px",
            borderRadius: "20px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          }}>
            <h2 style={{ marginTop: 0, color: "#1a1a2e", fontSize: "28px", marginBottom: "30px" }}>
              🎮 Configure Demo Game
            </h2>
            
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#1a1a2e", fontSize: "16px", fontWeight: "bold" }}>
                Number of Players (Total: {flowNumPlayers})
              </label>
              <input 
                type="range"
                min="2"
                max="20"
                value={flowNumPlayers}
                onChange={(e) => setFlowNumPlayers(Number(e.target.value))}
                style={{ width: "100%", height: "8px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "14px", color: "#666" }}>
                <span>You + 1 AI</span>
                <span>{flowNumPlayers - 1} AI Players</span>
                <span>You + 19 AI</span>
              </div>
            </div>
            
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#1a1a2e", fontSize: "16px", fontWeight: "bold" }}>
                Win Target: {flowWinTarget} points
              </label>
              <input 
                type="range"
                min="10"
                max="40"
                step="1"
                value={flowWinTarget}
                onChange={(e) => setFlowWinTarget(Number(e.target.value))}
                style={{ width: "100%", height: "8px" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "14px", color: "#666" }}>
                <span>10 pts (Quick)</span>
                <span>20 pts</span>
                <span>30 pts (Normal)</span>
                <span>40 pts (Long)</span>
              </div>
            </div>
            
            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "10px", color: "#1a1a2e", fontSize: "16px", fontWeight: "bold" }}>
                Board Pattern
              </label>
              <div style={{ display: "flex", gap: "15px" }}>
                <button 
                  onClick={() => setFlowBoardPattern("spiral")}
                  style={{
                    flex: 1,
                    padding: "15px",
                    border: flowBoardPattern === "spiral" ? "3px solid #4a90e2" : "2px solid #ddd",
                    background: flowBoardPattern === "spiral" ? "#e3f2fd" : "white",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  🌀 Spiral
                </button>
                <button 
                  onClick={() => setFlowBoardPattern("snake")}
                  style={{
                    flex: 1,
                    padding: "15px",
                    border: flowBoardPattern === "snake" ? "3px solid #4a90e2" : "2px solid #ddd",
                    background: flowBoardPattern === "snake" ? "#e3f2fd" : "white",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  🐍 Snake
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input 
                  type="checkbox"
                  checked={flowAllowPlayerUploads}
                  onChange={(e) => setFlowAllowPlayerUploads(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
                <span style={{ color: "#1a1a2e", fontSize: "16px" }}>
                  Allow player uploads
                </span>
              </label>
            </div>
            
            <button 
              onClick={startFlowGame}
              style={{
                width: "100%",
                padding: "18px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "20px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              🎲 Start Demo Game
            </button>
          </div>
        </div>
      )}
      
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
          onClick={() => {
            if (demoMode === "component") {
              setDemoMode("flow");
              setFlowPhase("CONFIG"); // Show config screen when switching to flow
            } else {
              setDemoMode("component");
            }
          }}
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

        {demoMode === "flow" && flowPhase !== "CONFIG" && (
          <>
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
              <span>👥{flowNumPlayers}</span>
              <span>|</span>
              <span>R{flowRound}</span>
              <span>|</span>
              <span>🎯{flowWinTarget}</span>
            </span>
            <button
              onClick={() => setFlowPhase("CONFIG")}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #555",
                background: "rgba(74, 144, 226, 0.2)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "11px",
              }}
              title="Back to Config"
            >
              ⚙️
            </button>
          </>
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
              isDemoMode={true}
              onJoin={mockActions.storytellerSubmit}
              onJoinSpectator={() => console.log("Demo: spectator join")}
              onLeave={() => console.log("Demo: leave")}
              onUploadImage={mockActions.uploadImage}
              onDeleteImage={mockActions.deleteImage}
              onSetAllowPlayerUploads={mockActions.setAllowPlayerUploads}
              onSetBoardBackground={(imageData) => {
                console.log("Demo: set board background", imageData ? "image set" : "image cleared");
                setBoardBackgroundImage(imageData);
              }}
              onSetBoardPattern={(pattern) => {
                console.log("Demo: set board pattern", pattern);
                setBoardPattern(pattern);
              }}
              onSetLanguage={(language) => {
                console.log("Demo: set language", language);
              }}
              onSetWinTarget={(target) => {
                console.log("Demo: set win target", target);
                setWinTarget(target);
              }}
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
              isDemoMode={true}
              onJoin={() => {}}
              onJoinSpectator={() => {}}
              onLeave={() => {}}
              onUploadImage={mockActions.uploadImage}
              onDeleteImage={mockActions.deleteImage}
              onSetAllowPlayerUploads={flowActions.setAllowPlayerUploads}
              onSetBoardBackground={flowActions.setBoardBackground}
              onSetBoardPattern={flowActions.setBoardPattern}
              onSetLanguage={() => console.log("Flow: set language")}
              onSetWinTarget={flowActions.setWinTarget}
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
