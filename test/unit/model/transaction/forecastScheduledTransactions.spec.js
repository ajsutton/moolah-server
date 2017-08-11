const assert = require('chai').assert;
const forecastScheduledTransactions = require('../../../../src/model/transaction/forecastScheduledTransactions');

describe('Forecast Scheduled Transactions', function() {
    describe('extrapolateScheduledTransactions', function() {

        it('should extrapolate single scheduled transaction occurrences', function() {
            const result = forecastScheduledTransactions.extrapolateScheduledTransactions(
                [
                    {date: '2017-01-01', recurPeriod: 'MONTH', recurEvery: 2},
                ],
                '2017-12-31');
            assert.deepEqual(result, [
                {date: '2017-01-01', recurPeriod: 'MONTH', recurEvery: 2},
                {date: '2017-03-01', recurPeriod: 'MONTH', recurEvery: 2},
                {date: '2017-05-01', recurPeriod: 'MONTH', recurEvery: 2},
                {date: '2017-07-01', recurPeriod: 'MONTH', recurEvery: 2},
                {date: '2017-09-01', recurPeriod: 'MONTH', recurEvery: 2},
                {date: '2017-11-01', recurPeriod: 'MONTH', recurEvery: 2},
            ]);
        });

        it('should not repeat once off transactions', function() {
            const result = forecastScheduledTransactions.extrapolateScheduledTransactions(
                [
                    {date: '2017-01-01', recurPeriod: 'ONCE'},
                ],
                '2017-12-31');
            assert.deepEqual(result, [
                {date: '2017-01-01', recurPeriod: 'ONCE'},
            ]);
        });

        it('should interleave multiple repeating transactions', function() {
            const result = forecastScheduledTransactions.extrapolateScheduledTransactions(
                [
                    {date: '2017-01-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                    {date: '2017-01-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                ],
                '2017-12-31');
            assert.deepEqual(result, [
                {date: '2017-01-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                {date: '2017-01-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-02-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-03-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                {date: '2017-03-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-04-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-05-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                {date: '2017-05-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-06-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-07-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                {date: '2017-07-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-08-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-09-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                {date: '2017-09-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-10-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-11-01', recurPeriod: 'MONTH', amount: 100, recurEvery: 2},
                {date: '2017-11-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
                {date: '2017-12-07', recurPeriod: 'MONTH', amount: 200, recurEvery: 1},
            ]);
        });
    });

    describe('forecastBalances', function() {
        it('should calculate balances after scheduled transactions that occur on different days', function() {
            const balances = forecastScheduledTransactions.forecastBalances([
                {date: '2017-01-01', recurPeriod: 'MONTH', amount: 200, recurEvery: 2},
                {date: '2017-01-05', recurPeriod: 'MONTH', amount: -50, recurEvery: 1},
            ], 1000, '2017-06-01');
            assert.deepEqual(balances, [
                {date: '2017-01-01', balance: 1200},
                {date: '2017-01-05', balance: 1150},
                {date: '2017-02-05', balance: 1100},
                {date: '2017-03-01', balance: 1300},
                {date: '2017-03-05', balance: 1250},
                {date: '2017-04-05', balance: 1200},
                {date: '2017-05-01', balance: 1400},
                {date: '2017-05-05', balance: 1350},
            ]);
        });
        it('should calculate balances after scheduled transactions that occur on the same day', function() {
            const balances = forecastScheduledTransactions.forecastBalances([
                {date: '2017-01-01', recurPeriod: 'MONTH', amount: 200, recurEvery: 2},
                {date: '2017-02-01', recurPeriod: 'MONTH', amount: -50, recurEvery: 1},
            ], 1000, '2017-06-01');
            assert.deepEqual(balances, [
                {date: '2017-01-01', balance: 1200},
                {date: '2017-02-01', balance: 1150},
                {date: '2017-03-01', balance: 1300},
                {date: '2017-04-01', balance: 1250},
                {date: '2017-05-01', balance: 1400},
                {date: '2017-06-01', balance: 1350},
            ]);
        });
    });
});