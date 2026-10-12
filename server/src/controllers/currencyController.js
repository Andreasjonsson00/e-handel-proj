import getRates from "../integrations/currencyAdapter.js";

const getCurrency = async (req, res, next) => {
  try {
    const rates = await getRates();

    res.json(rates);
  } catch (err) {
    next(err);
  }
};

export default getCurrency;
