import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt, buildUserPrompt, } from "./prompt";
import { generateId } from "./utils/id";
import fs from "fs";
import { quizResultSchema } from "./quizResult";
const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
export async function* generateQuiz(input) {
    const diretrizes = fs.readFileSync("knowledge/diretrizes.md", "utf-8");
    const systemPrompt = `${buildSystemPrompt()}\n\n${diretrizes}`;
    const userPrompt = `${buildUserPrompt(input)}

DADOS OBRIGATÓRIOS (USE EXATAMENTE ESTES VALORES):
- Tema: ${input.prompt}
- Nível de dificuldade: ${input.nivel_de_dificuldade}
- Quantidade de alternativas por pergunta: ${input.quantidade_alternativas}

Gere APENAS as perguntas, mantendo os valores acima EXATAMENTE como fornecidos.`;
    const response = await client.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: systemPrompt,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    tema: {
                        type: "string",
                        description: "O tema EXATO fornecido pelo usuário",
                    },
                    nivel_de_dificuldade: {
                        type: "string",
                        description: "O nível EXATO fornecido pelo usuário",
                    },
                    quantidade_de_perguntas: {
                        type: "number",
                        description: "Quantidade EXATA de perguntas geradas",
                    },
                    quantidade_alternativas: {
                        type: "number",
                        description: "Quantidade EXATA de alternativas por pergunta",
                    },
                    perguntas: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                enunciado: { type: "string" },
                                alternativas: { type: "array", items: { type: "string" } },
                                correta: { type: "number" },
                                dica: { type: "string" },
                                explicacao: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    });
    let text = "";
    for await (const chunk of response) {
        if (chunk.text)
            text += chunk.text;
    }
    const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    let parsed;
    try {
        parsed = JSON.parse(clean);
        parsed.tema = input.prompt;
        parsed.nivel_de_dificuldade = input.nivel_de_dificuldade;
        parsed.quantidade_alternativas = input.quantidade_alternativas;
        parsed.quantidade_de_perguntas = parsed.perguntas.length;
        quizResultSchema.parse(parsed);
    }
    catch (err) {
        console.error("JSON inválido gerado pela IA:", clean);
        throw new Error("IA gerou JSON inválido.");
    }
    yield `json-event:${JSON.stringify(parsed)}`;
    const quizId = generateId("quiz");
    yield `id-event:${quizId}`;
}
