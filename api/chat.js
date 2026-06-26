const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ENDPOINT =
`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

export default async function handler(req, res) {

    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            reply: "GEMINI_API_KEY belum dikonfigurasi."
        });
    }
    
    // Health Check
    if (req.method === "GET") {
        return res.status(200).json({
            status: "online",
            service: "IF-Bara AI",
            version: "1.0"
        });
    }

    // Hanya izinkan POST
    if (req.method !== "POST") {
        return res.status(405).json({
            reply: "Method Not Allowed"
        });
    }

    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
        return res.status(400).json({
            reply: "Pesan tidak boleh kosong."
        });
    }

    const lowerMsg = message.toLowerCase();

    // ===== Template Lokasi =====
    if (
        lowerMsg.includes("lokasi") ||
        lowerMsg.includes("alamat") ||
        lowerMsg.includes("dimana")
    ) {
        return res.json({
            reply:
`📍 **Lokasi Universitas Baturaja**

Jl. Ratu Penghulu No.02
Karang Sari
Kecamatan Baturaja Timur
Kabupaten Ogan Komering Ulu
Sumatera Selatan`
        });
    }

    // ===== Template Program Studi =====
    if (
        lowerMsg.includes("prodi") ||
        lowerMsg.includes("jurusan") ||
        lowerMsg.includes("program studi")
    ) {

        return res.json({

            reply:

`🎓 **Program Studi Universitas Baturaja**

### Fakultas Teknik & Komputer
• S1 Informatika
• S1 Teknik Sipil

### Fakultas Ekonomi dan Bisnis
• S1 Manajemen
• S1 Akuntansi

### FKIP
• Pendidikan Teknologi Informasi
• Pendidikan Bahasa Inggris
• Pendidikan Bahasa Indonesia

### FISIP
• Ilmu Komunikasi
• Ilmu Pemerintahan

### Fakultas Pertanian
• Agroteknologi
• Agribisnis`

        });

    }

    // ===== Template Biaya =====
    if (
        lowerMsg.includes("biaya") ||
        lowerMsg.includes("ukt") ||
        lowerMsg.includes("bayar")
    ) {

        return res.json({

            reply:
`💰 Informasi biaya kuliah dapat diperoleh melalui PMB Universitas Baturaja atau menghubungi bagian akademik.`

        });

    }

    // ===== Prompt AI =====

    const context = `
Kamu adalah IF-Bara AI.

IF-Bara adalah chatbot resmi Program Studi Informatika Universitas Baturaja.

Aturan:

- Gunakan Bahasa Indonesia.
- Jawaban singkat.
- Ramah.
- Gunakan Markdown.
- Jangan mengarang informasi.
- Jika tidak tahu, katakan dengan jujur.
- Fokus menjawab mengenai Universitas Baturaja.
`;

    try {
        const response = await fetch(ENDPOINT, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                contents: [
                    {
                        parts: [
                            {
                                text:
                                    context +
                                    "\n\nPertanyaan User:\n" +
                                    message
                            }
                        ]
                    }
                ],

                generationConfig: {
                    temperature: 0.8,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 1024
                }

            })

        });

        const data = await response.json();

        // Jika API Gemini gagal
        if (!response.ok) {

            console.error(data);

            if (response.status === 429) {

                return res.status(429).json({

                    reply:
                        "⚠️ Kuota AI sedang habis. Silakan coba lagi beberapa saat."

                });

            }

            return res.status(response.status).json({

                reply:
                    data?.error?.message ||
                    "Terjadi kesalahan saat menghubungi AI."

            });

        }

        // Ambil jawaban Gemini
        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {

            return res.json({

                reply:
                    "Maaf, saya belum dapat memberikan jawaban."

            });

        }

        return res.json({

            reply

        });

    } catch (error) {

        console.error("Gemini Error:", error);

        return res.status(500).json({

            reply:
                "⚠️ Terjadi kesalahan pada server."

        });

    }

}