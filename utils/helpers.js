import { utils } from 'ethers'

export const randInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const computePricepoint = ({
                                    price,
                                    priceMultiplier,
                                    quoteMultiplier,
                                    precisionMultiplier,
                                  }) => {
  const a = price * precisionMultiplier
  const b = a.toFixed(0)
  const c = utils.bigNumberify(b)
  const d = c
    .mul(priceMultiplier)
    .mul(quoteMultiplier)
    .div(precisionMultiplier)

  return d
}

export const computeAmountPoints = ({
                                      amount,
                                      baseMultiplier,
                                      precisionMultiplier,
                                    }) => {
  const a = amount * precisionMultiplier
  const b = a.toFixed(0)
  const c = utils.bigNumberify(b)
  const d = c.mul(baseMultiplier).div(precisionMultiplier)

  return d
}
