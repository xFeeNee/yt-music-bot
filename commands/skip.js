const musicService = require("../services/musicService");

module.exports = {
  name: "skip",
  description: "Pomija aktualnie odtwarzany utwór",
  execute(message) {
    musicService.skip(message);
  },
};
