import type { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResponse {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

/**
 * Extract pagination parameters from request query
 */
export const getPaginationParams = (req: Request): PaginationParams => {
  const page = parseInt(req.query.page as string) || 1;
  // Default higher for admin list UIs that don't yet paginate in the client
  const rawLimit = parseInt(req.query.limit as string);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 100;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Generate pagination response object
 */
export const getPaginationResponse = (
  total: number,
  page: number,
  limit: number,
): PaginationResponse => {
  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
};

/**
 * Build pagination query string for API URLs
 */
export const buildPaginationQuery = (
  page: number,
  limit: number,
  additionalParams?: Record<string, string>,
): string => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  return params.toString();
};
