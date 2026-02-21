const { PAGINATION } = require('../config/constants');

/**
 * Build pagination, filtering, and sorting from query params.
 *
 * @param {object} query - Express req.query
 * @param {string[]} allowedFilters - Fields that can be filtered on
 * @returns {{ filter, sort, skip, limit, page }}
 */
const buildQueryOptions = (query, allowedFilters = []) => {
  // Pagination
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;
  const skip = (page - 1) * limit;

  // Sorting  e.g. ?sort=-createdAt,name
  let sort = {};
  if (query.sort) {
    const parts = query.sort.split(',');
    parts.forEach((part) => {
      const direction = part.startsWith('-') ? -1 : 1;
      const field = part.replace(/^-/, '');
      sort[field] = direction;
    });
  } else {
    sort = { createdAt: -1 };
  }

  // Filtering  e.g. ?status=Available&type=Fuel
  const filter = {};
  allowedFilters.forEach((key) => {
    if (query[key] !== undefined && query[key] !== '') {
      filter[key] = query[key];
    }
  });

  // Search support  e.g. ?search=toyota
  if (query.search) {
    filter.$or = allowedFilters
      .filter((f) => typeof f === 'string')
      .map((field) => ({
        [field]: { $regex: query.search, $options: 'i' },
      }));
    if (filter.$or.length === 0) delete filter.$or;
  }

  return { filter, sort, skip, limit, page };
};

/**
 * Build pagination metadata for responses.
 */
const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

module.exports = { buildQueryOptions, paginationMeta };
