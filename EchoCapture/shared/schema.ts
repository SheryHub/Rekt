import { z } from "zod";

export const recordingSchema = z.object({
  id: z.string(),
  type: z.enum(['voice', 'video']),
  timestamp: z.number(),
  size: z.number(),
  duration: z.number(),
  encrypted: z.boolean(),
});

export const deviceTokenSchema = z.object({
  token: z.string(),
  createdAt: z.number(),
});

export const voiceSampleSchema = z.object({
  id: z.string(),
  phrase: z.string(),
  audioData: z.instanceof(ArrayBuffer),
  timestamp: z.number(),
});

export const appSettingsSchema = z.object({
  startPhrase: z.string().default("start recording"),
  stopPhrase: z.string().default("stop recording"),
  recordingMode: z.enum(['voice', 'video']).default('voice'),
  isListening: z.boolean().default(false),
  theme: z.enum(['light', 'dark']).default('light'),
});

export type Recording = z.infer<typeof recordingSchema>;
export type DeviceToken = z.infer<typeof deviceTokenSchema>;
export type VoiceSample = z.infer<typeof voiceSampleSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
