const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Tokens directos para prueba
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'TU_TOKEN_AQUI';
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'TU_GEMINI_KEY_AQUI';

console.log('Iniciando bot...');
console.log('Token presente:', TELEGRAM_TOKEN ? 'SI' : 'NO');
console.log('Gemini key presente:', GEMINI_KEY ? 'SI' : 'NO');

const app = express();
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const memoria = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text;

  if (!memoria[chatId]) {
    memoria[chatId] = { historial: [], notas: [], tareas: [], eventos: [] };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: memoria[chatId].historial.slice(-10),
      systemInstruction: `Eres un asistente personal amigable que habla español. Recuerdas tareas, notas y eventos.`
    });

    const result = await chat.sendMessage(texto);
    const respuesta = result.response.text();

    if (texto.toLowerCase().includes('recordar') || texto.toLowerCase().includes('tarea')) {
      memoria[chatId].tareas.push(texto);
    }

    memoria[chatId].historial.push(
      { role: 'user', parts: [{ text: texto }] },
      { role: 'model', parts: [{ text: respuesta }] }
    );

    bot.sendMessage(chatId, respuesta);

  } catch (error) {
    console.error('Error:', error.message);
    bot.sendMessage(chatId, '❌ Error: ' + error.message);
  }
});

app.get('/', (req, res) => res.send('Bot funcionando ✅'));
app.listen(process.env.PORT || 3000, () => console.log('Servidor listo'));
