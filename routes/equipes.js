import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Conexão com Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* =========================
   USUÁRIOS
========================= */

// Listar usuários (para selects do front)
router.get("/usuarios", async (req, res) => {
  const { data, error } = await supabase
    .from("tb_usuario")
    .select(`
      id_usuario,
      nome_usuario,
      email_usuario,
      cargo,
      departamento,
      telefone
    `);

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

/* =========================
   EQUIPES
========================= */

// Listar equipes (COM membros)
router.get("/equipes", async (req, res) => {
  const { data, error } = await supabase
    .from("tb_equipe")
    .select(`
      id_equipe,
      titulo_equipe,
      descricao,
      departamento,
      lider_id,
      created_at,
      tb_membros (
        tb_usuario (
          id_usuario,
          nome_usuario,
          email_usuario,
          cargo,
          departamento,
          telefone
        )
      )
    `);

  if (error) return res.status(500).json({ error: error.message });

  const equipesFormatadas = data.map(equipe => ({
    id: equipe.id_equipe,
    name: equipe.titulo_equipe,
    description: equipe.descricao,
    department: equipe.departamento,
    leaderId: equipe.lider_id,
    createdDate: equipe.created_at
      ? new Date(equipe.created_at).toLocaleDateString("pt-BR")
      : null,
    members: equipe.tb_membros.map(m => ({
      id: m.tb_usuario.id_usuario,
      name: m.tb_usuario.nome_usuario,
      email: m.tb_usuario.email_usuario,
      role: m.tb_usuario.cargo,
      department: m.tb_usuario.departamento,
      phone: m.tb_usuario.telefone
    }))
  }));

  res.json(equipesFormatadas);
});

// Criar equipe
router.post("/equipes", async (req, res) => {
  const { name, description, department, leaderId } = req.body;

  if (!name || !department || !leaderId) {
    return res.status(400).json({ error: "Campos obrigatórios faltando." });
  }

  const { data: equipe, error } = await supabase
    .from("tb_equipe")
    .insert([
      {
        titulo_equipe: name,
        descricao: description,
        departamento: department,
        lider_id: leaderId
      }
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // líder também entra como membro
  await supabase.from("tb_membros").insert([
    {
      id_usuario: leaderId,
      id_equipes: equipe.id_equipe
    }
  ]);

  res.status(201).json(equipe);
});

// Excluir equipe
router.delete("/equipes/:idEquipe", async (req, res) => {
  const { idEquipe } = req.params;

  await supabase.from("tb_membros").delete().eq("id_equipes", idEquipe);
  await supabase.from("tb_equipe").delete().eq("id_equipe", idEquipe);

  res.json({ message: "Equipe excluída com sucesso." });
});

/* =========================
   MEMBROS
========================= */

// Adicionar membro
router.post("/equipes/:idEquipe/membros", async (req, res) => {
  const { idUsuario } = req.body;
  const { idEquipe } = req.params;

  if (!idUsuario) {
    return res.status(400).json({ error: "Usuário é obrigatório." });
  }

  const { error } = await supabase
    .from("tb_membros")
    .insert([{ id_usuario: idUsuario, id_equipes: idEquipe }]);

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: "Membro adicionado." });
});

// Remover membro (não permite líder)
router.delete(
  "/equipes/:idEquipe/membros/:idUsuario",
  async (req, res) => {
    const { idEquipe, idUsuario } = req.params;

    const { data: equipe } = await supabase
      .from("tb_equipe")
      .select("lider_id")
      .eq("id_equipe", idEquipe)
      .single();

    if (equipe?.lider_id === Number(idUsuario)) {
      return res
        .status(400)
        .json({ error: "Não é possível remover o líder da equipe." });
    }

    const { error } = await supabase
      .from("tb_membros")
      .delete()
      .match({ id_equipes: idEquipe, id_usuario: idUsuario });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Membro removido." });
  }
);



// EQUIPE DO USUÁRIO LOGADO
router.get("/usuarios/:id/equipe", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("tb_membros")
    .select(`
      id_equipes,
      tb_equipes (
        id_equipe,
        titulo_equipe
      )
    `)
    .eq("id_usuario", id)
    .single();

  if (error) {
    console.error("Erro ao buscar equipe do usuário:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const equipe = data?.tb_equipes;

  return res.json({
    id_equipe: equipe?.id_equipe ?? data.id_equipes,
    titulo_equipe: equipe?.titulo_equipe ?? "Sem equipe",
    // canal para usar na tabela `mensagens`
    canal: (equipe?.titulo_equipe || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, "-"), 
  });
});


export default router;
