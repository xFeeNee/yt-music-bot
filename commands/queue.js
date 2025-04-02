const musicService = require("../services/musicService");

module.exports = {
  name: "queue",
  description: "Wyświetla kolejkę utworów",
  execute(message) {
    musicService.showQueue(message);
  },
};
