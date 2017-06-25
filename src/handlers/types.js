const Joi = require('joi');

exports.id = Joi.number().integer().min(0);
exports.name = Joi.string().max(255);
exports.accountType = Joi.any().valid('bank', 'cc', 'asset');
exports.money = Joi.number().integer();

exports.jsonContentType = Joi.any().valid('application/json');