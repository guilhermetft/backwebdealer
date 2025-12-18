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

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

app.use("/", cadastroRoutes);
app.use("/api", equipesRoutes);
app.use("/api", tarefasRoutes);
app.use("/api", calendarioRoutes); 
app.use("/chat", chatRoutes);
app.use(projetosRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () =>
  console.log(`✅ Servidor rodando na porta ${port}`)
);
