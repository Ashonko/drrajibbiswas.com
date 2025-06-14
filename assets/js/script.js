$(document).ready(function () {
  // Load GTag
  $("#gtag").load("/components/core/gtag.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading dependencies: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Load dependencies
  $("#dependencies").load("/components/core/dependencies.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading dependencies: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Load navigation
  $("#navigation").load("/components/core/navigation.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading navigation: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Load footer
  $("#footer").load("/components/core/footer.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading footer: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Contents button
  var contentsBtn = $('#contents-button');

  // Show or hide the button based on scroll position
  $(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
      contentsBtn.addClass('show');
    } else {
      contentsBtn.removeClass('show');
    }
  });

  // Scroll to #contents section when the button is clicked
  contentsBtn.on('click', function (e) {
    e.preventDefault();
    var target = $('#contents'); // Select the #contents element
    if (target.length) { // Check if #contents exists
      $('html, body').animate(
        { scrollTop: target.offset().top }, // Scroll to #contents
        300 // Animation duration in milliseconds
      );
    } else {
      console.error('Error: #contents element not found.');
    }
  });

  // RB Photo Viewer with Lazy Loading
  class RBPhotoViewer {
      constructor() {
          this.modal = document.getElementById('rb-photo-modal');
          this.image = document.getElementById('rb-photo-image');
          this.title = document.getElementById('rb-photo-title');
          this.description = document.getElementById('rb-photo-desc');
          this.category = document.getElementById('rb-photo-category');
          this.categoryContainer = document.getElementById('rb-photo-category-container');
          this.date = document.getElementById('rb-photo-created');
          this.dateContainer = document.getElementById('rb-photo-date-container');
          this.resources = document.getElementById('rb-photo-resources');
          this.closeBtn = document.getElementById('rb-close-btn');
          this.prevBtn = document.getElementById('rb-prev-btn');
          this.nextBtn = document.getElementById('rb-next-btn');
          
          this.allGalleryItems = [];
          this.currentGalleryItems = [];
          this.currentIndex = 0;
          this.currentGallery = '';
          
          this.init();
      }
      
      init() {
          // Initialize lazy loading
          this.initLazyLoading();
          
          // Collect all gallery items
          this.allGalleryItems = Array.from(document.querySelectorAll('.rb-gallery-item'));
          
          // Add click listeners to gallery items
          this.allGalleryItems.forEach((item, index) => {
              item.addEventListener('click', (e) => {
                  e.preventDefault();
                  const gallery = item.dataset.gallery;
                  this.openModal(item, gallery);
              });
          });
          
          // Add modal controls
          this.closeBtn.addEventListener('click', () => this.closeModal());
          this.prevBtn.addEventListener('click', () => this.showPrevious());
          this.nextBtn.addEventListener('click', () => this.showNext());
          
          // Close on background click
          this.modal.addEventListener('click', (e) => {
              if (e.target === this.modal) {
                  this.closeModal();
              }
          });
          
          // Keyboard navigation
          document.addEventListener('keydown', (e) => {
              if (this.modal.classList.contains('active')) {
                  switch(e.key) {
                      case 'Escape':
                          this.closeModal();
                          break;
                      case 'ArrowLeft':
                          this.showPrevious();
                          break;
                      case 'ArrowRight':
                          this.showNext();
                          break;
                  }
              }
          });
      }
      
      initLazyLoading() {
          const lazyImages = document.querySelectorAll('.rb-lazy-image');
          
          if ('IntersectionObserver' in window) {
              const imageObserver = new IntersectionObserver((entries, observer) => {
                  entries.forEach(entry => {
                      if (entry.isIntersecting) {
                          const img = entry.target;
                          img.src = img.dataset.src;
                          img.classList.remove('rb-lazy-image');
                          imageObserver.unobserve(img);
                      }
                  });
              });
              
              lazyImages.forEach(img => imageObserver.observe(img));
          } else {
              // Fallback for browsers without IntersectionObserver
              lazyImages.forEach(img => {
                  img.src = img.dataset.src;
                  img.classList.remove('rb-lazy-image');
              });
          }
      }
      
      openModal(clickedItem, gallery) {
          // Filter items by gallery
          this.currentGallery = gallery;
          this.currentGalleryItems = this.allGalleryItems.filter(item => 
              item.dataset.gallery === gallery
          );
          
          // Find the index of clicked item in the filtered gallery
          this.currentIndex = this.currentGalleryItems.findIndex(item => item === clickedItem);
          
          this.updateContent();
          this.modal.classList.add('active');
          document.body.style.overflow = 'hidden';
      }
      
      closeModal() {
          this.modal.classList.remove('active');
          document.body.style.overflow = '';
      }
      
      showPrevious() {
          this.currentIndex = (this.currentIndex - 1 + this.currentGalleryItems.length) % this.currentGalleryItems.length;
          this.updateContent();
      }
      
      showNext() {
          this.currentIndex = (this.currentIndex + 1) % this.currentGalleryItems.length;
          this.updateContent();
      }
      
      updateContent() {
          const item = this.currentGalleryItems[this.currentIndex];
          const data = item.dataset;
          
          // Show loading state
          this.image.classList.add('loading');
          this.image.src = '';
          
          // Load the full-size image
          const fullImage = new Image();
          fullImage.onload = () => {
              this.image.src = data.src;
              this.image.alt = data.title;
              this.image.classList.remove('loading');
          };
          fullImage.src = data.src;
          
          // Handle title (always show if present)
          if (data.title) {
              this.title.textContent = data.title;
              this.title.style.display = 'block';
          } else {
              this.title.style.display = 'none';
          }
          
          // Handle description (always show if present)
          if (data.description) {
              this.description.textContent = data.description;
              this.description.style.display = 'block';
          } else {
              this.description.style.display = 'none';
          }
          
          // Handle category
          if (data.category) {
              this.category.textContent = data.category;
              this.categoryContainer.style.display = 'block';
          } else {
              this.categoryContainer.style.display = 'none';
          }
          
          // Handle date
          if (data.date) {
              this.date.textContent = data.date;
              this.dateContainer.style.display = 'block';
          } else {
              this.dateContainer.style.display = 'none';
          }
          
          // Handle resources - can be raw HTML
          if (data.resources) {
              this.resources.innerHTML = data.resources;
              this.resources.style.display = 'block';
          } else {
              this.resources.innerHTML = '';
              this.resources.style.display = 'none';
          }
          
          // Update navigation buttons
          this.prevBtn.disabled = this.currentGalleryItems.length <= 1;
          this.nextBtn.disabled = this.currentGalleryItems.length <= 1;
          
          // Update navigation button visibility
          this.prevBtn.style.display = this.currentGalleryItems.length > 1 ? 'flex' : 'none';
          this.nextBtn.style.display = this.currentGalleryItems.length > 1 ? 'flex' : 'none';
      }
  }
  
  // Initialize the photo viewer when DOM is loaded
  if (document.querySelectorAll('.rb-gallery-item').length > 0) {
      new RBPhotoViewer();
  }

});
