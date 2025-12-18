import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.get("/tarefas", async (req, res) => {
  const { data, error } = await supabase
    .from("tb_tarefas")
    .select("*")
    .order("criacao_tarefa", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

router.post("/tarefas", async (req, res) => {
  console.log("Dados recebidos no POST:", req.body);

  const {
    titulo,
    prioridade,
    status,
    prazo_tarefa,
    responsavel_tarefa,
  } = req.body;

  const { data: newTask, error } = await supabase
    .from("tb_tarefas")
    .insert([
      {
        titulo_tarefa: titulo,
        prioridade_tarefa: prioridade,
        status_tarefa: status,
        prazo_tarefa,
        responsavel_tarefa,
      },
    ])
    .select();

  if (error) {
    console.error("Erro Supabase:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(newTask[0]);
});

router.put("/tarefas/:id", async (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    prioridade,
    status,
    prazo_tarefa,
    responsavel_tarefa,
  } = req.body;

  const updates = {};
  if (titulo) updates.titulo_tarefa = titulo;
  if (prioridade) updates.prioridade_tarefa = prioridade;
  if (status) updates.status_tarefa = status;
  if (prazo_tarefa) updates.prazo_tarefa = prazo_tarefa;
  if (responsavel_tarefa)
    updates.responsavel_tarefa = responsavel_tarefa;

  const { error } = await supabase
    .from("tb_tarefas")
    .update(updates)
    .eq("id_tarefa", id);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ message: "Tarefa atualizada com sucesso" });
});

router.delete("/tarefas/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("tb_tarefas")
    .delete()
    .eq("id_tarefa", id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: "Deletado com sucesso" });
});

export default router;