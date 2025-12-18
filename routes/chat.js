import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const router = express.Router();

router.get("/ping", (req, res) => {
  res.json({ chat: "ok" });
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ===============================
   LISTAR MENSAGENS
================================ */
router.get("/mensagens", async (req, res) => {
  const { canal } = req.query;

  if (!canal) {
    return res.status(400).json({ error: "Canal é obrigatório." });
  }

  const { data, error } = await supabase
    .from("tb_mensagens")
    .select("*")
    .eq("chat_canal", canal)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar mensagens:", error.message);
    return res.status(500).json({ error: "Erro ao buscar mensagens." });
  }

  res.json(data || []);
});

/* ===============================
   ENVIAR MENSAGEM
================================ */
router.post("/mensagens", async (req, res) => {
  const { chat_canal, author_mensagem, user_id, content } = req.body;

  if (!chat_canal || !author_mensagem || !user_id || !content) {
    return res.status(400).json({
      error:
        "chat_canal, author_mensagem, user_id e content são obrigatórios.",
    });
  }

  const { data, error } = await supabase
    .from("tb_mensagens")
    .insert([
      {
        chat_canal,
        author_mensagem,
        user_id,
        content,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar mensagem:", error.message);
    return res.status(500).json({ error: "Erro ao salvar mensagem." });
  }

  res.status(201).json(data);
});

export default router;