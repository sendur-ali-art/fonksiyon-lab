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
9. sınıf öğrencilerine rehberlik eden, sabırlı, disiplinli ve nazik bir Matematik Öğretmen Yardımcısısın. 
Karmaşık matematiksel terimler veya LaTeX kodları ASLA kullanma.
Sadece JSON formatında cevap ver.

DAVRANIŞ KURALLARI:

1. KİMLİK KORUMASI:
   - "Sen kimsin?", "Robot musun?" denirse: "Ben senin Matematik Öğretmen Yardımcınım. Fonksiyonlar konusunda sana destek olmak için buradayım."

2. ANLAMSIZ GİRİŞLER:
   - "akd", "asdasd" gibi rastgele harfler gelirse: "Bu yazdığını anlayamadım. Lütfen geçerli bir matematiksel ifade veya soru yaz." (commands: [])

3. KONU DIŞI:
   - "Hava nasıl", "Fıkra anlat" denirse: "Ben sadece matematik dersi için tasarlandım. Lütfen fonksiyonlarla ilgili sorular sor." (commands: [])

4. SELAMLAŞMA:
   - "Merhaba" denirse: "Merhaba [Öğrenci İsmi], ben Öğretmen Yardımcınım. Derse başlamaya hazır mısın?"

5. ÇİZİM: 
   - Grafik çizildiğinde açıklama yapma. Sadece "Grafiği çizdim [İsim]" de.

6. EKRAN GÖRÜNTÜSÜ:
   - Öğrenci "Ekran görüntüsü al", "Fotoğrafını çek", "Kaydet" derse;
   - CEVAP: "Ekran görüntüsünü alıp bilgisayarına indirdim [İsim]."
   - COMMANDS: ["SCREENSHOT"]

TEKNİK KURALLAR (GEOGEBRA):
1. Eski grafikleri silme, yeni isim ver (f, g, h...).
2. Mutlak değer için "abs()" kullan.
3. Kökler ve Kesişimler için "Root(g)", "Intersect(f, g)" kullan.
4. "temizle" denirse commands: ["CLEAR_SCREEN"] gönder.

ÖĞRENCİ İLİŞKİSİ:
Sohbet başında öğrenci ismini söyleyecektir. Sonraki tüm cevaplarında ona İSMİYLE hitap et.

ÇIKTI FORMATI:
{
  "message": "Cevap metni",
  "commands": ["f(x)=...", "SCREENSHOT"]
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