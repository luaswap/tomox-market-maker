import { providers, Wallet } from 'ethers'

/**
 * @description Creates an (unencrypted) ethers.js wallet object
 * @param privateKey [String]
 * @returns [Object] - TOMOs.js wallet object
 */
export const createWalletFromPrivateKey = privateKey => {
  let wallet

  try {
    wallet = new Wallet(privateKey)
  } catch (e) {
    console.log(e)
  }

  return wallet
}

export const createProvider = () => {
  return new providers.JsonRpcProvider(process.env.TOMOCHAIN_NODE_HTTP_URL, {
    chainId: parseInt(process.env.DEFAULT_NETWORK_ID, 10),
    name: undefined,
  })
}
