import express from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// get
router.get("/chat/mensagens", async (req, res) => {
  const { canal, team_id } = req.query;

  if (!canal || !team_id) {
    return res.status(400).json({ error: "canal e team_id são obrigatórios." });
  }

  const { data, error } = await supabase
    .from("mensagens")
    .select("*")
    .eq("canal", canal)
    .eq("team_id", team_id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar mensagens:", error.message);
    return res.status(500).json({ error: "Erro ao buscar mensagens." });
  }

  res.json(data || []);
});

// post
router.post("/chat/mensagens", async (req, res) => {
  const { canal, author, user_id, content, team_id } = req.body;

  if (!canal || !author || !user_id || !content || !team_id) {
    return res
      .status(400)
      .json({ error: "canal, author, user_id, content e team_id são obrigatórios." });
  }

  const { data, error } = await supabase
    .from("mensagens")
    .insert([{ canal, author, user_id, content, team_id }])
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar mensagem:", error.message);
    return res.status(500).json({ error: "Erro ao salvar mensagem." });
  }

  res.status(201).json(data);
});

export default router;
