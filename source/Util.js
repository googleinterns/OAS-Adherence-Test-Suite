const Constant = require('./Constant');

function getRandomNumber(low, high, options) {
  low = low || Constant.MIN_INTEGER;
  high = high || Constant.MAX_INTEGER;

  let result = Math.random() * (high - low) + low;
  if (options && options.returnInteger) {
    result = Math.trunc(result);
  }

  return result;
}

function getRandomString(length) {
  let result = '';
  const characters = Constant.CHARACTERS;
  const charactersLength = characters.length;
  for (let index = 0; index < length; index++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


function getJsonFieldsAtLevel(obj, level) {
  if (!obj || typeof(obj) !== 'object') return [];
  if (level < 1) return [];

  const keysAtCurrentLevel = Object.keys(obj);

  if (level == 1) return keysAtCurrentLevel;

  let fields = [];
  if (keysAtCurrentLevel.length) {
    for (let index=0; index<keysAtCurrentLevel.length; index++) {
      getJsonFieldsAtLevel(obj[keysAtCurrentLevel[index]], level-1);
      fields = fields.concat(
          getJsonFieldsAtLevel(obj[keysAtCurrentLevel[index]], level-1));
    }
  }
  return fields;
}

module.exports = {
  getRandomNumber,
  getRandomString,
  getJsonFieldsAtLevel,
};
