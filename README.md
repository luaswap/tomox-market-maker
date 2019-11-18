# tomox-market-maker
_Simple market maker to create liquidity/volume for TomoX_


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
- `orderbookLength`: Number of orders that needs to be created by the bot.

You can get pairs information via DEX API, e.g: DEX testnet `https://dex.testnet.tomochain.com/api/pairs/data`

## Usage

The bot supports any pairs with proper config

```
node cmd.js bot BTC-TOMO
```

