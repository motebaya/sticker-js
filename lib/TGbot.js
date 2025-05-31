/**
 * @github.com/motebaya - 5/27/2025
 * file: TGbot.js
 */
import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import logger from "./logger/logging.js";
import chalk from "chalk";

/**
 * Telegram Bot class
 */
class TGBot {
  /**
   * constructor
   *
   * @param {Object} opts
   * @param {String} opts.token - The token of the bot
   * @param {String} opts.userId - The user id of the bot
   * @param {Object} opts.log - The logger
   */
  constructor() {
    this.me = {};
    this.token = process.env.BOT_TOKEN;
    this.userId = process.env.USER_ID;
    this.log = logger({ level: "info" });
    this.bot = new TelegramBot(this.token, {
      polling: false,
      verbose: true,
    });
  }

  /**
   * get random emoji
   *
   * @returns {String}
   */
  getRandomEmoji() {
    const start = 0x1f600;
    const randomCodePoint =
      Math.floor(Math.random() * (0x1f64f - start + 1)) + start;
    return String.fromCodePoint(randomCodePoint);
  }

  /**
   * create new sticker pack
   *
   * @param {Object} opts
   * @param {String} opts.packName - The name of the pack
   * @param {String} opts.packTitle - The title of the pack
   * @param {Object} opts.firstImage - The first image of the pack
   */
  async createNewPack(opts) {
    let { packName, packTitle, firstImage } = opts;
    try {
      this.log.info(`Creating new sticker pack::|>${chalk.white(packName)}`);
      return await this.bot.createNewStickerSet(
        this.userId,
        packName,
        packTitle,
        firstImage,
        this.getRandomEmoji()
      );
    } catch (error) {
      this.log.error(error);
      if (/user not found/i.test(error.message)) {
        this.log.error(
          `no user found with id::|>${chalk.white(
            this.userId
          )}, try message @${chalk.white(this.bot.token)} first!`
        );
      }
    }
  }

  /**
   * add sticker to pack
   *
   * @param {Object} opts
   * @param {Object} opts.imageStream - The image stream
   * @param {String} opts.packName - The name of the pack
   */
  async addSticker(opts) {
    let { imageStream, packName } = opts;
    try {
      this.log.info(`Adding sticker to pack::|>${chalk.white(packName)}`);
      return await this.bot.addStickerToSet(
        this.userId,
        packName,
        imageStream,
        this.getRandomEmoji()
      );
    } catch (error) {
      this.log.error(error);
    }
  }

  /**
   * get sticker pack
   *
   * @param {Object} opts
   * @param {String} opts.packName - The name of the pack
   * @returns {Object}
   */
  async getPack(opts) {
    let { packName } = opts;
    try {
      this.log.info(`Getting sticker pack::|>${chalk.white(packName)}`);
      return await this.bot.getStickerSet(packName);
    } catch (error) {
      this.log.error(error.message);
      if (/STICKERSET_INVALID/i.test(error.message)) {
        this.log.error(`sticker set not found::|>${chalk.white(packName)}`);
      }
      return {};
    }
  }

  /**
   * delete sticker pack
   *
   * @param {Object} opts
   * @param {String} opts.packName - The name of the pack
   * @returns {Boolean}
   */
  async deletePack(opts) {
    let { packName } = opts;
    try {
      this.log.info(`Deleting sticker pack::|>${chalk.white(packName)}`);
      return await this.bot.deleteStickerSet(packName);
    } catch (error) {
      this.log.error(error.message);
      if (/STICKERSET_INVALID/i.test(error.message)) {
        this.log.error(`sticker set not found::|>${chalk.white(packName)}`);
      }
      return false;
    }
  }
}

export default TGBot;
