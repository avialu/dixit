import { z } from 'zod';

export const joinSchema = z.object({
  name: z.string().min(1).max(50),
  clientId: z.string(),
});

export const adminSetDeckModeSchema = z.object({
  mode: z.enum(['HOST_ONLY', 'PLAYERS_ONLY', 'MIXED']),
});

export const adminSetWinTargetSchema = z.object({
  target: z.union([
    z.number().int().min(1).max(100), // Allow any integer from 1 to 100
    z.null(), // Allow null for unlimited play
  ]),
});

export const uploadImageSchema = z.object({
  imageData: z.string(), // base64 image data
});

export const deleteImageSchema = z.object({
  imageId: z.string(),
});

export const storytellerSubmitSchema = z.object({
  cardId: z.string(),
  clue: z.string().min(1).max(200),
});

export const playerSubmitCardSchema = z.object({
  cardId: z.string(),
});

export const playerVoteSchema = z.object({
  cardId: z.string(),
});

export const changeNameSchema = z.object({
  newName: z.string().min(1).max(50),
});

export const kickPlayerSchema = z.object({
  targetPlayerId: z.string(),
});

export const promotePlayerSchema = z.object({
  targetPlayerId: z.string(),
});

