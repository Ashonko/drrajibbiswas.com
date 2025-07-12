// Photography Gallery Class
class PhotographyGallery {
    constructor() {
        this.photos = [];
        this.filteredPhotos = [];
        this.currentFilter = 'all';
        this.currentModalIndex = 0;
        this.searchTerm = '';
        this.isLoading = false;
        this.showingCategories = true;
        this.dataService = window.photoDataService;
        
        // DOM Elements
        this.categoryView = document.getElementById('categoryView');
        this.gallery = document.getElementById('photoGallery');
        this.searchInput = document.getElementById('searchInput');
        this.searchIcon = document.getElementById('searchIcon');
        this.searchClear = document.getElementById('searchClear');
        this.heroBanner = document.querySelector('.hero-banner');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.noResults = document.getElementById('noResults');
        this.modal = document.getElementById('photoModal');
        this.modalImage = document.getElementById('modalImage');
        this.modalLoading = document.getElementById('modalLoading');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalDescription = document.getElementById('modalDescription');
        this.modalLocation = document.getElementById('modalLocation');
        this.modalDate = document.getElementById('modalDate');
        this.modalClose = document.getElementById('modalClose');
        this.modalPrev = document.getElementById('modalPrev');
        this.modalNext = document.getElementById('modalNext');
        
        // Validate required DOM elements
        this.validateDOMElements();
    }
    
    validateDOMElements() {
        const requiredElements = [
            { element: this.categoryView, name: 'categoryView' },
            { element: this.gallery, name: 'photoGallery' },
            { element: this.dataService, name: 'photoDataService' }
        ];
        
        const missingElements = requiredElements.filter(item => !item.element);
        
        if (missingElements.length > 0) {
            console.error('Missing required DOM elements:', missingElements.map(item => item.name));
            return false;
        }
        
        return true;
    }
    
    // Initialize photo data from the data service
    async initializePhotos() {
        try {
            console.log('Starting photo data initialization...');
            await this.dataService.loadData();
            this.photos = this.dataService.getAllPhotos();
            this.filteredPhotos = [...this.photos];
            console.log('Photo data loaded successfully:', this.photos.length, 'photos');
        } catch (error) {
            console.error('Failed to load photo data:', error);
            this.photos = [];
            this.filteredPhotos = [];
            // Show error message to user
            this.showLoadingError();
        }
    }
    
    async init() {
        try {
            console.log('Initializing photography gallery...');
            
            // Validate DOM elements first
            if (!this.validateDOMElements()) {
                throw new Error('Required DOM elements are missing');
            }
            
            await this.initializePhotos();
            this.setupEventListeners();
            
            // Only render categories if we have photos
            if (this.photos.length > 0) {
                this.renderCategories();
                console.log('Gallery initialized successfully');
            } else {
                console.warn('No photos loaded, showing error message');
                this.showLoadingError();
            }
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showLoadingError();
        }
    }
    
