// Category-specific Photography Gallery Class
class CategoryGallery {
    constructor(category) {
        this.category = category;
        this.photos = [];
        this.filteredPhotos = [];
        this.currentModalIndex = 0;
        this.searchTerm = '';
        this.dataService = window.photoDataService;
        
        // DOM Elements
        this.gallery = document.getElementById('photoGallery');
        this.searchInput = document.getElementById('searchInput');
        this.searchIcon = document.getElementById('searchIcon');
        this.searchClear = document.getElementById('searchClear');
        this.coverPhoto = document.querySelector('.cover-photo');
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
    }
    
    // Initialize photo data from the data service
    async initializePhotos() {
        try {
            await this.dataService.loadData();
            this.photos = this.dataService.getPhotosByCategory(this.category);
            this.filteredPhotos = [...this.photos];
        } catch (error) {
            console.error('Failed to load photo data:', error);
            this.photos = [];
            this.filteredPhotos = [];
        }
    }
    
    async init() {
        await this.initializePhotos();
        this.setupEventListeners();
        this.renderPhotos();
    }
    
    setupEventListeners() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndRenderPhotos();
            this.toggleSearchIcon();
            this.toggleCoverPhoto();
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
    
    filterAndRenderPhotos() {
        if (this.searchTerm) {
            // Use data service search then filter by category
            const searchResults = this.dataService.searchPhotos(this.searchTerm);
            this.filteredPhotos = searchResults.filter(photo => photo.category === this.category);
        } else {
            this.filteredPhotos = [...this.photos];
        }
        
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
                // Show error message to user
                this.modalImage.alt = 'Failed to load image';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'image-error';
                errorDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to load image';
                this.modalImage.parentElement.appendChild(errorDiv);
                console.error('Failed to load image:', photo.src);
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
                console.error('Failed to load image:', photo.src);
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

    toggleCoverPhoto() {
        if (this.coverPhoto) {
            if (this.searchInput.value.trim()) {
                this.coverPhoto.classList.add('hidden');
            } else {
                this.coverPhoto.classList.remove('hidden');
            }
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchTerm = '';
        this.filterAndRenderPhotos();
        this.toggleSearchIcon();
        this.toggleCoverPhoto();
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
} 