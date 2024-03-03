const express = require('express');
const app = express();
const port = 3000
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { Client, Events, GatewayIntentBits } = require("discord.js");
const { OpenAIApi, Configuration } = require("openai");
const dotenv = require('dotenv');
dotenv.config();
const config = new Configuration({
  apiKey: process.env.OPENAI_KEY
});
const openai = new OpenAIApi(config);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.type === 'DM') return;
  const BOT_CHANNEL = "932577871820632114";
  if (message.channel.id !== BOT_CHANNEL) return;
  message.channel.sendTyping();
  let messages = Array.from(await message.channel.messages.fetch({
    limit: 5,
    before: message.id
  }));
  messages = messages.map(m=>m[1]);
  messages.unshift(message);
  let users = [...new Set([...messages.map(m=> m.member ? m.member.displayName : m.author.username), client.user.username])];
  let lastUser = users.pop();
  let prompt = `The following is a conversation between ${users.join(", ")}, and ${lastUser}. \n\n`;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    prompt += `${m.member ? m.member.displayName : m.author.username}: ${m.content}\n`;
  }
  prompt += `${client.user.username}:`;
  console.log("prompt:", prompt);
  const response = await openai.createCompletion({
    prompt,
    model: "text-davinci-003",
    max_tokens: 500,
    stop: ["\n"]
  });
  console.log("response", response.data.choices[0].text);
  await message.channel.send(response.data.choices[0].text);
});
app.get('/', (req, res) => res.send('Once i punch you.'))
app.listen(port, () =>
console.log(`Your app is listening a http://localhost:${port}`)
);
client.login(process.env.token)

