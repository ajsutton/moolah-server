import { assert } from 'chai';
import dslUtils from './dslUtils.js';

export default class RatesDsl {
  constructor(server) {
    this.server = server;
  }

  async setRate(args) {
    const options = Object.assign(
      {
        date: '2017-06-03',
        from: 'USD',
        to: 'AUD',
        rate: 1.2,
        statusCode: 201,
      },
      args
    );

    const response = await this.server.post(
      '/api/rates/',
      {
        date: options.date,
        from: options.from,
        to: options.to,
        rate: options.rate,
      },
      options.statusCode
    );
    assert.equal(response.statusCode, options.statusCode);
  }

  async verifyRates(args) {
    const options = Object.assign(
      {
        fromDate: '2017-06-01',
        toDate: '2017-06-30',
        pairs: [],
        expectedRates: {},
      },
      args
    );

    const queryArgs = dslUtils.formatQueryArgs({
      from: options.fromDate,
      to: options.toDate,
      currency: options.pairs,
    });
    const response = await this.server.get(`/api/rates/${queryArgs}`, 200);

    const rateData = JSON.parse(response.payload);
    assert.deepEqual(
      rateData,
      options.expectedRates,
      'Rates do not match expected value'
    );
  }
}