    setupEventListeners() {
        // Filter links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleFilterChange(e.target.dataset.filter);
            });
        });
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.handleSearchOrFilter();
            this.toggleSearchIcon();
            this.toggleHeroBanner();
        });

        // Clear search functionality
        if (this.searchClear) {
            this.searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Modal controls
        this.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        this.modalPrev.addEventListener('click', () => {
            this.showPreviousImage();
        });
        
        this.modalNext.addEventListener('click', () => {
            this.showNextImage();
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('active')) {
                switch(e.key) {
                    case 'Escape':
                        this.closeModal();
                        break;
                    case 'ArrowLeft':
                        this.showPreviousImage();
                        break;
                    case 'ArrowRight':
                        this.showNextImage();
                        break;
                }
            }
        });
        
        // Modal overlay click
        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
    }
    
    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.showGalleryView();
        this.filterAndRenderPhotos();
    }
    
    handleSearchOrFilter() {
        if (this.searchTerm.trim() === '' && this.currentFilter === 'all') {
            this.showCategoryView();
        } else {
            this.showGalleryView();
            this.filterAndRenderPhotos();
        }
    }
    
    showCategoryView() {
        this.showingCategories = true;
        this.categoryView.style.display = 'block';
        this.gallery.style.display = 'none';
        this.noResults.style.display = 'none';
    }
    
    showGalleryView() {
        this.showingCategories = false;
        this.categoryView.style.display = 'none';
        this.gallery.style.display = 'grid';
    }
    
    filterAndRenderPhotos() {
        let filtered = [...this.photos];
        
        // Apply category filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(photo => photo.category === this.currentFilter);
        }
        
        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(photo => 
                photo.title.toLowerCase().includes(this.searchTerm) ||
                photo.description.toLowerCase().includes(this.searchTerm) ||
                (photo.locationName && photo.locationName.toLowerCase().includes(this.searchTerm)) ||
                photo.tags.some(tag => tag.toLowerCase().includes(this.searchTerm))
            );
        }
        
        this.filteredPhotos = filtered;
        this.renderPhotos();
    }
    
    renderPhotos() {
        if (this.filteredPhotos.length === 0) {
            this.gallery.innerHTML = '';
            this.noResults.style.display = 'block';
            return;
        }
        
        this.noResults.style.display = 'none';
        
        const photosHTML = this.filteredPhotos.map((photo, index) => `
            <div class="photo-card" data-index="${index}">
                <div class="photo-image-container">
                    <img src="${photo.thumb}" alt="${photo.title}" class="photo-image" loading="lazy">
                    <div class="photo-overlay">
                        <div class="photo-overlay-content">
                            <h3>${photo.title}</h3>
                            <p>${photo.locationName || 'Unknown Location'}${photo.date ? ' • ' + this.formatDate(photo.date) : ''}</p>
                        </div>
                    </div>
                </div>
                <div class="photo-meta">
                    <h3 class="photo-title">${photo.title}</h3>
                    <p class="photo-description">${this.dataService.truncateText(photo.description, 160)}</p>
                    <div class="photo-details">
                        ${photo.locationName ? `
                        <div class="photo-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${photo.locationName}</span>
                        </div>` : ''}
                        ${photo.date ? `<div class="photo-date">${this.formatDate(photo.date)}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        this.gallery.innerHTML = photosHTML;
        
        // Add click listeners to photo cards
        document.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                this.openModal(index);
            });
        });
    }
    
    renderCategories() {
        // Hide initial loading indicator
        const initialLoading = document.getElementById('initialLoading');
        if (initialLoading) {
            initialLoading.style.display = 'none';
        }
        
        const categoryData = this.dataService.getPhotosByCategories();
        const categories = [
            {
                name: 'The Beauty of Bangladesh',
                key: 'bangladesh-nature',
                subtitle: 'Discover the stunning landscapes and natural wonders.',
                photos: categoryData['bangladesh-nature'].slice(0, 4)
            },
            {
                name: 'People of Bangladesh',
                key: 'bangladesh-people',
                subtitle: 'Celebrate the vibrant culture and warmth.',
                photos: categoryData['bangladesh-people'].slice(0, 4)
            },
            {
                name: 'Beautiful Nepal',
                key: 'nepal',
                subtitle: 'Experience the breathtaking beauty of Nepal.',
                photos: categoryData['nepal'].slice(0, 4)
            },
            {
                name: 'Celestial Bodies',
                key: 'celestial-bodies',
                subtitle: 'Marvel at the awe-inspiring wonders of the night sky.',
                photos: categoryData['celestial-bodies'].slice(0, 4)
            },
            {
                name: 'Neighbours around us',
                key: 'neighbours-around-us',
                subtitle: 'Explore the neighbours roaming around us',
                photos: categoryData['neighbours-around-us'].slice(0, 4)
            }
        ];
        
        const categoriesHTML = categories.map(category => {
            if (category.photos.length === 0) return '';
            
            const mainPhoto = category.photos[0];
            const subPhotos = category.photos.slice(1, 4);
            
            return `
                <div class="category-section">
                    <div class="category-header">
                        <div>
                            <h2 class="category-title">${category.name}</h2>
                            <p class="category-subtitle">${category.subtitle}</p>
                        </div>
                        <a href="#" class="view-all-btn" data-category="${category.key}">
                            <span>View All</span>
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                    <div class="category-grid">
                        <div class="category-main-photo" data-photo-id="${mainPhoto.id}">
                            <img src="${mainPhoto.thumb}" alt="${mainPhoto.title}" loading="lazy">
                            <div class="category-photo-overlay">
                                <h3 class="category-photo-title">${mainPhoto.title}</h3>
                                <p class="category-photo-location">${mainPhoto.locationName || ''}</p>
                            </div>
                        </div>
                        <div class="category-sub-photos">
                            ${subPhotos.map(photo => `
                                <div class="category-sub-photo" data-photo-id="${photo.id}">
                                    <img src="${photo.thumb}" alt="${photo.title}" loading="lazy">
                                    <div class="category-photo-overlay">
                                        <h3 class="category-photo-title">${photo.title}</h3>
                                        <p class="category-photo-location">${photo.locationName || ''}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.categoryView.innerHTML = categoriesHTML;
        
        // Add event listeners
        this.categoryView.querySelectorAll('.view-all-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                window.location.href = `/photography/${category}/`;
            });
        });
        
        // Add photo click listeners
        this.categoryView.querySelectorAll('[data-photo-id]').forEach(photoEl => {
            photoEl.addEventListener('click', () => {
                const photoId = parseInt(photoEl.dataset.photoId);
                const photoIndex = this.photos.findIndex(p => p.id === photoId);
                this.filteredPhotos = [...this.photos];
                this.openModal(photoIndex);
            });
        });
    }
    
    openModal(index) {
        this.currentModalIndex = index;
        const photo = this.filteredPhotos[index];
        
        // Show loading indicator
        this.modalLoading.style.display = 'flex';
        this.modalImage.classList.remove('loaded');
        this.modalImage.src = '';
        document.querySelector('.modal-info').classList.add('loading');
        
        // Set photo info
        this.modalTitle.textContent = photo.title;
        this.modalDescription.textContent = photo.description;
        
        // Set the location with custom link (if provided)
        if (photo.locationName && photo.locationLink) {
            this.modalLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> <a href="${photo.locationLink}" target="_blank" class="modal-location-link">${photo.locationName}</a>`;
        } else if (photo.locationName) {
            this.modalLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${photo.locationName}</span>`;
        } else {
            this.modalLocation.innerHTML = '';
        }
        
        // Set the date (if provided)
        if (photo.date) {
            this.modalDate.innerHTML = `<i class="fas fa-calendar"></i> ${this.formatDate(photo.date)}`;
        } else {
            this.modalDate.innerHTML = '';
        }
        
        // Load the image with minimum 1.5s delay
        const img = new Image();
        const loadStartTime = Date.now();
        
        img.onload = () => {
            const loadTime = Date.now() - loadStartTime;
            const remainingTime = Math.max(0, 1500 - loadTime);
            
            setTimeout(() => {
                this.modalImage.src = photo.src;
                this.modalImage.alt = photo.title;
                this.modalImage.classList.add('loaded');
                this.modalLoading.style.display = 'none';
                document.querySelector('.modal-info').classList.remove('loading');
            }, remainingTime);
        };
        img.onerror = () => {
            const loadTime = Date.now() - loadStartTime;
            const remainingTime = Math.max(0, 1500 - loadTime);
            
            setTimeout(() => {
                this.modalLoading.style.display = 'none';
                document.querySelector('.modal-info').classList.remove('loading');
                // Error message
                this.showImageError('Failed to load image');
            }, remainingTime);
        };
        img.src = photo.src;
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    showPreviousImage() {
        this.currentModalIndex = (this.currentModalIndex - 1 + this.filteredPhotos.length) % this.filteredPhotos.length;
        this.updateModalImage();
    }
    
    showNextImage() {
        this.currentModalIndex = (this.currentModalIndex + 1) % this.filteredPhotos.length;
        this.updateModalImage();
    }
    
    updateModalImage() {
        const photo = this.filteredPhotos[this.currentModalIndex];
        
        // Clear everything immediately first
        this.modalTitle.textContent = '';
        this.modalDescription.textContent = '';
        this.modalLocation.innerHTML = '';
        this.modalDate.innerHTML = '';
        this.modalImage.alt = '';
        
        // Hide info immediately and show loading indicator
        document.querySelector('.modal-info').classList.add('loading');
        this.modalLoading.style.display = 'flex';
        this.modalImage.classList.remove('loaded');
        this.modalImage.src = '';
        
        // Load the image with minimum 1.5s delay
        const img = new Image();
        const loadStartTime = Date.now();
        
        img.onload = () => {
            const loadTime = Date.now() - loadStartTime;
            const remainingTime = Math.max(0, 1500 - loadTime);
            
            setTimeout(() => {
                // Set photo info when image loads
                this.modalTitle.textContent = photo.title;
                this.modalDescription.textContent = photo.description;
                
                // Set the location with custom link (if provided)
                if (photo.locationName && photo.locationLink) {
                    this.modalLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> <a href="${photo.locationLink}" target="_blank" class="modal-location-link">${photo.locationName}</a>`;
                } else if (photo.locationName) {
                    this.modalLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> <span>${photo.locationName}</span>`;
                } else {
                    this.modalLocation.innerHTML = '';
                }
                
                // Set the date (if provided)
                if (photo.date) {
                    this.modalDate.innerHTML = `<i class="fas fa-calendar"></i> ${this.formatDate(photo.date)}`;
                } else {
                    this.modalDate.innerHTML = '';
                }
                
                this.modalImage.src = photo.src;
                this.modalImage.alt = photo.title;
                this.modalImage.classList.add('loaded');
                this.modalLoading.style.display = 'none';
                document.querySelector('.modal-info').classList.remove('loading');
            }, remainingTime);
        };
        img.onerror = () => {
            const loadTime = Date.now() - loadStartTime;
            const remainingTime = Math.max(0, 1500 - loadTime);
            
            setTimeout(() => {
                this.modalLoading.style.display = 'none';
                document.querySelector('.modal-info').classList.remove('loading');
                // You could show an error message here
            }, remainingTime);
        };
        img.src = photo.src;
    }
    
        toggleSearchIcon() {
        if (this.searchInput.value.trim()) {
            this.searchIcon.style.display = 'none';
            this.searchClear.classList.add('show');
        } else {
            this.searchIcon.style.display = 'block';
            this.searchClear.classList.remove('show');
        }
    }

    toggleHeroBanner() {
        if (this.heroBanner) {
            if (this.searchInput.value.trim()) {
                this.heroBanner.classList.add('hidden');
            } else {
                this.heroBanner.classList.remove('hidden');
            }
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.handleSearchOrFilter();
        this.toggleSearchIcon();
        this.toggleHeroBanner();
        this.searchInput.focus();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    // Show loading error message
    showLoadingError() {
        // Hide initial loading indicator
        const initialLoading = document.getElementById('initialLoading');
        if (initialLoading) {
            initialLoading.style.display = 'none';
        }
        
        if (this.categoryView) {
            this.categoryView.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 20px;"></i>
                    <h3 style="color: #333; margin-bottom: 10px;">Failed to Load Photos</h3>
                    <p style="color: #666; margin-bottom: 20px;">There was an error loading the photo gallery. Please try refreshing the page.</p>
                    <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-redo"></i> Refresh Page
                    </button>
                </div>
            `;
        }
    }
} 