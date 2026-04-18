const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

const app = express();
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
console.log('Token:', TELEGRAM_TOKEN ? 'Cargado ✅' : 'NO encontrado ❌');
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Memoria por usuario
const memoria = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text;

  if (!memoria[chatId]) {
    memoria[chatId] = {
      historial: [],
      notas: [],
      tareas: [],
      eventos: []
    };
  }

  memoria[chatId].historial.push({
    role: 'user',
    parts: [{ text: texto }]
  });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `Eres un asistente personal amigable que habla en español.
Puedes recordar tareas, notas y eventos del usuario.
Memoria actual:
- Tareas: ${JSON.stringify(memoria[chatId].tareas)}
- Notas: ${JSON.stringify(memoria[chatId].notas)}
- Eventos: ${JSON.stringify(memoria[chatId].eventos)}

Cuando el usuario quiera guardar algo, responde confirmando y extrae la info.
Si menciona una tarea, agrégala mentalmente. Si pregunta qué tiene pendiente, muéstraselo.`;

    const chat = model.startChat({
      history: memoria[chatId].historial.slice(-10),
      systemInstruction: systemPrompt
    });

    const result = await chat.sendMessage(texto);
    const respuesta = result.response.text();

    // Detectar tareas, notas y eventos
    if (texto.toLowerCase().includes('recordar') || texto.toLowerCase().includes('tarea')) {
      memoria[chatId].tareas.push(texto);
    }
    if (texto.toLowerCase().includes('nota') || texto.toLowerCase().includes('apunta')) {
      memoria[chatId].notas.push(texto);
    }
    if (texto.toLowerCase().includes('evento') || texto.toLowerCase().includes('cita') || texto.toLowerCase().includes('reunión')) {
      memoria[chatId].eventos.push(texto);
    }

    memoria[chatId].historial.push({
      role: 'model',
      parts: [{ text: respuesta }]
    });

    bot.sendMessage(chatId, respuesta);

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Hubo un error, intenta de nuevo.');
  }
});

app.get('/', (req, res) => res.send('Bot funcionando ✅'));
app.listen(process.env.PORT || 3000);
