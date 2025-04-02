const { Client, GatewayIntentBits, Collection } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// reading commands from the commands folder
client.commands = new Collection();

// checking if ready
client.once("ready", () => {
  console.log(`Bot logged as ${client.user.tag}!`);
  client.user.setActivity(config.PLAYING_STATUS);
});

// Dodaj ten kod po inicjalizacji client.commands
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Dodaj obsługę wiadomości
client.on("messageCreate", (message) => {
  if (!message.content.startsWith(config.PREFIX) || message.author.bot) return;

  const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) return;

  try {
    client.commands.get(commandName).execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply("Wystąpił błąd podczas wykonywania komendy!");
  }
});

// logging bot
client.login(config.BOT_TOKEN);
