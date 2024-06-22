import Joi from 'joi';

export default {
    id: Joi.string().max(100),
    name: Joi.string().max(255),
    accountType: Joi.any().valid('bank', 'cc', 'asset', 'investment'),
    money: Joi.number().integer(),
    position: Joi.number().integer(),
    date: Joi.date().iso().raw(),
    transactionType: Joi.string().max(20),
    payee: Joi.string().max(1024).allow(''),
    notes: Joi.string().max(10000).allow(''),
    pageSize: Joi.number().integer().positive(),
    offset: Joi.number().integer().min(0),
    jsonContentType: Joi.any().valid('application/json'),
    boolean: Joi.boolean(),
    recurEvery: Joi.number().integer().min(1),
    recurPeriod: Joi.any().valid('ONCE', 'DAY', 'WEEK', 'MONTH', 'YEAR'),
    monthEnd: Joi.number().integer().min(1).max(31),

    arrayOf: (itemType) => Joi.array().items(itemType).single(),

    failAction: (request, h, err) => {
        throw err;
    },
}