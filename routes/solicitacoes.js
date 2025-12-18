import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Esta rota responderá em: https://backwebdealer.onrender.com/solicitacoes/usuarios
router.get("/usuarios", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_usuario") // Nome exato da sua tabela
      .select("id_usuario, nome_usuario")
      .order("nome_usuario", { ascending: true });

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({ error: error.message });
  }
});

// GET: Busca todas as solicitações
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_tarefas")
      .select("*")
      .order("id_tarefa", { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST: Cria uma nova solicitação
router.post("/", async (req, res) => {
  const { 
    titulo, 
    descricao, 
    prioridade, 
    responsavel_tarefa, 
    prazo_tarefa,
    solicitante 
  } = req.body;

  try {
    const { data, error } = await supabase
      .from("tb_tarefas")
      .insert([
        {
          titulo_tarefa: titulo,
          descricao_tarefa: descricao,
          prioridade_tarefa: prioridade,
          responsavel_tarefa: responsavel_tarefa,
          prazo_tarefa: prazo_tarefa,
          status_tarefa: "pending"
        }
      ])
      .select();

    if (error) throw error;
    return res.status(201).json(data[0]);
  } catch (error) {
    console.error("Erro ao inserir solicitação:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;