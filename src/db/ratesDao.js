import Big from 'big.js';

const scalar = 1000000;

async function loadRate(query, userId, from, to, date) {
  if (from == to) {
    return 1;
  }

  const results = await query(
    `SELECT rate 
       FROM exchange_rate
      WHERE user_id = ?
        AND base = ?
        AND quote = ?
        AND date <= ?
   ORDER BY date DESC
      LIMIT 1`,
    userId,
    from,
    to,
    date
  );
  if (results.length == 0) {
    return 1;
  }
  return Big(results[0].rate).div(scalar);
}

export default class RatesDao {
  constructor(query) {
    this.query = query;
  }

  setRate(userId, date, from, to, rate) {
    if (from == to) {
      return Promise.all();
    }

    const inverse = Big(1)
      .div(Big(rate).div(scalar))
      .mul(scalar)
      .round(0, Big.roundHalfEven)
      .toNumber();
    return this.query(
      'INSERT INTO exchange_rate (user_id, date, base, quote, rate) ' +
        '   VALUES (?, ?, ?, ?, ?), ' +
        '          (?, ?, ?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE rate = VALUES(rate)',
      userId,
      date,
      from,
      to,
      rate,

      userId,
      date,
      to,
      from,
      inverse
    );
  }

  async convert(userId, amount, from, to, date) {
    const rate = await loadRate(this.query, userId, from, to, date);
    return Big(amount).mul(rate).round(0, Big.roundHalfEven).toNumber();
  }
}
