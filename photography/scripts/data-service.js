/**
 * Photography Data Service
 * Centralized service for loading and managing photo data
 */
class PhotoDataService {
    constructor() {
        this.photos = [];
        this.categories = {
            'nepal': {
                title: 'Beautiful Nepal',
                subtitle: 'Experience the breathtaking beauty of Nepal',
                description: 'Capturing the daughter of the Himalayas'
            },
            'bangladesh-nature': {
                title: 'The Beauty of Bangladesh',
                subtitle: 'Discover the stunning landscapes and natural wonders',
                description: 'From serene waters to vibrant sunsets'
            },
            'bangladesh-people': {
                title: 'People of Bangladesh',
                subtitle: 'Celebrate the vibrant culture and warmth',
                description: 'Stories of life and human connection'
            },
            'celestial-bodies': {
                title: 'Celestial Bodies',
                subtitle: 'Marvel at the awe-inspiring wonders of the night sky',
                description: 'From lunar phases to starlit horizons'
            },
            'neighbours-around-us': {
                title: 'Neighbours around us',
                subtitle: 'Explore the neighbours roaming around us',
                description: 'From the Himalayas to the Arabian Sea'
            }
        };
        this.loaded = false;
        this.loadPromise = null;
    }

    /**
     * Load photo data from JSON file
     * @returns {Promise} Promise that resolves when data is loaded
     */
    async loadData() {
        if (this.loaded) {
            return this.photos;
        }

        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._fetchData();
        return this.loadPromise;
    }

    async _fetchData() {
        try {
            // Determine the correct path based on current location
            const currentPath = window.location.pathname;
            const isMainPage = currentPath.endsWith('/photography/') || currentPath.endsWith('/photography/index.html');
            const dataPath = isMainPage ? './data/photos.json' : '../data/photos.json';

            console.log('Fetching photo data from:', dataPath);
            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`Failed to load photo data: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Raw photo data received:', data);
            
            // Validate data structure
            if (!Array.isArray(data)) {
                throw new Error('Invalid photo data: expected array');
            }
            
            if (data.length === 0) {
                console.warn('Photo data is empty');
            }

            this.photos = data;
            this.loaded = true;
            console.log('Photo data processed successfully:', this.photos.length, 'photos');
            return this.photos;
        } catch (error) {
            console.error('Error loading photo data:', error);
            console.error('Current path:', window.location.pathname);
            console.error('Attempted data path:', this.getDataPath());
            
            // Fallback to empty array if loading fails
            this.photos = [];
            this.loaded = true;
            return this.photos;
        }
    }

    // Helper method to get the correct data path
    getDataPath() {
        const currentPath = window.location.pathname;
        const isMainPage = currentPath.endsWith('/photography/') || currentPath.endsWith('/photography/index.html');
        return isMainPage ? './data/photos.json' : '../data/photos.json';
    }

    /**
     * Get all photos
     * @returns {Array} Array of all photos
     */
    getAllPhotos() {
        return this.photos;
    }

    /**
     * Get photos by category
     * @param {string} category - Category name
     * @returns {Array} Array of photos in the specified category
     */
    getPhotosByCategory(category) {
        return this.photos.filter(photo => photo.category === category);
    }

    /**
     * Get photo by ID
     * @param {number} id - Photo ID
     * @returns {Object|null} Photo object or null if not found
     */
    getPhotoById(id) {
        return this.photos.find(photo => photo.id === id) || null;
    }

    /**
     * Search photos by query
     * @param {string} query - Search query
     * @returns {Array} Array of matching photos
     */
    searchPhotos(query) {
        if (!query || query.trim() === '') {
            return this.photos;
        }

        const searchTerm = query.toLowerCase().trim();
        return this.photos.filter(photo => {
            return (
                photo.title.toLowerCase().includes(searchTerm) ||
                photo.description.toLowerCase().includes(searchTerm) ||
                photo.category.toLowerCase().includes(searchTerm) ||
                (photo.locationName && photo.locationName.toLowerCase().includes(searchTerm)) ||
                photo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        });
    }

    /**
     * Get category information
     * @param {string} category - Category name
     * @returns {Object} Category information
     */
    getCategoryInfo(category) {
        return this.categories[category] || {
            title: category,
            subtitle: '',
            description: ''
        };
    }

    /**
     * Get photos grouped by category
     * @returns {Object} Object with categories as keys and photo arrays as values
     */
    getPhotosByCategories() {
        const grouped = {};
        
        // Initialize all categories
        Object.keys(this.categories).forEach(category => {
            grouped[category] = [];
        });

        // Group photos by category
        this.photos.forEach(photo => {
            if (grouped[photo.category]) {
                grouped[photo.category].push(photo);
            }
        });

        return grouped;
    }

    /**
     * Get category statistics
     * @returns {Object} Object with category counts
     */
    getCategoryStats() {
        const stats = {};
        
        Object.keys(this.categories).forEach(category => {
            stats[category] = this.getPhotosByCategory(category).length;
        });

        return stats;
    }

    /**
     * Truncate text to specified length with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length (default: 160)
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength = 160) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }
}

// Create a singleton instance
window.photoDataService = new PhotoDataService(); 