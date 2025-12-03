import z from "zod";

export const quizResultSchema = z.object({
  tema: z.string(),
  nivel_de_dificuldade: z.string(),
  quantidade_de_perguntas: z.number(),
  quantidade_alternativas: z.number().int().min(2).max(4),
  perguntas: z.array(
    z.object({
      enunciado: z.string(),
      alternativas: z.array(z.string()),
      correta: z.number(),
      dica: z.string(),
      explicacao: z.string(),
    })
  )
});

export type QuizResult = z.infer<typeof quizResultSchema>;
