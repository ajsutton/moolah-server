import idGenerator from '../../src/utils/idGenerator.js';

export const minimalTransaction = {
  id: 'transaction1',
  type: 'expense',
  date: '2017-06-04',
  accountId: 'account-id',
  amount: 5000,
};

export function makeTransaction(args, template = minimalTransaction) {
  return Object.assign({}, template, { id: idGenerator() }, args);
}

export default {
  minimalTransaction,
  makeTransaction,
};
