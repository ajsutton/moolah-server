import {addDays} from 'date-fns/addDays';
import {addWeeks} from 'date-fns/addWeeks';
import {addMonths} from 'date-fns/addMonths';
import {addYears} from 'date-fns/addYears';
import {format as dateFormat} from 'date-fns/format';
import {parseISO} from 'date-fns/parseISO';

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
