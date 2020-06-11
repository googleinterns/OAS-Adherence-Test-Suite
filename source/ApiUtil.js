const {getJsonFieldsAtLevel} = require('./Util');
function getApiEndPoints(oasDoc) {
  const apiEndPoints = [];

  const paths = getJsonFieldsAtLevel(oasDoc.paths, 1) || [];
  for (let index = 0; index < paths.length; index++) {
    const path = paths[index];
    const httpMethods = getJsonFieldsAtLevel(oasDoc.paths[path], 1);
    // console.log(httpMethods);
    for (let _index = 0; _index < httpMethods.length; _index++) {
      const httpMethod = httpMethods[_index];
      apiEndPoints.push({
        path,
        httpMethod,
      });
    }
  }
  return apiEndPoints;
}

module.exports = {
  getApiEndPoints,
};
