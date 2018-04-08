# matrix-sticker-bot

[![#stickerbot:t2bot.io](https://img.shields.io/badge/matrix-%23stickerbot:t2bot.io-brightgreen.svg)](https://matrix.to/#/#stickerbot:t2bot.io)
[![TravisCI badge](https://travis-ci.org/turt2live/matrix-sticker-bot.svg?branch=master)](https://travis-ci.org/turt2live/matrix-sticker-bot)

A matrix bot to allow users to make their own sticker packs.

# Usage

1. Invite `@stickers:t2bot.io` to a private chat
2. Send the message `!stickers help` to get information about how to use the bot

# Building your own

*Note*: You'll need to have access to an account that the bot can use to get the access token.

1. Clone this repository
2. `npm install`
3. `npm run build`
4. Copy `config/default.yaml` to `config/production.yaml`
5. Run the bot with `NODE_ENV=production node index.js`
