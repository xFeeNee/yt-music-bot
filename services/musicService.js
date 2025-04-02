const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const play = require("play-dl");
const ffmpeg = require("ffmpeg-static");

// Mapa do przechowywania kolejek dla różnych serwerów
const queue = new Map();

module.exports = {
  async execute(message, args) {
    const serverQueue = queue.get(message.guild.id);
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      return message.reply(
        "Musisz być na kanale głosowym, aby odtworzyć muzykę!"
      );
    }

    if (!args.length) {
      return message.reply("Musisz podać nazwę lub URL utworu!");
    }

    let songInfo;
    let song;

    try {
      // Sprawdź, czy to URL czy wyszukiwanie
      if (args[0].startsWith("https://") || args[0].startsWith("http://")) {
        songInfo = await play.video_basic_info(args[0]);
        song = {
          title: songInfo.video_details.title,
          url: songInfo.video_details.url,
        };
      } else {
        // Wyszukaj piosenkę
        const searchString = args.join(" ");
        const searchResults = await play.search(searchString, { limit: 1 });
        if (!searchResults.length)
          return message.reply("Nie znaleziono żadnych wyników!");

        songInfo = await play.video_basic_info(searchResults[0].url);
        song = {
          title: songInfo.video_details.title,
          url: songInfo.video_details.url,
        };
      }

      if (!serverQueue) {
        const queueConstruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true,
          player: null,
        };

        queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
          const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false, // Upewnij się, że bot nie jest ogłuszony
            selfMute: false, // Upewnij się, że bot nie jest wyciszony
          });
          queueConstruct.connection = connection;
          this.play(message.guild, queueConstruct.songs[0]);
        } catch (err) {
          console.error(err);
          queue.delete(message.guild.id);
          return message.reply(
            "Wystąpił błąd podczas dołączania do kanału głosowego!"
          );
        }
      } else {
        serverQueue.songs.push(song);
        return message.reply(`**${song.title}** został dodany do kolejki!`);
      }
    } catch (error) {
      console.error(error);
      return message.reply("Wystąpił błąd podczas wyszukiwania utworu!");
    }
  },

  async play(guild, song, retryCount = 0) {
    const serverQueue = queue.get(guild.id);
    if (!serverQueue) return;

    if (!song) {
      if (serverQueue.connection) serverQueue.connection.destroy();
      queue.delete(guild.id);
      return;
    }

    try {
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play,
        },
      });
      serverQueue.player = player;

      const streamOptions = {
        discordPlayerCompatibility: true,
        quality: 2,
        requestOptions: {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        },
      };

      const streamData = await play.stream(song.url, streamOptions);
      const resource = createAudioResource(streamData.stream, {
        inputType: streamData.type,
        inlineVolume: true,
      });

      player.play(resource);
      serverQueue.connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        this.play(guild, serverQueue.songs[0]);
      });

      player.on("error", (error) => {
        console.error("Player error:", error);
        if (retryCount < 3) {
          console.log(`Retrying playback (${retryCount + 1}/3)...`);
          setTimeout(() => {
            this.play(guild, song, retryCount + 1);
          }, 5000);
        } else {
          console.error("Max retries reached. Skipping song.");
          serverQueue.songs.shift();
          this.play(guild, serverQueue.songs[0]);
        }
      });

      serverQueue.textChannel.send(`Now playing: **${song.title}**`);
    } catch (error) {
      console.error("Stream error:", error);
      if (retryCount < 3) {
        console.log(`Retrying playback (${retryCount + 1}/3)...`);
        setTimeout(() => {
          this.play(guild, song, retryCount + 1);
        }, 5000);
      } else {
        console.error("Max retries reached. Skipping song.");
        serverQueue.songs.shift();
        this.play(guild, serverQueue.songs[0]);
      }
    }
  },

  skip(message) {
    const serverQueue = queue.get(message.guild.id);
    if (!message.member.voice.channel) {
      return message.reply("Musisz być na kanale głosowym, aby pominąć utwór!");
    }
    if (!serverQueue) {
      return message.reply("Nie ma żadnego utworu, który mógłbym pominąć!");
    }
    serverQueue.player.stop();
    message.reply("Pomijam aktualny utwór!");
  },

  stop(message) {
    const serverQueue = queue.get(message.guild.id);
    if (!message.member.voice.channel) {
      return message.reply(
        "Musisz być na kanale głosowym, aby zatrzymać muzykę!"
      );
    }
    if (!serverQueue) {
      return message.reply("Nie ma żadnej muzyki do zatrzymania!");
    }
    serverQueue.songs = [];
    serverQueue.player.stop();
    message.reply("Zatrzymuję odtwarzanie i opuszczam kanał!");
  },

  showQueue(message) {
    const serverQueue = queue.get(message.guild.id);
    if (!serverQueue || !serverQueue.songs.length) {
      return message.reply("Kolejka jest pusta!");
    }

    let queueMessage = "**Kolejka utworów:**\n";
    serverQueue.songs.forEach((song, index) => {
      queueMessage += `${index + 1}. ${song.title}\n`;
    });

    message.reply(queueMessage);
  },
};
