const getPreferredTime = () => {
    return getTime(new Date());
}

const getTime = (date) => {

    const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };

    const indianDateTimeFormatter = new Intl.DateTimeFormat('en-IN', options);
    return indianDateTimeFormatter.format(date);
}

module.exports = {
    getPreferredTime
}