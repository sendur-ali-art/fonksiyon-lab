import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs'; // Dosya sistemini ekledik

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
// Render için port ayarı: process.env.PORT || 3000
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- VERİ GÜNLÜĞÜ (LOGGING) FONKSİYONU ---
const saveLog = (logData) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...logData
    };
    // Dosyaya ekleme yap (JSON dizisi olarak tutmak için basit bir ekleme)
    fs.appendFileSync('ogrenci_loglari.json', JSON.stringify(logEntry) + "\n");
};

const systemPrompt = `
SENİN ROLÜN:
11. Sınıf Matematik Öğretmenisin. Pedagojik kurallara (Scaffolding) uygun davran.
Öğrenciye doğrudan "şunu çiz" demek yerine yönlendirici sorular sor.

MÜFREDAT ODAĞI (11.3.3):
- Öteleme, Simetri ve Ölçekleme konularında uzmanlaşmış bir rehbersin.
- Öğrenci bir hata yaparsa (örneğin sağa öteleme için f(x+a) yazarsa), onu "Neden eksi yerine artı kullandın? Zaman rötarı grafiği nereye iter?" gibi sorularla düşündür.

JSON ÇIKTI ŞABLONU:
{
  "type": "ggb_command" veya "chat",
  "payload": "komut veya mesaj",
  "message": "öğrenciye yönlendirici geri bildirim"
}
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { userMessage, studentId } = req.body; // studentId eklenebilir

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
        });

        const aiResponse = JSON.parse(completion.choices[0].message.content);

        // --- VERİYİ KAYDET (Analiz İçin) ---
        saveLog({
            student: studentId || "isimsiz_ogrenci",
            input: userMessage,
            output: aiResponse
        });

        res.json(aiResponse);
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ type: 'error', payload: 'Sunucu hatası.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Sunucu ${port} portunda yayında.`);
});