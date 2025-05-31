## Sticker-JS

<div align="center">
Telegram Sticker Pack Manager

[![nodejs](https://img.shields.io/badge/nodeJs-18.18.2-green?logo=node.js&logoColor=green)](https://nodejs.org)
[![argparse](https://img.shields.io/badge/argparse-2.0.1-blue?logo=nodedotjs&logoColor=white)](https://www.npmjs.com/package/argparse)
[![chalk](https://img.shields.io/badge/chalk-5.4.1-yellow?logo=javascript&logoColor=white)](https://www.npmjs.com/package/chalk)
[![cli-progress](https://img.shields.io/badge/cli--progress-3.12.0-blueviolet?logo=terminal&logoColor=white)](https://www.npmjs.com/package/cli-progress)
[![dotenv](https://img.shields.io/badge/dotenv-16.5.0-lightgrey?logo=dotenv&logoColor=white)](https://www.npmjs.com/package/dotenv)
[![node-telegram-bot-api](https://img.shields.io/badge/node--telegram--bot--api-0.66.0-0088cc?logo=telegram&logoColor=white)](https://www.npmjs.com/package/node-telegram-bot-api)
[![sharp](https://img.shields.io/badge/sharp-0.34.2-green?logo=sharp&logoColor=white)](https://sharp.pixelplumbing.com)
[![winston](https://img.shields.io/badge/winston-3.17.0-blue?logo=winston&logoColor=white)](https://github.com/winstonjs/winston)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg?logo=github)](https://opensource.org/licenses/MIT)

</div>

NodeJS CLI tool for managing Telegram sticker packs. Create, verify, and delete sticker packs with ease using this powerful command-line interface.

### Features:

- Create new sticker packs from image directories
- Verify local sticker packs
- Delete existing sticker packs
- Batch processing support
- Image optimization with Sharp
- Comprehensive logging with Winston
- Telegram Bot API integration

### Prerequisites:

- Node.js 18.18.2 or higher (v22.14.0 recommended)
- Telegram Bot Token
- Sticker Pack Name and Title

### Installation:

```bash
git clone https://github.com/yourusername/sticker-js
cd sticker-js
npm install
```

rename `.env.example` to `.env` file in the root directory with the following variables:

> [!important]
> Sticker Name Rules:
>
> - **Pack name:** No uppercase letters, no punctuation, no symbols, and no more than 64 characters.
> - **Title:** More flexible, but must not exceed 50 characters.
> - **User Id:** go to this bot to get your user id https://t.me/RawDataBot
> - **Bot Token:** go to this bot to get your token https://t.me/BotFather
> - **Batch Size:** i recommended 50-100

```env
BOT_TOKEN=""
USER_ID="
BATCH_SIZE=5
STICKER_PACK_NAME="loremgod" # example title
STICKER_PACK_TITLE="sticker pack test lorem title" # example title
```

### Usage (CLI):

```bash
$ node cli
usage: cli.js [-h] [-c] [-d] [-b] [-v]

    @github.com/motebaya - 2025
    Manage your TG Stickers with NodeJS

optional arguments:
  -h, --help      show this help message and exit
  -c, --create    create new pack based on specified images directory name
  -d, --delete    delete sticker pack (req: packname/all to delete all)
  -b, --batch     enable batch mode based on BATCH_SIZE (recommended)
  -v, --verify    verify your local stickers
```

### Examples:

> [!note]
> before getting the user id, you need to start a chat with your bot using the account you want to get the user id from!
> otherwise, the user id won't be useful at all.

1. Create a new sticker pack:

```bash
node cli --create ./my-stickers
```

2. Create a sticker pack with batch processing:

```bash
node cli --create ./my-stickers --batch
```

3. Verify local stickers:

```bash
node cli --verify
```

4. Delete a sticker pack:

```bash
node cli --delete packname
```

5. Delete all sticker packs:

```bash
node cli --delete all
```

### Features in Detail:

- **Create Sticker Pack**: Convert images from a directory into a Telegram sticker pack
- **Batch Processing**: Process stickers in batches to avoid rate limits
- **Image Optimization**: Automatically optimize images for Telegram's requirements
- **Verification**: Verify local sticker packs for consistency
- **Deletion**: Remove sticker packs from your Telegram bot

### Dependencies:

- `argparse`: Command-line argument parsing
- `chalk`: Terminal string styling
- `cli-progress`: Progress bar for CLI
- `dotenv`: Environment variable management
- `node-telegram-bot-api`: Telegram Bot API integration
- `sharp`: Image processing
- `winston`: Logging

### License

This project is licensed under the [MIT License](LICENSE).
