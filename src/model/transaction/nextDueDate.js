const addDays = require('date-fns/addDays');
const addWeeks = require('date-fns/addWeeks');
const addMonths = require('date-fns/addMonths');
const addYears = require('date-fns/addYears');
const dateFormat = require('date-fns/format');
const parseISO = require('date-fns/parseISO');

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
    return dateFormat(parseISO(date), 'yyyy-MM-dd');
}

exports.nextDueDate = (transaction) => {
    return formatDate(dateStepFunction(transaction.recurPeriod)(transaction.date, transaction.recurEvery));
};
