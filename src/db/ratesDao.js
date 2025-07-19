import Big from 'big.js';

const scalar = 1000000;

async function loadRate(query, userId, from, to, date) {
  if (from == to) {
    return scalar;
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
    return scalar;
  }
  return results[0].rate;
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

  async getRate(userId, date, from, to) {
    const results = await this.query(
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
      return null;
    }
    return results[0].rate;
  }

  async getRates(userId, fromDate, toDate, pairs) {
    const args = [userId, fromDate, toDate];
    const conditions = pairs
      .map(pair => {
        args.push(pair.from, pair.to);
        return '(base = ? AND quote = ?)';
      })
      .join(' OR ');

    const query = `SELECT base, quote, rate, date
         FROM exchange_rate
        WHERE user_id = ?
          AND date >= ?
          AND date <= ?
          AND (${conditions})`;
    const results = await this.query(query, ...args);
    return results.reduce((acc, row) => {
      const key = `${row.base}/${row.quote}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({ date: row.date, rate: row.rate });
      return acc;
    }, {});
  }

  async convert(userId, amount, from, to, date) {
    const rate = await loadRate(this.query, userId, from, to, date);
    return Big(amount)
      .mul(Big(rate).div(scalar))
      .round(0, Big.roundHalfEven)
      .toNumber();
  }
}
