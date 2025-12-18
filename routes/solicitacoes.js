import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// O cliente utiliza as mesmas variáveis de ambiente que você já tem
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET: Busca todas as solicitações para mostrar no "Solicitações Recentes"
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("tb_tarefas")
    .select("*")
    .order("id_tarefa", { ascending: false }); // Mostra as mais novas primeiro

  if (error) {
    console.error("Erro ao buscar solicitações:", error);
    return res.status(500).json({ error: error.message });
  }
  return res.json(data);
});

// POST: Cria uma nova solicitação vinda do formulário
router.post("/", async (req, res) => {
  const { 
    titulo, 
    descricao, 
    prioridade, 
    responsavel_tarefa, 
    prazo_tarefa,
    solicitante // Nome de quem enviou
  } = req.body;

  const { data, error } = await supabase
    .from("tb_tarefas")
    .insert([
      {
        titulo_tarefa: titulo,
        descricao_tarefa: descricao, // Importante: certifique-se que esta coluna existe no Supabase
        prioridade_tarefa: prioridade,
        responsavel_tarefa: responsavel_tarefa,
        prazo_tarefa: prazo_tarefa,
        status_tarefa: "pending", // Toda solicitação nova nasce como pendente
        solicitante_nome: solicitante // Opcional: caso queira guardar quem pediu
      }
    ])
    .select();

  if (error) {
    console.error("Erro ao inserir solicitação:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data[0]);
});

export default router;