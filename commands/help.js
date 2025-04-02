const config = require("../config.js");

module.exports = {
  name: "help",
  description: "Wyświetla listę dostępnych komend",
  execute(message, args, commands) {
    const prefix = config.PREFIX;
    let helpMessage = "**Dostępne komendy:**\n";

    message.client.commands.forEach((command) => {
      helpMessage += `\`${prefix}${command.name}\` - ${command.description}\n`;
    });

    message.reply(helpMessage);
  },
};
