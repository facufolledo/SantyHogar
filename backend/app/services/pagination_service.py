"""Pagination service for handling paginated responses."""


class PaginationService:
    """Service for handling pagination logic."""

    def __init__(self, page: int = 1, limit: int = 20):
        """
        Initialize pagination service.
        
        Args:
            page: Current page number (1-indexed)
            limit: Number of items per page
        """
        self.page = max(1, page)  # Ensure page >= 1
        self.limit = max(1, min(limit, 100))  # Clamp limit between 1 and 100
        self.offset = (self.page - 1) * self.limit

    def paginate(self, total: int, results: list) -> dict:
        """
        Generate paginated response.
        
        Args:
            total: Total number of items
            results: Paginated results for current page
            
        Returns:
            Dictionary with pagination metadata and results
        """
        total_pages = (total + self.limit - 1) // self.limit  # Ceiling division
        
        return {
            "data": results,
            "pagination": {
                "page": self.page,
                "limit": self.limit,
                "total": total,
                "pages": total_pages,
                "hasNext": self.page < total_pages,
                "hasPrev": self.page > 1,
            }
        }
