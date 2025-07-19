import Dsl from './dsl/index.js';

describe('Rate Management', function () {
  let dsl;

  beforeEach(async function () {
    dsl = await Dsl.create();
    dsl.login();
  });

  afterEach(function () {
    return dsl.tearDown();
  });

  it('should list rates', async function () {
    await dsl.rates.setRate({
      date: '2022-06-06',
      from: 'USD',
      to: 'AUD',
      rate: 1200000,
    });
    await dsl.rates.setRate({
      date: '2022-06-08',
      from: 'USD',
      to: 'AUD',
      rate: 1400000,
    });
    await dsl.rates.setRate({
      date: '2022-07-06',
      from: 'USD',
      to: 'AUD',
      rate: 1500000,
    });
    await dsl.rates.setRate({
      date: '2022-06-06',
      from: 'JPY',
      to: 'AUD',
      rate: 1100000,
    });
    await dsl.rates.verifyRates({
      fromDate: '2022-06-01',
      toDate: '2022-06-30',
      pairs: ['USD/AUD'],
      expectedRates: {
        'USD/AUD': [
          { date: '2022-06-06', rate: 1200000 },
          { date: '2022-06-08', rate: 1400000 },
        ],
      },
    });
    await dsl.rates.verifyRates({
      fromDate: '2022-06-01',
      toDate: '2022-06-30',
      pairs: ['USD/AUD', 'JPY/AUD'],
      expectedRates: {
        'USD/AUD': [
          { date: '2022-06-06', rate: 1200000 },
          { date: '2022-06-08', rate: 1400000 },
        ],
        'JPY/AUD': [{ date: '2022-06-06', rate: 1100000 }],
      },
    });
  });
});
