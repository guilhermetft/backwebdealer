import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST: Criar nova tarefa
router.post("/", async (req, res) => {
  const { 
    titulo, 
    descricao, 
    prioridade, 
    responsavel_tarefa, 
    prazo_tarefa 
  } = req.body;

  try {
    const { data, error } = await supabase
      .from("tb_tarefas")
      .insert([
        {
          titulo_tarefa: titulo,
          descricao_tarefa: descricao,
          prioridade_tarefa: prioridade,
          // AJUSTE AQUI: Convertendo para número inteiro para evitar o erro de bigint
          responsavel_tarefa: responsavel_tarefa ? parseInt(responsavel_tarefa) : null,
          prazo_tarefa: prazo_tarefa,
          status_tarefa: "pending"
        }
      ])
      .select();

    if (error) {
      console.error("Erro Supabase:", error.message);
      // Retornamos o erro exato para ajudar no debug se algo mais falhar
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data[0]);
  } catch (error) {
    console.error("Erro Servidor:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// GET: Buscar usuários (Permanece igual)
router.get("/usuarios", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_usuario")
      .select("id_usuario, nome_usuario")
      .order("nome_usuario", { ascending: true });

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET: Buscar todas as tarefas (Permanece igual)
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_tarefas")
      .select("*")
      .order("id_tarefa", { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;