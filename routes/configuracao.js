import express from "express";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("tb_usuario")
    .select("id_usuario, nome_usuario, email_usuario, telefone, empresa_usuario, cargo")
    .eq("id_usuario", id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  return res.json(data);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  try {
    if (body.nova_senha) {
      const { data: userPasswordData, error: userError } = await supabase
        .from("tb_usuario")
        .select("senha_usuario")
        .eq("id_usuario", id)
        .single();

      if (userError || !userPasswordData) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const passwordMatch = await bcrypt.compare(body.senha_atual, userPasswordData.senha_usuario);

      if (!passwordMatch) {
        return res.status(401).json({ error: "A senha atual está incorreta." });
      }

      const hashedPassword = await bcrypt.hash(body.nova_senha, 10);

      const { error: updateError } = await supabase
        .from("tb_usuario")
        .update({ senha_usuario: hashedPassword })
        .eq("id_usuario", id);

      if (updateError) throw updateError;

      return res.json({ message: "Senha atualizada com sucesso." });

    } else {
      const { nome_usuario, email_usuario, telefone, empresa_usuario, cargo } = body;

      const profileUpdates = {
        nome_usuario,
        email_usuario,
        telefone,
        empresa_usuario,
        cargo
      };

      const { data, error } = await supabase
        .from("tb_usuario")
        .update(profileUpdates)
        .eq("id_usuario", id)
        .select()
        .single();

      if (error) throw error;

      return res.json(data);
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;