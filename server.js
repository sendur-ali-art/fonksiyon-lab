const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// LOG DOSYASI HAZIRLIĞI
const LOG_FILE = 'ogrenci_loglari.json';
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

app.post('/api/chat', async (req, res) => {
    const { userMessage, studentId } = req.body;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `Sen bir matematik öğretmenisin. Görevin öğrencilere fonksiyon dönüşümlerini öğretmektir.
                        KURAL 1: Grafik çizmek için ASLA 'Plot', 'Draw', 'Çiz' gibi kelimeler içeren komutlar üretme.
                        KURAL 2: GeoGebra komutu olarak SADECE fonksiyonun kendisini gönder. Örnek: f(x)=x^2
                        KURAL 3: Eğer öğrenci bir dönüşüm isterse (örn: 2 birim yukarı kaydır), yeni fonksiyonu tanımla. Örnek: g(x)=f(x)+2
                        KURAL 4: Yanıtını JSON formatında şu yapıda ver: {"message": "Açıklama metni", "type": "ggb_command", "payload": "f(x)=x^2"}`
                    },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.5
            },
            { headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` } }
        );

        const aiResponse = JSON.parse(response.data.choices[0].message.content);

        // VERİ KAYDI (DENEY ANALİZİ İÇİN)
        const logEntry = {
            timestamp: new Date().toISOString(),
            studentId,
            userMessage,
            aiMessage: aiResponse.message,
            ggbCommand: aiResponse.payload
        };

        const logs = JSON.parse(fs.readFileSync(LOG_FILE));
        logs.push(logEntry);
        fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

        console.log(`Log Kaydedildi: ${studentId} -> ${userMessage}`);
        res.json(aiResponse);

    } catch (error) {
        console.error("Hata oluştu:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Bir hata oluştu." });
    }
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});