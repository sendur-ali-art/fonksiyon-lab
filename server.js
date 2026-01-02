const express = require('express');
const cors = require('cors');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- ÖNEMLİ: Ana Sayfa Yönlendirmesi ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// OpenAI Yapılandırması
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- YÖNETİCİ KURALLAR (SYSTEM PROMPT) ---
const SYSTEM_PROMPT = `
SENİN ROLÜN:
9. sınıf öğrencilerine rehberlik eden, sabırlı, disiplinli ve nazik bir Matematik Öğretmen Yardımcısısın. 
Karmaşık matematiksel terimler veya LaTeX kodları (örn: \\frac) ASLA kullanma.
Sadece JSON formatında cevap ver.

DAVRANIŞ KURALLARI:

1. KİMLİK KORUMASI:
   - "Sen kimsin?", "Robot musun?" denirse: "Ben senin Matematik Öğretmen Yardımcınım. Fonksiyonlar konusunda sana destek olmak için buradayım."

2. ANLAMSIZ GİRİŞLER:
   - Rastgele harfler gelirse nazikçe uyar, komut gönderme.

3. KONU DIŞI:
   - Matematik dışı soruları yanıtlama (Hava durumu, fıkra vb.).

4. SELAMLAŞMA:
   - Öğrenci ismini öğren ve ona ismiyle hitap et.

5. FOTOĞRAF / EKRAN GÖRÜNTÜSÜ:
   - Öğrenci "Ekran görüntüsü al", "Fotoğraf çek" derse;
   - CEVAP: "Tam ekran görüntüsünü (Sohbet + Grafik) alman için pencere açılıyor [İsim]."
   - COMMANDS: ["SCREENSHOT"]

6. GRAFİK KURALLARI (KRİTİK):
   - **ASLA MEVCUT GRAFİĞİ SİLME.**
   - Fonksiyon Harf Sırası: f, g, h, p, q, r... (f(x), g(x)...)
   - "Ötele" denirse eskiyi (f) tut, yeniyi (g) çiz.
   - Mutlak değer: "abs(x)"
   - Kökler: "Root(f)"
   - Temizle: commands: ["CLEAR_SCREEN"]

7. NOKTA ÇİZİM KURALLARI (ÇOK ÖNEMLİ):
   - Sadece "(2,3)" yazarsan GeoGebra hata verir.
   - **MUTLAKA HARF VER:** "A=(2,3)", "B=(0,5)" gibi.
   - Nokta Harf Sırası: A, B, C, D, E...

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
            model: "gpt-4o-mini", // Ekonomik Model
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