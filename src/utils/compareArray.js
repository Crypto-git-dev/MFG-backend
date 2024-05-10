const compareArray = (firstArray, secondArray) => {
  return JSON.stringify(firstArray) == JSON.stringify(secondArray);
};

module.exports = compareArray;
