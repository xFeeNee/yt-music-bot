const musicService = require("../services/musicService");

module.exports = {
  name: "stop",
  description: "Zatrzymuje odtwarzanie muzyki i opuszcza kanał",
  execute(message) {
    musicService.stop(message);
  },
};
