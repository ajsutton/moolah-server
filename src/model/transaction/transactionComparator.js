export default (transaction1, transaction2) => {
    if (transaction1.date < transaction2.date) {
        return -1;
    } else if (transaction1.date > transaction2.date) {
        return 1;
    } else if (transaction1.id < transaction2.id) {
        return -1;
    } else if (transaction1.id > transaction2.id) {
        return 1;
    } else {
        return 0;
    }
};