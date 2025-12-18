import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ... (Rotas de usuários e GET/POST/PUT projetos permanecem iguais) ...

// ---------------------------
// USUÁRIOS
// ---------------------------
router.get("/usuarios", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_usuarios")
      .select("id_usuario, nome_usuario")
      .order("nome_usuario", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// PROJETOS
// ---------------------------
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_projeto")
      .select(`
        *,
        tb_projeto_usuario(id_usuario),
        tb_tarefa_projeto(*)
      `)
      .order("data_criacao", { ascending: false });

    if (error) throw error;

    const projetos = data.map(proj => ({
      id_projeto: proj.id_projeto,
      name: proj.nome_projeto,
      description: proj.descricao,
      status: proj.status,
      progress: proj.progresso || 0,
      deadline: proj.prazo,
      createdDate: proj.data_criacao,
      participants: proj.tb_projeto_usuario.map(u => u.id_usuario),
      tasks: proj.tb_tarefa_projeto.map(t => ({
        id: t.id_tarefa, 
        title: t.titulo,
        description: t.descricao,
        status: t.status,
        priority: t.prioridade
      }))
    }));

    res.json(projetos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  const { name, description, status, deadline, participants } = req.body;
  try {
    const { data: projeto, error } = await supabase
      .from("tb_projeto")
      .insert({
        nome_projeto: name,
        descricao: description,
        status,
        prazo: deadline,
        data_criacao: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    if (participants?.length > 0) {
      const participantRows = participants.map(userId => ({
        id_projeto: projeto.id_projeto,
        id_usuario: Number(userId)
      }));
      await supabase.from("tb_projeto_usuario").insert(participantRows);
    }

    res.status(201).json(projeto);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, status, deadline, participants } = req.body;
  const projetoId = parseInt(id);

  try {
    const { data: updatedProject, error } = await supabase
      .from("tb_projeto")
      .update({
        nome_projeto: name,
        descricao: description,
        status,
        prazo: deadline
      })
      .eq("id_projeto", projetoId)
      .select()
      .single();

    if (error) throw error;

    if (participants && Array.isArray(participants)) {
      await supabase.from("tb_projeto_usuario").delete().eq("id_projeto", projetoId);
      if (participants.length > 0) {
        const participantRows = participants.map(userId => ({
          id_projeto: projetoId,
          id_usuario: Number(userId)
        }));
        await supabase.from("tb_projeto_usuario").insert(participantRows);
      }
    }
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MODIFICADO: Deletar Projeto (Limpa dependências primeiro)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const projetoId = parseInt(id);

  try {
    // 1. Deletar participantes vinculados
    const { error: errorUsers } = await supabase
      .from("tb_projeto_usuario")
      .delete()
      .eq("id_projeto", projetoId);
    
    if (errorUsers) throw errorUsers;

    // 2. Deletar tarefas vinculadas
    const { error: errorTasks } = await supabase
      .from("tb_tarefa_projeto")
      .delete()
      .eq("id_projeto", projetoId);

    if (errorTasks) throw errorTasks;

    // 3. Deletar o projeto em si
    const { error: errorProj } = await supabase
      .from("tb_projeto")
      .delete()
      .eq("id_projeto", projetoId);

    if (errorProj) throw errorProj;

    res.json({ message: "Projeto e dependências excluídos com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar projeto no backend:", err);
    res.status(500).json({ error: err.message });
  }
});

// ... (Restantes das rotas de tarefas permanecem iguais) ...

router.post("/:id/tarefas", async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority } = req.body;

  try {
    const { data, error } = await supabase
      .from("tb_tarefa_projeto")
      .insert({
        id_projeto: parseInt(id),
        titulo: title,
        descricao: description,
        status: status || "todo",
        prioridade: priority || "medium",
        data_criacao: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/tarefas/:id_tarefa", async (req, res) => {
  const { id_tarefa } = req.params;
  const { status, title, description, priority } = req.body;

  try {
    const updateData = {};
    if (status) updateData.status = status;
    if (title) updateData.titulo = title;
    if (description) updateData.descricao = description;
    if (priority) updateData.prioridade = priority;

    const { data, error } = await supabase
      .from("tb_tarefa_projeto")
      .update(updateData)
      .eq("id_tarefa", id_tarefa)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/tarefas/:id_tarefa", async (req, res) => {
  const { id_tarefa } = req.params;
  try {
    const { error } = await supabase
      .from("tb_tarefa_projeto")
      .delete()
      .eq("id_tarefa", id_tarefa);

    if (error) throw error;
    res.json({ message: "Tarefa excluída com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;