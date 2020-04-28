
calcPrecision = (price) => {
    const totalPrecision = 8
    let pricePrecision = 4
    let amountPrecision = totalPrecision - pricePrecision
    if (!price) return { pricePrecision: totalPrecision, amountPrecision: totalPrecision }
    switch (true) {
    case (price >= 50):
        pricePrecision = 2
        amountPrecision = totalPrecision - pricePrecision
        break
    case (price >= 1):
        pricePrecision = 4
        amountPrecision = totalPrecision - pricePrecision
        break
    case (price >= 0.1):
        pricePrecision = 5
        amountPrecision = totalPrecision - pricePrecision
        break
    case (price >= 0.001):
        pricePrecision = 6
        amountPrecision = totalPrecision - pricePrecision
        break
    default:
        pricePrecision = 8
        amountPrecision = totalPrecision - pricePrecision
        break
    }
    return { pricePrecision, amountPrecision }
}

module.exports = { calcPrecision }
