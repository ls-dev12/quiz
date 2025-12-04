import Fastify from "fastify";
import cors from "@fastify/cors";
import { Quiz } from "./routes/quiz";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: "*",
  methods: ["POST", "OPTIONS"],
});

app.register(Quiz);

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3333,
      host: "0.0.0.0", // <- permite conexões externas
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
