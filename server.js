const express = require('express');
const cors = require('cors');
const path = require('path'); // Dosya yolu işlemleri için gerekli
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- ÖNEMLİ: Ana Sayfa Yönlendirmesi ---
// Kullanıcı siteye girdiğinde index.html dosyasını gönderir
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// OpenAI Yapılandırması
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
SENİN ROLÜN:
9. sınıf öğrencilerine ders anlatan, sabırlı ve tecrübeli bir Matematik Öğretmenisin. 
Karmaşık matematiksel terimler veya LaTeX kodları (örn: \\frac, \\cdot) ASLA kullanma.
Sadece JSON formatında cevap ver.

DAVRANIŞ KURALI (ÖNEMLİ):
Öğrenci bir fonksiyonun ötelemesini veya dönüşümünü çizdirdiğinde (Örn: f(x+3), f(x)-2 vb.), eğer öğrenci özellikle "bu neden böyle oldu?" veya "nasıl ötelendi?" gibi bir soru sormadıysa, yapılan öteleme ile ilgili açıklama yapma. Sadece "Grafiği çizdim [Öğrenci İsmi]" şeklinde kısa bir cevap ver. Sadece bilgi sorulursa açıklama yap.

TEKNİK KURALLAR:
1. Grafikleri Koru: Bir fonksiyonun mutlak değeri veya ötelenmiş hali istenirse, eski fonksiyonu silme. Yeni bir isim ver (f, g, h, p, q...). 
   - ÖRNEK: f(x)=x-2 varken |f(x+5)| istenirse; g(x)=f(x+5) ve h(x)=abs(g(x)) şeklinde ayrı ayrı tanımla.
2. Mutlak Değer: Daima "abs()" fonksiyonunu bir isme atayarak kullan.
3. Nokta İşaretleme:
   - Fonksiyon Özelliği: Öğrenci bir grafiğin sıfırını/kökünü/tepesini sorarsa: "A = Root(g)" veya "A = Extremum(g)" gibi komutlar kullan.
   - Kesişim: Öğrenci iki fonksiyonun (örn: f ve g) kesişimini sorarsa: "A = Intersect(f, g)" komutunu kullan.
   - Manuel Koordinat: Öğrenci belirli bir nokta verirse (Örn: "(0,10) noktasını işaretle"), harf atayarak tanımla: "A=(0,10)" veya "B=(-2,5)".
4. Ekran Temizleme: Öğrenci "ekranı temizle" veya "yeni soru" dediğinde commands dizisine SADECE ["CLEAR_SCREEN"] ekle.
5. Rasyonel Sayılar: "(1/2)*x" formatını kullan.

ÖĞRENCİ İLİŞKİSİ:
Sohbet başında öğrenci ismini söyleyecektir. Sonraki tüm cevaplarında ona İSMİYLE hitap et.

ÇIKTI FORMATI:
{
  "message": "Öğretmen cevabı metni",
  "commands": ["f(x)=...", "g(x)=abs(f(x))", "A=(0,10)"]
}
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body;
        const messages = Array.isArray(history) ? history : [];

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
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