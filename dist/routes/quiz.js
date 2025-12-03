import { quizSchema } from "../types";
import { generateQuiz } from "../agent";
export async function Quiz(app) {
    app.post("/quiz", async (req, res) => {
        res.raw.setHeader("Access-Control-Allow-Origin", "*");
        res.raw.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.raw.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.raw.setHeader("Content-Type", "text/event-stream");
        res.raw.setHeader("Cache-Control", "no-cache");
        res.raw.setHeader("Connection", "keep-alive");
        const parse = quizSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).send({
                error: "ValidationError",
                details: parse.error.flatten((issue) => issue.message),
            });
        }
        try {
            for await (const delta of generateQuiz(parse.data)) {
                if (delta.startsWith("json-event:")) {
                    const jsonText = delta.replace("json-event:", "");
                    res.raw.write(`event: quiz-json\n`);
                    res.raw.write(`data: ${jsonText}\n\n`);
                    continue;
                }
                if (delta.startsWith("id-event:")) {
                    const quizId = delta.replace("id-event:", "");
                    res.raw.write(`event: quiz-id\n`);
                    res.raw.write(`data: ${quizId}\n\n`);
                    continue;
                }
            }
            res.raw.end();
        }
        catch (err) {
            res.log.error(err);
            const errorObject = err instanceof Error
                ? {
                    message: err.message,
                    name: err.name || "InternalError",
                }
                : { message: "Erro desconhecido." };
            res.raw.write(`event: error\n`);
            res.raw.write(`data: ${JSON.stringify(errorObject)}\n\n`); // Envia o erro 
            return res.raw.end();
        }
        return res;
    });
}
