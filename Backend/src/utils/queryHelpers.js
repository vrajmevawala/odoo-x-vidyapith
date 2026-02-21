const { PAGINATION } = require('../config/constants');

/**
 * Build Prisma query options from Express req.query.
 *
 * @param {object} query      – req.query
 * @param {string[]} allowedFilters – field names that may be filtered
 * @returns {{ where, orderBy, skip, take, page }}
 */
const buildQueryOptions = (query, allowedFilters = []) => {
  // Pagination
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let take = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  if (page < 1) page = 1;
  if (take < 1) take = 1;
  if (take > PAGINATION.MAX_LIMIT) take = PAGINATION.MAX_LIMIT;
  const skip = (page - 1) * take;

  // Sorting  e.g. ?sort=-createdAt,name
  let orderBy = [];
  if (query.sort) {
    const parts = query.sort.split(',');
    parts.forEach((part) => {
      const desc = part.startsWith('-');
      const field = part.replace(/^-/, '');
      orderBy.push({ [field]: desc ? 'desc' : 'asc' });
    });
  } else {
    orderBy = [{ createdAt: 'desc' }];
  }

  // Filtering
  const where = {};
  allowedFilters.forEach((key) => {
    if (query[key] !== undefined && query[key] !== '') {
      // Boolean coercion for isCompleted
      if (query[key] === 'true') {
        where[key] = true;
      } else if (query[key] === 'false') {
        where[key] = false;
      } else {
        where[key] = query[key];
      }
    }
  });

  // Full-text search across allowed string fields
  if (query.search) {
    const searchTerm = query.search;
    where.OR = allowedFilters
      .filter((f) => typeof f === 'string')
      .map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' },
      }));
    if (where.OR.length === 0) delete where.OR;
  }

  return { where, orderBy, skip, take, page };
};

/**
 * Build pagination metadata.
 */
const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});

module.exports = { buildQueryOptions, paginationMeta };
