import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  format as dateFormat,
} from 'date-fns';

export const dateStepFunction = period => {
  switch (period) {
    case 'DAY':
      return addDays;
    case 'WEEK':
      return addWeeks;
    case 'MONTH':
      return addMonths;
    case 'YEAR':
      return addYears;
    default:
      throw new Error(`Unknown period: ${period}`);
  }
};

export const nextDueDate = transaction => {
  return dateFormat(
    dateStepFunction(transaction.recurPeriod)(
      transaction.date,
      transaction.recurEvery
    )
  );
};
