import { z } from "zod";

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters").max(50),
  email:    z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Document Schemas ─────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  title:       z.string().min(1).max(255).default("Untitled"),
  emoji:       z.string().max(10).optional(),
  workspaceId: z.string().uuid(),
  parentId:    z.string().uuid().optional(),
});

export const updateDocumentSchema = z.object({
  id:      z.string().uuid(),
  title:   z.string().min(1).max(255).optional(),
  content: z.string().optional(), // Encrypted ciphertext
  emoji:   z.string().max(10).optional(),
  isPublic: z.boolean().optional(),
});

export const deleteDocumentSchema = z.object({
  id: z.string().uuid(),
});

// ─── Workspace Schemas ────────────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").max(80),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type LoginInput            = z.infer<typeof loginSchema>;
export type RegisterInput         = z.infer<typeof registerSchema>;
export type CreateDocumentInput   = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput   = z.infer<typeof updateDocumentSchema>;
export type CreateWorkspaceInput  = z.infer<typeof createWorkspaceSchema>;
