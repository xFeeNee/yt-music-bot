require("dotenv").config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  PREFIX: process.env.PREFIX || "!",
  PLAYING_STATUS: process.env.PLAYING_STATUS || "!help for commands",
};
