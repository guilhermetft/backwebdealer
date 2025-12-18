import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import cadastroRoutes from "./routes/cadastro.js";
import equipesRoutes from "./routes/equipes.js";
import tarefasRoutes from "./routes/tarefas.js";
import calendarioRoutes from "./routes/calendario.js";
import projetosRoutes from "./routes/projetos.js";
import chatRoutes from "./routes/chat.js";
import configuracaoRoutes from "./routes/configuracao.js";
import solicitacoesRoutes from "./routes/solicitacoes.js";

const app = express();

app.use(
  cors({
    origin: ["https://2025-2-p2-tiapn-webdealer.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.use("/", cadastroRoutes);
app.use("/api", equipesRoutes);
app.use("/tarefas", tarefasRoutes);
app.use("/calendario", calendarioRoutes);
app.use("/chat", chatRoutes);
app.use("/projetos", projetosRoutes);
app.use("/configuracoes", configuracaoRoutes);
app.use("/solicitacoes", solicitacoesRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`✅ Servidor rodando na porta ${port}`)
);
