const addDays = require('date-fns/add_days');
const addWeeks = require('date-fns/add_weeks');
const addMonths = require('date-fns/add_months');
const addYears = require('date-fns/add_years');
const dateFormat = require('date-fns/format');

exports.dateStepFunction = period => {
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

function formatDate(date) {
    return dateFormat(date, 'YYYY-MM-DD');
}

exports.nextDueDate = (transaction) => {
    return formatDate(dateStepFunction(transaction.recurPeriod)(transaction.date, transaction.recurEvery));
};
