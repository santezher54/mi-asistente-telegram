const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const express = require('express');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

console.log('Iniciando bot...');
console.log('Token presente:', TELEGRAM_TOKEN ? 'SI ✅' : 'NO ❌');
console.log('Groq key presente:', GROQ_API_KEY ? 'SI ✅' : 'NO ❌');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8678957626:AAEJYKzDKUSPOTIuOmAuzAOZgS-iqcHvgJU';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

const memoria = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text;

  if (!memoria[chatId]) {
    memoria[chatId] = { historial: [], tareas: [], notas: [], eventos: [] };
  }

  if (texto.toLowerCase().includes('recordar') || texto.toLowerCase().includes('tarea')) {
    memoria[chatId].tareas.push(texto);
  }
  if (texto.toLowerCase().includes('nota') || texto.toLowerCase().includes('apunta')) {
    memoria[chatId].notas.push(texto);
  }
  if (texto.toLowerCase().includes('evento') || texto.toLowerCase().includes('cita')) {
    memoria[chatId].eventos.push(texto);
  }

  memoria[chatId].historial.push({ role: 'user', content: texto });

  try {
    const respuesta = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente personal amigable que habla español. 
Recuerdas todo lo que el usuario te dice.
Tareas pendientes: ${JSON.stringify(memoria[chatId].tareas)}
Notas: ${JSON.stringify(memoria[chatId].notas)}
Eventos: ${JSON.stringify(memoria[chatId].eventos)}`
        },
        ...memoria[chatId].historial.slice(-10)
      ]
    });

    const texto_respuesta = respuesta.choices[0].message.content;

    memoria[chatId].historial.push({ role: 'assistant', content: texto_respuesta });

    bot.sendMessage(chatId, texto_respuesta);

  } catch (error) {
    console.error('Error:', error.message);
    bot.sendMessage(chatId, '❌ Error: ' + error.message);
  }
});

const app = express();
app.get('/', (req, res) => res.send('Bot funcionando ✅'));
app.listen(process.env.PORT || 3000, () => console.log('Servidor listo'));
