import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize string input to prevent XSS attacks
 * Removes all HTML tags and dangerous content
 */
function sanitizeString(str: string): string {
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] }).trim();
}

export const joinSchema = z.object({
  name: z.string().min(1).max(50).transform(sanitizeString),
  clientId: z.string(),
});

export const adminSetDeckModeSchema = z.object({
  mode: z.enum(["HOST_ONLY", "PLAYERS_ONLY", "MIXED"]),
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
  clue: z.string().min(1).max(200).transform(sanitizeString),
});

export const playerSubmitCardSchema = z.object({
  cardId: z.string(),
});

export const playerVoteSchema = z.object({
  cardId: z.string(),
});

export const changeNameSchema = z.object({
  newName: z.string().min(1).max(50).transform(sanitizeString),
});

export const kickPlayerSchema = z.object({
  targetPlayerId: z.string(),
});

export const promotePlayerSchema = z.object({
  targetPlayerId: z.string(),
});

export const reconnectSchema = z.object({
  clientId: z.string(),
});

export const joinSpectatorSchema = z.object({
  clientId: z.string(),
});

export const adminSetAllowPlayerUploadsSchema = z.object({
  allow: z.boolean(),
});

export const uploadTokenImageSchema = z.object({
  imageData: z.string().nullable(), // base64 image data or null to remove
});

export const setBoardBackgroundSchema = z.object({
  imageData: z.string().nullable(), // base64 image data or null to use default
});

export const setBoardPatternSchema = z.object({
  pattern: z.enum(["snake", "spiral"]), // snake (zigzag) or spiral (snail) pattern
});
