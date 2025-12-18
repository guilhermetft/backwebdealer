import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * 🔹 Buscar eventos por mês
 * GET /api/eventos?month=8&year=2025
 */
router.get("/eventos", async (req, res) => {
    const { month, year } = req.query;

    if (!month || !year) {
        return res
            .status(400)
            .json({ error: "month e year são obrigatórios." });
    }

    const monthNum = Number(month);

    const inicio = new Date(year, monthNum - 1, 1);
    const proximoMes = new Date(year, monthNum, 1);

    const inicioISO = inicio.toISOString().split("T")[0];
    const proximoMesISO = proximoMes.toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("tb_eventos")
        .select("*")
        .gte("data_evento", inicioISO)
        .lt("data_evento", proximoMesISO)
        .order("data_evento", { ascending: true });


    if (error) {
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
});

/**
 * 🔹 Criar evento
 */
router.post("/eventos", async (req, res) => {
    const { nome_evento, data_evento, hora_evento, descricao_evento } = req.body;

    if (!nome_evento || !data_evento) {
        return res
            .status(400)
            .json({ error: "nome_evento e data_evento são obrigatórios." });
    }

    const { data, error } = await supabase
        .from("tb_eventos")
        .insert([
            {
                nome_evento,
                data_evento,
                hora_evento,
                descricao_evento,
            },
        ])
        .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data[0]);
});

/**
 * 🔹 Atualizar evento
 */
router.put("/eventos/:id", async (req, res) => {
    const { id } = req.params;

    const updates = {};
    if (req.body.nome_evento) updates.nome_evento = req.body.nome_evento;
    if (req.body.data_evento) updates.data_evento = req.body.data_evento;
    if (req.body.hora_evento) updates.hora_evento = req.body.hora_evento;
    if (req.body.descricao_evento)
        updates.descricao_evento = req.body.descricao_evento;

    const { error } = await supabase
        .from("tb_eventos")
        .update(updates)
        .eq("id_evento", id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Evento atualizado com sucesso." });
});

/**
 * 🔹 Deletar evento
 */
router.delete("/eventos/:id", async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from("tb_eventos")
        .delete()
        .eq("id_evento", id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Evento removido com sucesso." });
});

export default router;
