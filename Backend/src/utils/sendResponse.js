/**
 * Standard JSON response helper.
 */
const sendResponse = (res, statusCode, data, message = 'Success') => {
  const response = {
    success: true,
    message,
  };

  if (data !== undefined && data !== null) {
    if (data.pagination) {
      response.pagination = data.pagination;
      response.data = data.results;
    } else {
      response.data = data;
    }
  }

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;
