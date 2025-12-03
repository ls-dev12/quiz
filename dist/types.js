import { z } from "zod";
export const quizSchema = z.object({
    prompt: z.string().min(3).max(200),
    quantidade_alternativas: z.number().int().min(2).max(4),
    nivel_de_dificuldade: z.enum(["facil", "medio", "dificil"])
});
