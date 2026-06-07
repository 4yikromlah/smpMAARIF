const express = require('express');
const supabase = require('../supabase');
const { requireAdmin } = require('../middleware/auth');
const OpenAI = require('openai');
require('dotenv').config();

const router = express.Router();

let openai = null;
if (process.env.USE_OLLAMA !== 'true' && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function callAI(prompt, systemPrompt = null) {
  if (process.env.USE_OLLAMA === 'true') {
    const response = await fetch(process.env.OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        system: systemPrompt
      })
    });
    const data = await response.json();
    return data.response;
  }
  if (!openai) throw new Error('AI tidak dikonfigurasi');
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  });
  return completion.choices[0].message.content;
}

function parseSoalResponse(response, jenis, id_ujian) {
  try {
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id_ujian,
        jenis_soal: parsed.jenis_soal || jenis,
        pertanyaan: parsed.pertanyaan,
        poin: parsed.poin || 1,
        pilihan_json: parsed.pilihan_json || null,
        jawaban_json: parsed.jawaban_json
      };
    }
    throw new Error('No JSON found');
  } catch (e) {
    console.error('Parse error:', e.message);
    return null;
  }
}

router.post('/generate', requireAdmin, async (req, res) => {
  try {
    const { id_ujian, jenis_soal, topik, jumlah_soal = 1, level_kognitif = 'L2', kategori = 'C3' } = req.body;
    if (!id_ujian || !jenis_soal || !topik) {
      return res.status(400).json({ error: 'id_ujian, jenis_soal, topik required' });
    }
    const systemPrompt = `Anda adalah guru pembuat soal. Buat soal ${jenis_soal} level ${level_kognitif} kategori ${kategori}. Output dalam JSON valid.`;
    const prompt = `Buat ${jumlah_soal} soal ${jenis_soal} tentang "${topik}". 
    Format: { "jenis_soal": "...", "pertanyaan": "...", "poin": 1, "pilihan_json": {...}, "jawaban_json": ... }`;
    const aiResponse = await callAI(prompt, systemPrompt);
    const soalData = parseSoalResponse(aiResponse, jenis_soal, id_ujian);
    if (!soalData) return res.status(500).json({ error: 'Gagal parsing AI response' });
    const { data, error } = await supabase.from('soal').insert([soalData]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, soal: data[0], raw: aiResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;