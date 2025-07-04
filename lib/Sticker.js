/**
 * @github.com/motebaya - 5/27/2025
 * file: Sticker.js
 */
import TGBot from "./TGbot.js";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";
import chalk from "chalk";
import { fileURLToPath } from "url";

/**
 * StickerJS class
 */
class StickerJS extends TGBot {
  /**
   * constructor
   *
   * @param {Object} opts
   */
  constructor(opts) {
    super();
    this.batchSize = opts.batchSize ?? process.env.BATCH_SIZE ?? 50;
    this.stickerShare = "https://t.me/addstickers/";
    this.posibleIncomplete = null;
    this.interrupted = false;
    this.defaultStorage = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../storage"
    );
    this.stickerPath = path.join(this.defaultStorage, "stickers.json");
    process.on("SIGINT", async () => {
      this.interrupted = true;
      await this.Interrupted();
    });
  }

  /**
   * Interrupted
   */
  async Interrupted(retry = 5) {
    if (this.posibleIncomplete && fs.existsSync(this.posibleIncomplete)) {
      this.log.warn(
        `SIGINT>Interrupted::|>${chalk.white(
          path.basename(this.posibleIncomplete)
        )}`
      );
      while (retry--) {
        try {
          this.log.warn(
            `Trying delete posible incomplete::|>${chalk.white(
              path.basename(this.posibleIncomplete)
            )}`
          );
          await fsp.unlink(this.posibleIncomplete);
          break;
        } catch (err) {
          if (err.code === "EBUSY") {
            this.log.warn(
              `Retrying after IO/file completed::|>${chalk.white(
                path.basename(this.posibleIncomplete)
              )}`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else if (err.code === "ENOENT") {
            this.log.warn(
              `Incomplete file stream not created yet::|>${chalk.white(
                path.basename(this.posibleIncomplete)
              )}`
            );
            break;
          } else {
            this.log.error(`Error deleting::|>${chalk.white(error.stack)}`);
            break;
          }
        }
      }
    }
    this.log.warn(`Interrupted::|> ${chalk.white("Exiting....")}`);
    process.exit();
  }

  /**
   * get me
   *
   * @returns {Promise<Object>}
   */
  async getMe() {
    this.me = await this.bot.getMe();
    this.log.info(
      `${chalk.blue("BOT username")}::|> ${chalk.white(this.me.username)}`
    );
    this.log.info(`${chalk.blue("BOT ID")}::|> ${chalk.white(this.me.id)}`);
    return this.me;
  }

  /***
   * detect and convert non WEBP images to webp format with following
   * Telegram rules: 512x512 sticker size
   *
   * @param {Object} opts
   * @param {String} opts.imagePath - The path to the images
   * @returns {Promise<void>}
   */
  async initializeImages(opts) {
    let { imagePath, packName } = opts;
    imagePath = path.join(this.defaultStorage, imagePath);

    if (!fs.existsSync(imagePath)) {
      this.log.error(`Path not found::|>${chalk.white(path)}`);
      return;
    }

    this.log.info(`Initializing images from::|>${chalk.white(imagePath)}`);
    let images = fs
      .readdirSync(imagePath)
      .filter((i) => fs.statSync(path.join(imagePath, i)).isFile());

    this.log.info(`Loaded images::|>${chalk.white(images.length)}`);
    let nonWebp = images.filter((i) => !i.endsWith(".webp"));
    images = images.filter((i) => i.endsWith(".webp"));

    let outputWebp = path.join(imagePath, packName);
    if (!fs.existsSync(outputWebp)) {
      this.log.info(`Creating output directory::|>${chalk.white(outputWebp)}`);
      fs.mkdirSync(outputWebp, { recursive: true });
    }

    nonWebp = nonWebp.filter(
      (i) =>
        !fs.existsSync(
          path.join(outputWebp, i.replace(/.png|.jpg|.jpeg/, ".webp"))
        )
    );

    if (nonWebp.length < 1) {
      this.log.info(`No images to convert::|>${chalk.white(imagePath)}`);
      this.log.info(
        `all images are webp with length::|>${chalk.white(
          fs.readdirSync(outputWebp).length
        )}`
      );
      if (images.length >= 1) {
        for (const img of images) {
          this.log.info(`Copying to new folder::|>${chalk.white(img)}`);
          fs.copyFileSync(path.join(path, img), path.join(outputWebp, img));
        }
      }
      return;
    }

    /**
     * do do do
     */
    for (const [idx, image] of nonWebp.entries()) {
      if (this.interrupted) {
        return;
      }
      let output = path.join(
        outputWebp,
        image.replace(/.png|.jpg|.jpeg/, ".webp")
      );
      this.posibleIncomplete = output;

      if (fs.existsSync(output)) {
        this.log.warn(`image exists::|>${chalk.white(image)}`);
        continue;
      }

      if (!/\.(png|jpe?g)$/i.test(image)) {
        this.log.warn(`unsupported format::|>${chalk.white(image)}`);
        continue;
      }

      this.log.info(
        `Convert to webp::${chalk.white(
          `${idx + 1}/${nonWebp.length}`
        )}|>${chalk.white(image)}`
      );
      try {
        /**
         * no cropped, preserve aspect ratio,
         * fill the rest space with transparent padding
         */
        await sharp(path.join(imagePath, image))
          .resize(512, 512, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .webp()
          .toFile(output);
      } catch (error) {
        this.log.error(
          `Error converting to webp::|>${chalk.white(error.stack)}`
        );
      }
    }
    this.posibleIncomplete = null;
    return fs.readdirSync(outputWebp).map((i) => path.join(outputWebp, i));
  }

  /**
   * save log
   *
   * @param {Object} data
   * @param {Boolean} force - Whether to force the save
   * @returns {Promise<void>}
   */
  saveLog(data, force = false) {
    if (Array.isArray(data) && !force) {
      throw new Error(`data must be an object, not ${typeof data}`);
    }
    if (fs.existsSync(this.stickerPath)) {
      if (!force) {
        let localPackData = JSON.parse(
          fs.readFileSync(this.stickerPath).toString()
        );
        if (Array.isArray(localPackData)) {
          data = [
            ...new Map(
              [...localPackData, data].map((i) => [i.packName, i])
            ).values(),
          ];
        }
      } else {
        data = Array.isArray(data) ? data : [data];
      }
    } else {
      data = [data];
    }
    fs.writeFileSync(this.stickerPath, JSON.stringify(data, null, 2));
    this.log.info(`saved log::|>${chalk.white(this.stickerPath)}`);
    return;
  }

  /**
   * stickers can be deleted through the telegram bot @Stickers,
   * and i sometimes forget if i already removed them.
   * i need to re-check! if a local sticker isn’t found on telegram,
   * it’ll be deleted from local.
   *
   * if it’s the other way around,
   * so i added an option for you to choose whether you want to delete the
   * already created stickers or not, since they’re not saved in the local.
   *
   * @param {Object} opts
   * @param {Boolean} opts.deletePack - Whether to delete the pack
   * @param {String} opts.packName - The name of the pack
   * @returns {Promise<void>}
   */
  async verifySticker() {
    this.log.info(`Verifying stickers::|>${chalk.white(this.stickerPath)}`);
    if (!fs.existsSync(this.stickerPath)) {
      this.log.error(
        `you no have any stickers in::|>${chalk.white(this.stickerPath)}`
      );
      return;
    }

    let packData = JSON.parse(fs.readFileSync(this.stickerPath));
    this.log.info(
      `reading total local stickers::|>${chalk.white(packData.length)} packs`
    );

    if (packData.length < 1) {
      this.log.error(
        `no any packs found in::|>${chalk.white(this.stickerPath)}`
      );
      return;
    }

    console.log("-".repeat(30));
    for (const pack of packData) {
      this.log.info(`Name: ${chalk.white(pack.packName)}`);
      this.log.info(`Title: ${chalk.white(pack.packTitle)}`);
      this.log.info(`Share: ${chalk.white(pack.stickerShare)}`);
      let tgPack = await this.getPack({ packName: pack.packName });
      if (tgPack.stickers !== undefined) {
        if (tgPack.stickers.length === pack.files.length) {
          this.log.info(
            `pack::|> ${chalk.white(
              pack.packName
            )} is already set in telegram with same length`
          );
        } else {
          this.log.warn(
            `pack::|> ${chalk.blue(pack.packName)} ${chalk.white(
              "LOCAL"
            )} length[${chalk.blue(pack.files.length)}] ${chalk.white(
              "TELEGRAM"
            )} length[${chalk.blue(tgPack.stickers.length)}]`
          );
        }
      } else {
        this.log.warn(
          `pack::|> ${chalk.blue(pack.packName)} exist in ${chalk.white(
            "LOCAL"
          )} but not found in ${chalk.white("TELEGRAM")}`
        );
        this.log.warn(
          `deleting pack from ${chalk.white("LOCAL")}::|> ${chalk.white(
            pack.packName
          )}`
        );
        packData = packData.filter((i) => i.packName !== pack.packName);
        this.saveLog(packData, true);
      }
      console.log("-".repeat(30));
    }
    return;
  }

  /**
   * bulk/ delete sticker pack by name, if you just deleted your
   * sticker pack , it might be a delay in telegram api.
   * in a few moments TG api still return sticker pack exist.
   *
   * @param {Object} opts
   * @param {String} opts.packName - The name of the pack
   * @returns {Promise<void>}
   */
  async deleteSticker(opts) {
    let { packName } = opts;
    if (!fs.existsSync(this.stickerPath)) {
      this.log.error(`no any stickers in::|>${chalk.white(this.stickerPath)}`);

      return;
    }

    let packData = JSON.parse(fs.readFileSync(this.stickerPath).toString());
    if (packData.length > 0) {
      let toBuseg =
        packName !== "all"
          ? packData.filter((i) => i.packName === packName)
          : packData;
      if (toBuseg.length !== 0) {
        this.log.info(
          `deleting selected::|> ${chalk.white(toBuseg.length)} packs`
        );
        for (const [idx, pack] of toBuseg.entries()) {
          this.log.info(
            `deleting pack:: |>${chalk.white(pack.packName)} ${chalk.white(
              idx + 1
            )} of ${chalk.white(toBuseg.length)}`
          );
          let delPack = await this.deletePack({ packName: pack.packName });
          if (!delPack) {
            this.log.warn(
              `failed to delete pack::|>${chalk.white(pack.packName)}`
            );
          } else {
            packData = packData.filter((i) => i.packName !== pack.packName);
            this.saveLog(packData, true);
          }
        }
      } else {
        this.log.warn(
          `pack::|>${chalk.white(packName)} not found in::|>${chalk.white(
            this.stickerPath
          )}, try again after -v/--verify`
        );
      }
    }
    return;
  }

  /**
   * check sticker name
   *
   * @param {String} name
   * @returns {Boolean}
   */
  isValidPackName(name) {
    if (!new RegExp(/^[a-z0-9_]{1,64}$/).test(name)) {
      this.log.error(`Invalid sticker name::|>${chalk.white(name)}`);
      this.log.warn(
        `READ .env FILE AND FOLLOW THE TELEGRAM RULES FOR STICKER NAME!!`
      );
      return false;
    }
    return true;
  }

  /**
   * check sticker title
   *
   * @param {String} title
   * @returns {Boolean}
   */
  isValidPackTitle(title) {
    return (
      typeof title === "string" &&
      title.length > 0 &&
      title.length <= 50 &&
      /^[\w\s\-@\/\[\]\(\),.!?'":;#&+={}<>~`$%^*|\\]+$/.test(title)
    );
  }

  /**
   * check first if there’s already a sticker made with the same name or not lol 😂 
   * — if there is, it’ll match the filename in `stickers.json` with the one sent in the params. 
   * it’ll delete it if the sticker from the params is detected locally.
   * 
   * so why not just check locally? the problem is sometimes the local json file 
   * accidentally gets deleted, so it’s better to check directly
   * through the telegram api.

   * @param {Object} opts
   * @param {String} opts.packName - The name of the pack
   * @param {Array} opts.files - The files to check
   * @returns {Promise<Array>}
   */
  async checkPackExist(opts) {
    let { packName, files } = opts;
    let packData = await this.getPack({ packName });
    let stickerDir = path.dirname(files[0]);
    files = files.map((i) => path.basename(i));

    if (!packData.stickers) {
      this.log.info(
        `${chalk.blue(
          this.me.username
        )} doesn't have sticker pack with name::|>${chalk.white(packName)}`
      );
      return files.map((i) => path.join(stickerDir, i));
    }

    this.log.info(
      `pack[${chalk.white(packName)}] already exists with total ${chalk.white(
        packData.stickers.length
      )} stickers`
    );

    if (!fs.existsSync(this.stickerPath)) {
      this.log.warn(
        `Telegram API still delayed, it detected that your sticker pack is exist but (maybe you have been deleted it) in local you don't have any stickers! Just wait a few moments and try again!`
      );
      this.log.error(`no any stickers in::|>${chalk.white(this.stickerPath)}`);
      process.exit();
    }

    let localPackData = JSON.parse(
      fs.readFileSync(this.stickerPath).toString()
    ).filter((i) => i.packName === packName);
    if (localPackData.length < 1) {
      this.log.warn(
        `sticker pack with name::|>${chalk.white(
          packName
        )} is exist but ${chalk.red(
          "LocalPackData"
        )} could not be found in::|>${chalk.white(this.stickerPath)}`
      );
      return files.map((i) => path.join(stickerDir, i));
    }

    files = files.filter((i) => !localPackData[0].files.includes(i));
    if (files.length > 0) {
      this.log.info(
        `found ${chalk.white(
          files.length
        )} new sticker has not set in pack::|>${chalk.white(packName)}`
      );
      return files.map((i) => path.join(stickerDir, i));
    } else {
      this.log.info(
        `all stickers are already set in pack::|>${chalk.white(packName)}`
      );
      return [];
    }
  }

  /**
   * create new sticker pack and add stickers to it
   *
   * @param {Object} opts
   * @param {String} opts.imagePath - The path to the images
   * @param {Boolean} opts.batch - Whether to batch the stickers
   */
  async createSticker(opts) {
    let { imagePath, batch } = opts;
    this.bot.on("message", (msg) => {
      console.log("user ID:", msg.from.id);
    });
    let packName = process.env.STICKER_PACK_NAME;
    let packTitle = process.env.STICKER_PACK_TITLE;
    let imageList = await this.initializeImages({ imagePath, packName });
    if (typeof imageList === "undefined") {
      this.log.error(`No images found from ${chalk.white("IMAGEINITIALIZED")}`);
      return;
    }
    if (this.me.username === undefined) {
      await this.getMe();
    }

    let chunks;
    if (batch) {
      this.log.info(`batch size::|> ${chalk.white(this.batchSize)}`);
      chunks = imageList.reduce((arr, val, idx) => {
        if (idx % this.batchSize === 0) {
          arr.push([]);
        }
        arr[arr.length - 1].push(val);
        return arr;
      }, []);
    } else {
      this.log.warn(
        `YOU RUN IT WITHOUT '--batch mode', ONLY 120 IMAGES WILL BE ADDED TO STICKERS PACK!!`
      );
      chunks = imageList.slice(0, 120); // TG rules!!!
    }

    if (chunks.length < 1) {
      this.log.warn(`no chunks to process::|>${chalk.white(chunks.length)}`);
      return;
    }

    let sta = new Date();
    let setChunk = chunks[0].length;
    console.log("-".repeat(30));
    for (let [index, chunk] of chunks.entries()) {
      const fixedPackName = `${packName}_${String(index + 1).padStart(
        2,
        "0"
      )}_by_${this.me.username}`;
      const fixedPackTitle = `${packTitle} - ${setChunk}/${imageList.length}`;
      // check if sticker pack exist
      chunk = await this.checkPackExist({
        packName: fixedPackName,
        files: chunk,
      });

      if (chunk.length < 1) {
        this.log.warn(
          `skipped batch::|>${chalk.white(index + 1)} of ${chalk.white(
            chunks.length
          )}, no chunk to process with length::|>${chalk.white(chunk.length)}`
        );
        continue;
      }

      /**
       * MUST be follow telegram rules for pack name and title!
       */
      if (
        !this.isValidPackName(fixedPackName) &&
        !this.isValidPackTitle(fixedPackTitle)
      ) {
        this.log.error(
          `Invalid pack name or title::|>${chalk.white(fixedPackName)}`
        );
        this.log.error(
          `Invalid pack name or title::|>${chalk.white(fixedPackTitle)}`
        );
        break;
      }

      this.log.info(
        `batch::|>${chalk.white(index + 1)} of ${chalk.white(chunks.length)}`
      );

      this.log.info(`sticker pack name::|>${chalk.white(fixedPackName)}`);
      this.log.info(`sticker pack title::|>${chalk.white(fixedPackTitle)}`);
      this.log.info(
        `sticker pack share::|>${chalk.white(
          this.stickerShare + fixedPackName
        )}`
      );
      let firstImage = chunk.pop();
      await this.createNewPack({
        packName: fixedPackName,
        packTitle: fixedPackTitle,
        firstImage: firstImage,
      });
      let stadd = new Date();
      for (const [idx, image] of chunk.entries()) {
        this.log.info(
          `[${chalk.white(
            path.basename(image)
          )}] adding to pack::|>${chalk.white(idx + 1)} of ${chalk.white(
            chunk.length + 1
          )}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.addSticker({
          imageStream: fs.createReadStream(image),
          packName: fixedPackName,
        });
      }
      this.log.info(
        `complete adding ${chunk.length + 1} stickers in::|>${chalk.white(
          (new Date() - stadd) / 1000 + " Seconds"
        )}`
      );
      this.saveLog({
        packName: fixedPackName,
        packTitle: fixedPackTitle,
        stickerShare: this.stickerShare + fixedPackName,
        files: [
          ...chunk.map((i) => path.basename(i)),
          path.basename(firstImage),
        ],
      });
      console.log("-".repeat(30));
      setChunk = setChunk + chunk.length + 1;
    }
    this.log.info(
      `complete batch in::|>${chalk.white(
        (new Date() - sta) / 1000 + " Seconds"
      )}`
    );
    this.log.info(`stopping polling::|>${chalk.white(this.batchSize)}`);
    await this.bot.stopPolling();
    return;
  }
}
export default StickerJS;
