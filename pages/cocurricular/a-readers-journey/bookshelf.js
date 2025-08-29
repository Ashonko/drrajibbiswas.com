// Bookshelf Application
class BookshelfApp {
    constructor() {
        this.books = [];
        this.filteredBooks = [];
        this.currentPage = 1;
        this.booksPerPage = 8;
        this.currentFilters = {
            genre: 'all',
            status: 'all',
            search: '',
            sort: 'title'
        };
        this.init();
    }

    async init() {
        try {
            await this.loadBooks();
            this.setupEventListeners();
            this.checkUrlParams();
            this.renderBooks();
            this.updateBookCount();
            this.updatePagination();
        } catch (error) {
            console.error('Failed to initialize bookshelf:', error);
            this.showError();
        }
    }

    async loadBooks() {
        try {
            const response = await fetch('books/data/books.json');
            if (!response.ok) {
                throw new Error('Failed to load books data');
            }
            this.books = await response.json();
            this.filteredBooks = [...this.books];
        } catch (error) {
            console.error('Error loading books:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        
        searchInput.addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
            this.toggleClearButton();
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            this.currentFilters.search = '';
            this.applyFilters();
            this.toggleClearButton();
        });

        // Genre filters
        document.querySelectorAll('.genre-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.genre-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.genre = e.target.dataset.genre;
                this.applyFilters();
            });
        });

        // Status filter
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        // Sort functionality
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.applyFilters();
        });

        // Window popstate for browser back/forward
        window.addEventListener('popstate', () => {
            this.checkUrlParams();
        });
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        
        if (bookId) {
            this.showBookDetail(bookId);
        } else {
            this.showBookshelf();
        }
    }

    toggleClearButton() {
        const clearButton = document.getElementById('clear-search');
        const searchInput = document.getElementById('search-input');
        
        if (searchInput.value.length > 0) {
            clearButton.classList.remove('d-none');
        } else {
            clearButton.classList.add('d-none');
        }
    }

    applyFilters() {
        let filtered = [...this.books];

        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(book => 
                book.title.toLowerCase().includes(searchTerm) ||
                book.authors.some(author => author.toLowerCase().includes(searchTerm)) ||
                book.description.toLowerCase().includes(searchTerm) ||
                book.genres.some(genre => genre.toLowerCase().includes(searchTerm))
            );
        }

        // Apply genre filter
        if (this.currentFilters.genre !== 'all') {
            filtered = filtered.filter(book => 
                book.genres.includes(this.currentFilters.genre)
            );
        }

        // Apply status filter
        if (this.currentFilters.status !== 'all') {
            filtered = filtered.filter(book => 
                book.status === this.currentFilters.status
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.currentFilters.sort) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return a.authors[0].localeCompare(b.authors[0]);
                case 'rating':
                    return (b.myRating || 0) - (a.myRating || 0);
                case 'dateRead':
                    const dateA = a.dateRead ? new Date(a.dateRead) : new Date(0);
                    const dateB = b.dateRead ? new Date(b.dateRead) : new Date(0);
                    return dateB - dateA;
                case 'publishedDate':
                    return new Date(b.publishedDate) - new Date(a.publishedDate);
                default:
                    return 0;
            }
        });

        this.filteredBooks = filtered;
        this.currentPage = 1; // Reset to first page when filters change
        this.renderBooks();
        this.updateBookCount();
        this.updatePagination();
    }

    renderBooks() {
        const grid = document.getElementById('books-grid');
        
        if (this.filteredBooks.length === 0) {
            grid.innerHTML = this.getNoResultsHTML();
            return;
        }

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.booksPerPage;
        const endIndex = startIndex + this.booksPerPage;
        const booksToShow = this.filteredBooks.slice(startIndex, endIndex);

        grid.innerHTML = booksToShow.map(book => this.getBookCardHTML(book)).join('');
    }

    getBookCardHTML(book) {
        const rating = this.generateRatingStars(book.myRating);
        const statusClass = this.getStatusClass(book.status);
        const publishedYear = new Date(book.publishedDate).getFullYear();
        
        return `
            <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
                <div class="book-card">
                    <div class="book-cover-container">
                        <img src="${book.coverImage}" alt="${book.title}" class="book-cover" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIENvdmVyPC90ZXh0Pjwvc3ZnPg=='">
                    </div>
                    <div class="book-info">
                        <h5 class="book-title" onclick="showBookDetail('${book.id}')">${book.title}</h5>
                        <div class="book-author" onclick="showAuthorBooks('${book.authors[0]}')">${book.authors.join(', ')}</div>
                        <div class="book-meta">
                            <div class="book-rating">${rating}</div>
                            <div class="book-year">${publishedYear}</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="book-status ${statusClass}">${book.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateRatingStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star star"></i>';
            } else {
                stars += '<i class="far fa-star star empty"></i>';
            }
        }
        return stars;
    }

    getStatusClass(status) {
        switch (status) {
            case 'Read':
                return 'status-read';
            case 'Currently Reading':
                return 'status-reading';
            case 'Want to Read':
                return 'status-want';
            default:
                return '';
        }
    }

    getNoResultsHTML() {
        return `
            <div class="col-12">
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h4>No books found</h4>
                    <p>I probably haven't read it, or it's not listed here.<br>If you think this is a book I should read, I'd really appreciate your suggestion, which you can send me through the <a href="/pages/contact/" class="linkDec">contact form</a>.</p>
                </div>
            </div>
        `;
    }

    updateBookCount() {
        const countElement = document.getElementById('book-count');
        const total = this.filteredBooks.length;
        const totalPages = Math.ceil(total / this.booksPerPage);
        const startIndex = (this.currentPage - 1) * this.booksPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.booksPerPage, total);
        
        if (total === 0) {
            countElement.textContent = 'No books found';
        } else if (totalPages === 1) {
            countElement.textContent = `Showing all ${total} books`;
        } else {
            countElement.textContent = `Showing ${startIndex}-${endIndex} of ${total} books (Page ${this.currentPage} of ${totalPages})`;
        }
    }

    updatePagination() {
        const paginationContainer = document.getElementById('pagination-container');
        const totalPages = Math.ceil(this.filteredBooks.length / this.booksPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav aria-label="Book pagination"><ul class="pagination justify-content-center">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="window.bookshelfApp.goToPage(${this.currentPage - 1})">Previous</a></li>`;
        } else {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">Previous</span></li>';
        }
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page and ellipsis
        if (startPage > 1) {
            paginationHTML += '<li class="page-item"><a class="page-link" href="#" onclick="window.bookshelfApp.goToPage(1)">1</a></li>';
            if (startPage > 2) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="window.bookshelfApp.goToPage(${i})">${i}</a></li>`;
            }
        }
        
        // Last page and ellipsis
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="window.bookshelfApp.goToPage(${totalPages})">${totalPages}</a></li>`;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="window.bookshelfApp.goToPage(${this.currentPage + 1})">Next</a></li>`;
        } else {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">Next</span></li>';
        }
        
        paginationHTML += '</ul></nav>';
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderBooks();
        this.updateBookCount();
        this.updatePagination();
        
        // Scroll to "My reading list" heading with a small delay to ensure DOM updates are complete
        setTimeout(() => {
            const readingListHeading = document.getElementById('reading-list-heading');
            if (readingListHeading) {
                readingListHeading.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Fallback to books-grid if heading not found
                const booksGrid = document.getElementById('books-grid');
                if (booksGrid) {
                    booksGrid.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }, 10);
    }

    showBookDetail(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        // Update URL
        window.history.pushState({}, '', `?id=${bookId}`);
        
        // Update page title
        document.title = `${book.title} - A Reader's Journey - Dr Rajib Biswas`;
        
        // Populate book detail
        document.getElementById('book-detail-title').textContent = book.title;
        document.getElementById('book-detail-cover').src = book.coverImage;
        document.getElementById('book-detail-cover').alt = book.title;
        
        const detailContent = document.getElementById('book-detail-content');
        detailContent.innerHTML = this.getBookDetailHTML(book);
        
        // Show detail view, hide bookshelf
        document.getElementById('bookshelf-view').classList.add('d-none');
        document.getElementById('book-detail-view').classList.remove('d-none');
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    getBookDetailHTML(book) {
        const rating = this.generateRatingStars(book.myRating);
        const statusClass = this.getStatusClass(book.status);
        const publishedDate = new Date(book.publishedDate).toLocaleDateString();
        const dateRead = book.dateRead ? new Date(book.dateRead).toLocaleDateString() : 'Not finished';
        
        return `
            <div class="book-detail-meta">
                <div class="detail-item">
                    <div class="detail-label">Author(s)</div>
                    <div class="detail-value">${book.authors.map(author => 
                        `<span class="book-author" onclick="showAuthorBooks('${author}')">${author}</span>`
                    ).join(', ')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">My Rating</div>
                    <div class="detail-value">${rating}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="book-status ${statusClass}">${book.status}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pages</div>
                    <div class="detail-value">${book.pageCount}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Published</div>
                    <div class="detail-value">${publishedDate}</div>
                </div>
            </div>

            <hr>
            
            <div class="book-description">
                <h5>Description</h5>
                <p>${book.description}</p>
            </div>
            
            ${book.myReview ? `
                <div class="book-review">
                    <h5><i class="fas fa-quote-left me-2"></i>My Review</h5>
                    <p>"${book.myReview}"</p>
                </div>
            ` : ''}
            
            <h6>Genre</h6>
            <div class="genre-badges">
                ${book.genres.map(genre => `<span class="genre-badge">${genre}</span>`).join('')}
            </div>
            
            <div class="mt-4">
                <a href="${book.moreInfoLink}" target="_blank" class="linkDecExt">
                    More info about this book
                </a>
            </div>
        `;
    }

    showBookshelf() {
        // Update URL
        window.history.pushState({}, '', window.location.pathname);
        
        // Update page title
        document.title = 'A Reader\'s Journey - Dr Rajib Biswas';
        
        // Show bookshelf view, hide detail
        document.getElementById('book-detail-view').classList.add('d-none');
        document.getElementById('bookshelf-view').classList.remove('d-none');
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    showAuthorBooks(authorName) {
        console.log('showAuthorBooks called with:', authorName);
        
        const authorBooks = this.books.filter(book => 
            book.authors.some(author => author === authorName)
        );
        
        console.log('Found books by author:', authorBooks);
        
        if (authorBooks.length === 0) {
            console.log('No books found for author:', authorName);
            return; // Don't show if no books found
        }
        
        // Filter by author and scroll to results
        document.getElementById('search-input').value = authorName;
        this.currentFilters.search = authorName;
        this.applyFilters();
        this.toggleClearButton();
        
        // If we're in detail view, go back to bookshelf
        if (!document.getElementById('bookshelf-view').classList.contains('d-none')) {
            window.scrollTo(0, document.getElementById('books-grid').offsetTop - 100);
        } else {
            this.showBookshelf();
            setTimeout(() => {
                window.scrollTo(0, document.getElementById('books-grid').offsetTop - 100);
            }, 100);
        }
    }

    showError() {
        const grid = document.getElementById('books-grid');
        grid.innerHTML = `
            <div class="col-12">
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error Loading Books</h4>
                    <p>Sorry, there was an error loading the book data. Please try refreshing the page.</p>
                </div>
            </div>
        `;
    }
}

// Global functions for onclick events
function showBookDetail(bookId) {
    if (window.bookshelfApp) {
        window.bookshelfApp.showBookDetail(bookId);
    }
}

function showBookshelf() {
    if (window.bookshelfApp) {
        window.bookshelfApp.showBookshelf();
    }
}

function showAuthorBooks(authorName) {
    if (window.bookshelfApp) {
        window.bookshelfApp.showAuthorBooks(authorName);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bookshelfApp = new BookshelfApp();
});