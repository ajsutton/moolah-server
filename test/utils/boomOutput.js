import Boom from '@hapi/boom';

function makeBoomOutput(boomMethod) {
  return message => JSON.stringify(Boom[boomMethod](message).output.payload);
}

export const badRequest = makeBoomOutput('badRequest');
export const notFound = makeBoomOutput('notFound');

export default {
  badRequest,
  notFound,
};
