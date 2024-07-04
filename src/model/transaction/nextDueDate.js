import {addDays, addWeeks, addMonths, addYears, format as dateFormat, parseISO} from 'date-fns';

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

function formatDate(date) {
    return dateFormat(parseISO(date), 'yyyy-MM-dd');
}

export const nextDueDate = (transaction) => {
    return dateFormat(dateStepFunction(transaction.recurPeriod)(transaction.date, transaction.recurEvery));
};
