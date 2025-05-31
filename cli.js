#!/usr/bin/node

/**
 * @github.com/motebaya - 5/8/2025
 * file: cli.js
 */

import { ArgumentParser, RawTextHelpFormatter } from "argparse";
import StickerJS from "./lib/Sticker.js";

/**
 * cli handler
 */
(async () => {
  const parser = new ArgumentParser({
    description:
      "\t@github.com/motebaya - 2025\n     Manage yu TG Stickers with NodeJS \n   ",
    formatter_class: RawTextHelpFormatter,
  });

  parser.add_argument("-c", "--create", {
    type: "str",
    help: "create new pack based spesified images dir name",
    metavar: "",
  });
  parser.add_argument("-d", "--delete", {
    type: "str",
    help: "delete sticker pack. req:packname/all to delete all",
    metavar: "",
  });
  parser.add_argument("-b", "--batch", {
    action: "store_true",
    help: "enable batch mode based on the value of `BATCH_SIZE` (recommended)",
  });
  parser.add_argument("-v", "--verify", {
    action: "store_true",
    help: "verify your local stickers",
  });

  const args = parser.parse_args();
  if (args.create) {
    if (
      !/\b\d{9,10}:[A-Za-z0-9_-]{35}\b/.test(process.env.BOT_TOKEN) ||
      process.env.STICKER_PACK_NAME.length < 1 ||
      process.env.STICKER_PACK_TITLE.length < 1
    ) {
      console.log(
        "ERR: You can configure BOT_TOKEN, STICKER_PACK_NAME, STICKER_PACK_TITLE in `.env` file"
      );
      return;
    }
    await new StickerJS({}).createSticker({
      imagePath: args.create,
      batch: args.batch,
    });
  } else if (args.verify) {
    new StickerJS({}).verifySticker();
  } else if (args.delete) {
    new StickerJS({}).deleteSticker({
      packName: args.delete,
    });
  } else {
    parser.print_help();
  }
})();
