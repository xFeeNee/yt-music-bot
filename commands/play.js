const musicService = require("../services/musicService");

module.exports = {
  name: "play",
  description: "Odtwarza muzykę z YouTube",
  async execute(message, args) {
    await musicService.execute(message, args);
  },
};
