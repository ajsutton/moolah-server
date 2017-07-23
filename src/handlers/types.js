const Joi = require('joi');

exports.id = Joi.string().max(100);
exports.name = Joi.string().max(255);
exports.accountType = Joi.any().valid('bank', 'cc', 'asset');
exports.money = Joi.number().integer();
exports.position = Joi.number().integer();
exports.date = Joi.date().iso().raw();
exports.transactionType = Joi.string().max(20);
exports.payee = Joi.string().max(1024).allow('');
exports.notes = Joi.string().max(10000).allow('');
exports.pageSize = Joi.number().integer().positive();
exports.offset = Joi.number().integer().min(0);
exports.jsonContentType = Joi.any().valid('application/json');
exports.boolean = Joi.boolean();
exports.recurEvery = Joi.number().integer().min(1);
exports.recurPeriod = Joi.any().valid('ONCE', 'DAY', 'WEEK', 'MONTH', 'YEAR');