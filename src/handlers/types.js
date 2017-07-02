const Joi = require('joi');

exports.id = Joi.string().max(100);
exports.name = Joi.string().max(255);
exports.accountType = Joi.any().valid('bank', 'cc', 'asset');
exports.money = Joi.number().integer();
exports.position = Joi.number().integer();
exports.date = Joi.date().iso().raw();
exports.transactionType = Joi.string().max(20);
exports.payee = Joi.string().max(1024);
exports.notes = Joi.string().max(10000);

exports.jsonContentType = Joi.any().valid('application/json');