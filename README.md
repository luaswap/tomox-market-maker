# tomox-market-maker
_Simple market maker to create liquidity/volume for TomoX_

**NOTE: we only use this script in the development environment, use it with your own risk**


## Install
```
npm install
```
Create `config/local.json` file
```
cp config/default.json config/local.json
```
Update `local.json` file with your parameters

There are some parameters you need to update:
-  `ETH-TOMO`: Pair name
- `pkey`: Private key of wallet that has enough balance for trades
- `baseToken` and `quoteToken`: Addresses of pair
- `relayerUrl`: The url of DEX, e.g `https://dex.testnet.tomochain.com`
- `orderbookLength`: Number of BUY/SELL orders in Orderbook
- `speed`: `[miliseconds]` Speed of the creating orders of the bot. Recommend > 10 seconds
- `step`: The price step of the orders in orderbook ([L217](https://github.com/tomochain/tomox-market-maker/blob/6b8da681874b97fb24c86135851809b2928a25fc/commands/bot.js#L217))
- `volume`: Side of an orders (in USD)

You can get pairs information via DEX API, e.g: DEX testnet `https://dex.testnet.tomochain.com/api/pairs/data`

## Usage

The bot supports any pairs with proper config

```
node cmd.js bot BTC-TOMO
```

