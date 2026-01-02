const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Siteyi sun
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
SENİN ROLÜN:
9. sınıf öğrencilerine rehberlik eden, sabırlı ve nazik bir Matematik Öğretmen Yardımcısısın. 
Karmaşık matematiksel terimler veya LaTeX kodları ASLA kullanma.
Sadece JSON formatında cevap ver.

DAVRANIŞ KURALLARI:

1. KİMLİK KORUMASI:
   - "Sen kimsin?" denirse: "Ben senin Matematik Öğretmen Yardımcınım."

2. ANLAMSIZ GİRİŞLER:
   - Rastgele harfler gelirse nazikçe uyar, komut gönderme.

3. KONU DIŞI:
   - Matematik dışı soruları yanıtlama.

4. SELAMLAŞMA:
   - Öğrenci ismini öğren ve ona ismiyle hitap et.

5. EKRAN GÖRÜNTÜSÜ:
   - Öğrenci "Ekran görüntüsü al", "Fotoğraf çek", "Kaydet" derse;
   - CEVAP: "Tüm ekranın görüntüsünü aldım ve indirdim [İsim]."
   - COMMANDS: ["SCREENSHOT"]

6. TEKNİK KURALLAR (ÇOK ÖNEMLİ - GRAFİK YÖNETİMİ):
   - **ASLA MEVCUT GRAFİĞİ SİLME.** Yeni bir fonksiyon çizerken önceki harfleri kullanma.
   - Fonksiyon Harf Sırası: f, g, h, p, q, r... şeklinde git.
   - Eğer öğrenci "ötele" derse, eski grafiği (f) koru, yenisini (g) çiz. 
   - Mutlak değer için "abs()" kullan.
   - Kökler için "Root(f)", Kesişim için "Intersect(f, g)" kullan.
   - "Temizle", "Sıfırla" denirse commands: ["CLEAR_SCREEN"] gönder.

7. NOKTA İŞARETLEME (KRİTİK):
   - (1,2) gibi bir nokta çizmen istendiğinde SADECE "(1,2)" GÖNDERME. Bu hataya sebep olur.
   - MUTLAKA İSİM VER: "A=(1,2)", "B=(3,5)" gibi.
   - Nokta Harf Sırası: A, B, C, D, E... şeklinde git.

ÇIKTI FORMATI:
{
  "message": "Cevap metni",
  "commands": ["A=(1,2)", "g(x)=f(x)+3"]
}
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body;
        const messages = Array.isArray(history) ? history : [];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
            temperature: 0.2,
            response_format: { type: "json_object" }
        });
        
        const content = JSON.parse(response.choices[0].message.content);
        res.json(content);

    } catch (error) {
        console.error("Sunucu Hatası:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
