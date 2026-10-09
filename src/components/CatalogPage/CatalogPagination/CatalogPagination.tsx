type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  productsPerPage: number;
  onPageChange: (page: number) => void;
};

export function CatalogPagination({
  currentPage,
  totalPages,
  totalProducts,
  productsPerPage,
  onPageChange,
}: CatalogPaginationProps) {
  const startIndex = (currentPage - 1) * productsPerPage;

  const paginationPages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter((page) => {
    if (totalPages <= 5) return true;

    if (currentPage <= 3) {
      return page <= 3 || page === totalPages;
    }

    if (currentPage >= totalPages - 2) {
      return page === 1 || page >= totalPages - 2;
    }

    return (
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
    );
  });

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange(page);

    document.querySelector(".catalog-page-heading")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="catalog-pagination">
      <span className="catalog-pagination-info">
        Показано {startIndex + 1}–
        {Math.min(startIndex + productsPerPage, totalProducts)} із{" "}
        {totalProducts}
      </span>

      <div className="catalog-pagination-controls">
        <button
          type="button"
          className="catalog-page-button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Попередня сторінка"
        >
          ←
        </button>

        {paginationPages.map((page, index) => {
          const previousPage = paginationPages[index - 1];
          const showDots = previousPage && page - previousPage > 1;

          return (
            <span className="catalog-pagination-item" key={page}>
              {showDots && <span className="catalog-pagination-dots">...</span>}

              <button
                type="button"
                className={`catalog-page-button ${
                  currentPage === page ? "catalog-page-button-active" : ""
                }`}
                aria-current={currentPage === page ? "page" : undefined}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          className="catalog-page-button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Наступна сторінка"
        >
          →
        </button>
      </div>
    </div>
  );
}
