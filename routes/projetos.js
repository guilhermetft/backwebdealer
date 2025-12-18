import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ---------------------------
// GET → Buscar usuários
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
    console.error("Erro Supabase:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// GET → Listar projetos
// ---------------------------
router.get("/projetos", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tb_projeto")
      .select(`
        id_projeto,
        nome_projeto,
        descricao,
        status,
        progresso,
        prazo,
        data_criacao,
        tb_projeto_usuario(id_usuario)
      `)
      .order("data_criacao", { ascending: false });

    if (error) throw error;

    const projetos = data.map(proj => ({
      id: proj.id_projeto,
      name: proj.nome_projeto,
      description: proj.descricao,
      status: proj.status,
      progresso: proj.progresso,
      deadline: proj.prazo,
      createdDate: proj.data_criacao,
      participants: proj.tb_projeto_usuario.map(u => u.id_usuario)
    }));

    res.json(projetos);
  } catch (err) {
    console.error("Erro ao buscar projetos:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// POST → Criar projeto
// ---------------------------
router.post("/projetos", async (req, res) => {
  const { name, description, status, deadline, participants } = req.body;

  if (!name || !description || !status || !deadline)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });

  try {
    const { data: projeto, error } = await supabase
      .from("tb_projeto")
      .insert({
        nome_projeto: name,
        descricao: description,
        status,
        prazo: deadline,
        data_criacao: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Inserir participantes
    if (participants?.length > 0) {
      const participantRows = participants.map(userId => ({
        id_projeto: projeto.id_projeto,
        id_usuario: userId
      }));

      const { error: errorParticipants } = await supabase
        .from("tb_projeto_usuario")
        .insert(participantRows);

      if (errorParticipants) throw errorParticipants;
    }

    res.status(201).json(projeto);
  } catch (err) {
    console.error("Erro ao criar projeto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// PUT → Atualizar projeto
// ---------------------------
router.put("/projetos/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, status, deadline, participants } = req.body;

  try {
    const { data: updatedProject, error } = await supabase
      .from("tb_projeto")
      .update({
        nome_projeto: name,
        descricao: description,
        status,
        prazo: deadline
      })
      .eq("id_projeto", id)
      .select()
      .single();

    if (error) throw error;

    if (participants) {
      // Deleta os antigos
      await supabase.from("tb_projeto_usuario").delete().eq("id_projeto", id);

      // Insere os novos
      const participantRows = participants.map(userId => ({
        id_projeto: id,
        id_usuario: userId
      }));
      const { error: errorParticipants } = await supabase
        .from("tb_projeto_usuario")
        .insert(participantRows);

      if (errorParticipants) throw errorParticipants;
    }

    res.json(updatedProject);
  } catch (err) {
    console.error("Erro ao atualizar projeto:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// DELETE → Deletar projeto
// ---------------------------
router.delete("/projetos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Deleta participantes primeiro
    await supabase.from("tb_projeto_usuario").delete().eq("id_projeto", id);

    // Deleta projeto
    const { error } = await supabase.from("tb_projeto").delete().eq("id_projeto", id);
    if (error) throw error;

    res.json({ message: "Projeto deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar projeto:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
