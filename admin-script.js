// Admin Script for Portfolio Management
// IMPORTANT: Configure your API path
// 
// OPTION 1: APIs in same directory as admin.html (DEFAULT)
const API_BASE = '';
//
// OPTION 2: If your site is in a subdirectory like /newSite
// Uncomment and update this:
// const API_BASE = '/newSite';
//
// OPTION 3: Auto-detect (works most of the time)
// Uncomment this:
// const API_BASE = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));

let currentView = 'portfolios';
let currentPage = 1;
let currentGalleryId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  setupNavigation();
  setupCreateButton();
  setupModals();
  loadPortfolios();
});

// Navigation
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      if (this.getAttribute('target') === '_blank') return;
      
      e.preventDefault();
      const view = this.getAttribute('data-view');
      if (!view) return;
      
      // Update active state
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      
      // Switch view
      switchView(view);
    });
  });
}

function switchView(view) {
  currentView = view;
  
  // Hide all views
  document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
  
  // Show selected view
  const viewElement = document.getElementById(`${view}-view`);
  if (viewElement) {
    viewElement.classList.add('active');
  }
  
  // Update header
  if (view === 'portfolios') {
    document.getElementById('view-title').textContent = 'Portfolios';
    document.getElementById('view-subtitle').textContent = 'Manage your photography portfolios';
    document.getElementById('create-btn').textContent = 'Create Portfolio';
    loadPortfolios();
  } else if (view === 'images') {
    document.getElementById('view-title').textContent = 'Images';
    document.getElementById('view-subtitle').textContent = 'Manage your photography images';
    document.getElementById('create-btn').textContent = 'Create Image';
    loadImages(true); // Reset on view switch
    loadGalleryFilter();
    setupMainImageSearch();
    setupInfiniteScrollForImages();
  }
}

// Create Button
function setupCreateButton() {
  document.getElementById('create-btn').addEventListener('click', function() {
    if (currentView === 'portfolios') {
      openPortfolioModal();
    } else if (currentView === 'images') {
      openImageModal();
    }
  });
}

// API Calls
async function apiCall(endpoint, options = {}) {
  showLoading();
  try {
    const response = await fetch(API_BASE + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    alert('Error: ' + error.message);
    throw error;
  } finally {
    hideLoading();
  }
}

// Loading Overlay
function showLoading() {
  document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.remove('active');
}

// Portfolios
async function loadPortfolios() {
  try {
    const data = await apiCall('/api-portfolios.php');
    displayPortfolios(data.portfolios);
  } catch (error) {
    console.error('Failed to load portfolios:', error);
  }
}

function displayPortfolios(portfolios) {
  const grid = document.getElementById('portfolios-grid');
  
  if (portfolios.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 3rem;">No portfolios found. Create your first one!</p>';
    return;
  }
  
  grid.innerHTML = portfolios.map(portfolio => `
    <div class="portfolio-card">
      <div class="portfolio-card-image" style="background-image: url('${portfolio.cover_image || portfolio.preview_images[0] || ''}')"></div>
      <div class="portfolio-card-content">
        <h3 class="portfolio-card-title">${escapeHtml(portfolio.title)}</h3>
        <p class="portfolio-card-description">${escapeHtml(portfolio.description || '')}</p>
        <div class="portfolio-card-meta">
          <span>${portfolio.image_count} images</span>
          <span>Order: ${portfolio.order_id}</span>
        </div>
        <div class="portfolio-card-actions">
          <button class="btn btn-small btn-primary" onclick="manageGalleryImages(${portfolio.gallery_id}, '${escapeHtml(portfolio.title)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Images
          </button>
          <button class="btn btn-small btn-secondary" onclick="editPortfolio(${portfolio.gallery_id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button class="btn btn-small btn-danger" onclick="deletePortfolio(${portfolio.gallery_id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function editPortfolio(galleryId) {
  try {
    const data = await apiCall(`/api-portfolios.php?id=${galleryId}`);
    const portfolio = data.portfolio;
    
    document.getElementById('modal-title').textContent = 'Edit Portfolio';
    document.getElementById('portfolio-id').value = portfolio.gallery_id;
    document.getElementById('portfolio-title').value = portfolio.title;
    document.getElementById('portfolio-cover').value = portfolio.cover_image || '';
    document.getElementById('portfolio-description').value = portfolio.description || '';
    document.getElementById('portfolio-full-description').value = portfolio.full_description || '';
    document.getElementById('portfolio-order').value = portfolio.order_id;
    
    document.getElementById('portfolio-modal').classList.add('active');
  } catch (error) {
    console.error('Failed to load portfolio:', error);
  }
}

async function deletePortfolio(galleryId) {
  if (!confirm('Are you sure you want to delete this portfolio? This will not delete the images.')) {
    return;
  }
  
  try {
    await apiCall(`/api-portfolios.php?id=${galleryId}`, { method: 'DELETE' });
    loadPortfolios();
  } catch (error) {
    console.error('Failed to delete portfolio:', error);
  }
}

// Portfolio Modal
function setupModals() {
  // Portfolio form submission
  document.getElementById('portfolio-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const portfolioId = document.getElementById('portfolio-id').value;
    const formData = {
      title: document.getElementById('portfolio-title').value,
      cover_image: document.getElementById('portfolio-cover').value,
      description: document.getElementById('portfolio-description').value,
      full_description: document.getElementById('portfolio-full-description').value,
      order_id: parseInt(document.getElementById('portfolio-order').value)
    };
    
    try {
      if (portfolioId) {
        // Update existing - use gallery_id directly
        await apiCall(`/api-portfolios.php?id=${portfolioId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Create new
        await apiCall('/api-portfolios.php', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      closePortfolioModal();
      loadPortfolios();
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    }
  });
  
  // Image form submission
  document.getElementById('image-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const imageId = document.getElementById('image-id').value;
    const formData = {
      name: document.getElementById('image-name').value,
      location: document.getElementById('image-location').value,
      date: document.getElementById('image-date').value,
      xlarge_file: document.getElementById('image-xlarge').value,
      large_file: document.getElementById('image-large').value,
      medium_file: document.getElementById('image-medium').value,
      small_file: document.getElementById('image-small').value,
      teaser: document.getElementById('image-teaser').value,
      text: document.getElementById('image-text').value
    };
    
    try {
      if (imageId) {
        await apiCall(`/api-images.php?id=${imageId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiCall('/api-images.php', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      closeImageModal();
      loadImages();
    } catch (error) {
      console.error('Failed to save image:', error);
    }
  });
}

function openPortfolioModal() {
  document.getElementById('modal-title').textContent = 'Create Portfolio';
  document.getElementById('portfolio-form').reset();
  document.getElementById('portfolio-id').value = '';
  document.getElementById('portfolio-modal').classList.add('active');
}

function closePortfolioModal() {
  document.getElementById('portfolio-modal').classList.remove('active');
}

function openImageModal(imageId = null) {
  if (imageId) {
    loadImageForEdit(imageId);
  } else {
    document.getElementById('image-modal-title').textContent = 'Create Image';
    document.getElementById('image-form').reset();
    document.getElementById('image-id').value = '';
    
    // Clear preview
    document.getElementById('preview-img').style.display = 'none';
    document.getElementById('preview-placeholder').textContent = 'No image to preview';
    document.getElementById('preview-placeholder').style.display = 'block';
  }
  document.getElementById('image-modal').classList.add('active');
}

function closeImageModal() {
  document.getElementById('image-modal').classList.remove('active');
}

async function loadImageForEdit(imageId) {
  try {
    const data = await apiCall(`/api-images.php?id=${imageId}`);
    const image = data.image;
    
    document.getElementById('image-modal-title').textContent = 'Edit Image';
    document.getElementById('image-id').value = image.id;
    document.getElementById('image-name').value = image.name || '';
    document.getElementById('image-location').value = image.location || '';
    document.getElementById('image-date').value = image.date || '';
    document.getElementById('image-xlarge').value = image.xlarge_file || '';
    document.getElementById('image-large').value = image.large_file || '';
    document.getElementById('image-medium').value = image.medium_file || '';
    document.getElementById('image-small').value = image.small_file || '';
    document.getElementById('image-teaser').value = image.teaser || '';
    document.getElementById('image-text').value = image.text || '';
    
    // Show image preview
    updateImagePreview(image.medium_file || image.small_file);
    
    document.getElementById('image-modal').classList.add('active');
  } catch (error) {
    console.error('Failed to load image:', error);
  }
}

function updateImagePreview(imageUrl) {
  // Get image URL from parameter or from medium file input
  const url = imageUrl || document.getElementById('image-medium').value;
  const previewImg = document.getElementById('preview-img');
  const placeholder = document.getElementById('preview-placeholder');
  
  if (url) {
    previewImg.src = url;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    
    // Handle image load error
    previewImg.onerror = function() {
      previewImg.style.display = 'none';
      placeholder.textContent = 'Image not found at: ' + url;
      placeholder.style.display = 'block';
    };
  } else {
    previewImg.style.display = 'none';
    placeholder.textContent = 'No image to preview';
    placeholder.style.display = 'block';
  }
}

// Utility function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Images - Infinite Scroll Variables
let imagesPage = 1;
let imagesLoading = false;
let imagesHasMore = true;
let imagesSearchTerm = '';
let imagesFilterGallery = '';

// Images
async function loadImages(reset = false) {
  if (imagesLoading || (!imagesHasMore && !reset)) return;
  
  if (reset) {
    imagesPage = 1;
    imagesHasMore = true;
    document.getElementById('images-grid').innerHTML = '';
  }
  
  imagesLoading = true;
  showInfiniteScrollLoading();
  
  try {
    // Build URL with filters
    let url = `/api-images.php?page=${imagesPage}&limit=24`;
    
    if (imagesSearchTerm) {
      url = `/api-images.php?search=${encodeURIComponent(imagesSearchTerm)}`;
    } else if (imagesFilterGallery) {
      url = `/api-images.php?gallery_id=${imagesFilterGallery}&page=${imagesPage}&limit=24`;
    }
    
    const data = await apiCall(url);
    displayImages(data.images, !reset);
    
    // Check if there are more pages
    if (imagesSearchTerm) {
      // Search returns all results at once
      imagesHasMore = false;
    } else if (data.page >= data.total_pages) {
      imagesHasMore = false;
      showInfiniteScrollEnd();
    } else {
      imagesPage++;
    }
    
  } catch (error) {
    console.error('Failed to load images:', error);
  } finally {
    imagesLoading = false;
    hideInfiniteScrollLoading();
  }
}

function displayImages(images, append = false) {
  const grid = document.getElementById('images-grid');
  
  if (images.length === 0 && !append) {
    grid.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 3rem;">No images found.</p>';
    return;
  }
  
  const html = images.map(image => `
    <div class="image-card" onclick="openImageModal(${image.id})">
      <div class="image-card-thumb" style="background-image: url('${image.medium_file || image.small_file}')"></div>
      <div class="image-card-info">
        <div class="image-card-name">${escapeHtml(image.name || 'Untitled')}</div>
        <div class="image-card-location">${escapeHtml(image.location || '')}</div>
      </div>
    </div>
  `).join('');
  
  if (append) {
    grid.innerHTML += html;
  } else {
    grid.innerHTML = html;
  }
}

// Remove old pagination function
function displayPagination(data) {
  // Deprecated - using infinite scroll now
}

async function loadGalleryFilter() {
  try {
    const data = await apiCall('/api-portfolios.php');
    const select = document.getElementById('gallery-filter');
    
    select.innerHTML = '<option value="">All Galleries</option>' + 
      data.portfolios.map(p => `<option value="${p.gallery_id}">${escapeHtml(p.title)}</option>`).join('');
    
    select.addEventListener('change', async function() {
      // Clear search when filtering by gallery
      const searchInput = document.getElementById('image-search');
      if (searchInput) {
        searchInput.value = '';
        imagesSearchTerm = '';
      }
      
      // Update filter and reload
      imagesFilterGallery = this.value;
      await loadImages(true);
    });
  } catch (error) {
    console.error('Failed to load gallery filter:', error);
  }
}

async function loadImagesByGallery(galleryId) {
  // Deprecated - now handled by loadImages() with imagesFilterGallery
  imagesFilterGallery = galleryId;
  await loadImages(true);
}

// Setup search for main images view
// Setup search for main images view
function setupMainImageSearch() {
  const searchInput = document.getElementById('image-search');
  if (!searchInput) {
    console.error('Image search input not found');
    return;
  }
  
  // Remove existing event listener by setting a flag
  if (searchInput._searchListenerAdded) {
    return; // Already set up
  }
  
  let searchTimeout;
  const galleryFilter = document.getElementById('gallery-filter');
  
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const searchTerm = this.value.trim();
      
      if (searchTerm.length > 2) {
        // Clear gallery filter when searching
        if (galleryFilter) {
          galleryFilter.value = '';
          imagesFilterGallery = '';
        }
        
        // Update search state
        imagesSearchTerm = searchTerm;
        
        // Reset and load with search
        await loadImages(true);
        
        // Update result count
        const grid = document.getElementById('images-grid');
        const imageCards = grid.querySelectorAll('.image-card');
        
        if (imageCards.length === 0) {
          grid.innerHTML = 
            '<p style="color: var(--text-muted); text-align: center; padding: 3rem;">No images found matching "' + 
            escapeHtml(searchTerm) + '"</p>';
        } else {
          // Show search result count at top
          const existingCount = document.querySelector('.search-result-count');
          if (existingCount) existingCount.remove();
          
          const countMsg = document.createElement('p');
          countMsg.className = 'search-result-count';
          countMsg.style.cssText = 'color: var(--text-muted); text-align: center; padding: 1rem; margin-bottom: 1rem; background: var(--bg-darker); border-radius: 0.375rem;';
          countMsg.textContent = `Found ${imageCards.length} image${imageCards.length !== 1 ? 's' : ''} matching "${searchTerm}"`;
          grid.insertBefore(countMsg, grid.firstChild);
        }
      } else if (searchTerm.length === 0) {
        // Clear search - reload normal view
        const existingCount = document.querySelector('.search-result-count');
        if (existingCount) existingCount.remove();
        
        imagesSearchTerm = '';
        await loadImages(true);
      }
    }, 300); // 300ms debounce
  });
  
  // Mark as set up
  searchInput._searchListenerAdded = true;
}

// Gallery Images Management
// Gallery Images Management
let availableImagesPage = 1;
let availableImagesLoading = false;
let availableImagesHasMore = true;
let availableImagesSearchTerm = '';

async function manageGalleryImages(galleryId, title) {
  currentGalleryId = galleryId;
  
  document.getElementById('gallery-images-title').textContent = `Manage Images: ${title}`;
  document.getElementById('gallery-images-modal').classList.add('active');
  
  // Reset pagination state
  availableImagesPage = 1;
  availableImagesHasMore = true;
  availableImagesSearchTerm = '';
  document.getElementById('available-images-list').innerHTML = '';
  
  await loadGalleryImages(galleryId);
  await loadAvailableImages();
  
  setupImageSearch();
  setupInfiniteScroll();
}

async function loadGalleryImages(galleryId) {
  try {
    const data = await apiCall(`/api-images.php?gallery_id=${galleryId}`);
    displayGalleryImages(data.images);
  } catch (error) {
    console.error('Failed to load gallery images:', error);
  }
}

function displayGalleryImages(images) {
  const list = document.getElementById('gallery-images-list');
  
  if (images.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No images in this portfolio. Add some from the left!</p>';
    return;
  }
  
  list.innerHTML = images.map(image => `
    <div class="image-list-item" draggable="true" data-image-id="${image.id}">
      <div class="image-list-thumb" style="background-image: url('${image.medium_file}')"></div>
      <div class="image-list-info">
        <div class="image-list-name">${escapeHtml(image.name || 'Untitled')}</div>
        <div class="image-list-location">${escapeHtml(image.location || '')}</div>
      </div>
      <div class="image-list-actions">
        <button class="btn btn-small btn-danger" onclick="removeImageFromGallery(${currentGalleryId}, ${image.id})">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  setupDragAndDrop();
}

async function loadAvailableImages(append = false) {
  if (availableImagesLoading || !availableImagesHasMore) return;
  
  availableImagesLoading = true;
  const loadingIndicator = document.getElementById('available-images-loading');
  const endIndicator = document.getElementById('available-images-end');
  
  loadingIndicator.style.display = 'block';
  endIndicator.style.display = 'none';
  
  try {
    let url = `/api-images.php?page=${availableImagesPage}&limit=20`;
    if (availableImagesSearchTerm) {
      url = `/api-images.php?search=${encodeURIComponent(availableImagesSearchTerm)}`;
    }
    
    const data = await apiCall(url);
    
    if (data.images && data.images.length > 0) {
      displayAvailableImages(data.images, append);
      
      // Check if there are more pages
      if (availableImagesSearchTerm) {
        // Search doesn't have pagination, so no more pages
        availableImagesHasMore = false;
        endIndicator.style.display = 'block';
      } else if (data.page >= data.total_pages) {
        availableImagesHasMore = false;
        endIndicator.style.display = 'block';
      } else {
        availableImagesPage++;
      }
    } else {
      availableImagesHasMore = false;
      if (availableImagesPage === 1 && !append) {
        document.getElementById('available-images-list').innerHTML = 
          '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No images found</p>';
      }
      endIndicator.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to load available images:', error);
  } finally {
    availableImagesLoading = false;
    loadingIndicator.style.display = 'none';
  }
}

function displayAvailableImages(images, append = false) {
  const list = document.getElementById('available-images-list');
  
  const html = images.map(image => `
    <div class="image-list-item" onclick="addImageToGallery(${currentGalleryId}, ${image.id})">
      <div class="image-list-thumb" style="background-image: url('${image.medium_file}')"></div>
      <div class="image-list-info">
        <div class="image-list-name">${escapeHtml(image.name || 'Untitled')}</div>
        <div class="image-list-location">${escapeHtml(image.location || '')}</div>
      </div>
      <div class="image-list-actions">
        <button class="btn btn-small btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
  
  if (append) {
    list.innerHTML += html;
  } else {
    list.innerHTML = html;
  }
}

function setupInfiniteScroll() {
  const imagesList = document.getElementById('available-images-list');
  
  // Remove existing scroll listener if any
  imagesList.removeEventListener('scroll', handleAvailableImagesScroll);
  
  // Add new scroll listener
  imagesList.addEventListener('scroll', handleAvailableImagesScroll);
}

function handleAvailableImagesScroll(e) {
  const container = e.target;
  const scrollPosition = container.scrollTop + container.clientHeight;
  const scrollHeight = container.scrollHeight;
  
  // Load more when user is 200px from bottom
  if (scrollHeight - scrollPosition < 200) {
    loadAvailableImages(true);
  }
}

async function addImageToGallery(galleryId, imageId) {
  try {
    await apiCall('/api-images.php?action=add_to_gallery', {
      method: 'POST',
      body: JSON.stringify({ gallery_id: galleryId, image_id: imageId })
    });
    await loadGalleryImages(galleryId);
  } catch (error) {
    console.error('Failed to add image to gallery:', error);
  }
}

async function removeImageFromGallery(galleryId, imageId) {
  if (!confirm('Remove this image from the portfolio?')) return;
  
  try {
    await apiCall('/api-images.php?action=remove_from_gallery', {
      method: 'DELETE',
      body: JSON.stringify({ gallery_id: galleryId, image_id: imageId })
    });
    await loadGalleryImages(galleryId);
  } catch (error) {
    console.error('Failed to remove image from gallery:', error);
  }
}

function closeGalleryImagesModal() {
  document.getElementById('gallery-images-modal').classList.remove('active');
  currentGalleryId = null;
}

function setupImageSearch() {
  const searchInput = document.getElementById('available-images-search');
  let searchTimeout;
  
  searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      availableImagesSearchTerm = this.value;
      
      if (this.value.length > 2) {
        // Searching - reset state and search
        availableImagesPage = 1;
        availableImagesHasMore = false; // Search shows all results at once
        document.getElementById('available-images-list').innerHTML = '';
        
        try {
          const data = await apiCall(`/api-images.php?search=${encodeURIComponent(this.value)}`);
          displayAvailableImages(data.images, false);
          
          if (data.images.length === 0) {
            document.getElementById('available-images-list').innerHTML = 
              '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No images found</p>';
          }
          
          document.getElementById('available-images-end').style.display = 'block';
        } catch (error) {
          console.error('Search failed:', error);
        }
      } else if (this.value.length === 0) {
        // Clear search - reset and reload
        availableImagesPage = 1;
        availableImagesHasMore = true;
        document.getElementById('available-images-list').innerHTML = '';
        await loadAvailableImages(false);
      }
    }, 300);
  });
}

// Drag and Drop for reordering
function setupDragAndDrop() {
  const list = document.getElementById('gallery-images-list');
  const items = list.querySelectorAll('.image-list-item');
  
  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement !== this) {
    const list = document.getElementById('gallery-images-list');
    const allItems = [...list.querySelectorAll('.image-list-item')];
    const draggedIndex = allItems.indexOf(draggedElement);
    const targetIndex = allItems.indexOf(this);
    
    if (draggedIndex < targetIndex) {
      this.parentNode.insertBefore(draggedElement, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedElement, this);
    }
    
    // TODO: Save new order to database
    saveImageOrder();
  }
  
  return false;
}

async function saveImageOrder() {
  if (!currentGalleryId) return;
  
  const list = document.getElementById('gallery-images-list');
  const items = list.querySelectorAll('.image-list-item');
  
  // Build array of image IDs in current order
  const imageOrder = Array.from(items).map(item => {
    return parseInt(item.getAttribute('data-image-id'));
  });
  
  try {
    await apiCall('/api-update-order.php', {
      method: 'POST',
      body: JSON.stringify({
        gallery_id: currentGalleryId,
        image_order: imageOrder
      })
    });
    
    console.log('Image order saved successfully');
  } catch (error) {
    console.error('Failed to save image order:', error);
    alert('Failed to save image order. Please try again.');
  }
}

// Infinite Scroll for Images View
function setupInfiniteScrollForImages() {
  const contentArea = document.querySelector('.content-area');
  
  // Remove existing listener if any
  if (contentArea._infiniteScrollSetup) {
    return;
  }
  
  contentArea.addEventListener('scroll', handleImagesScroll);
  contentArea._infiniteScrollSetup = true;
}

function handleImagesScroll() {
  // Only trigger on images view
  if (currentView !== 'images') return;
  
  const contentArea = document.querySelector('.content-area');
  const scrollPosition = contentArea.scrollTop + contentArea.clientHeight;
  const scrollHeight = contentArea.scrollHeight;
  
  // Load more when user is 300px from bottom
  if (scrollHeight - scrollPosition < 300) {
    loadImages(false); // false = append, don't reset
  }
}

function showInfiniteScrollLoading() {
  // Remove any existing indicators
  hideInfiniteScrollLoading();
  hideInfiniteScrollEnd();
  
  const grid = document.getElementById('images-grid');
  const loader = document.createElement('div');
  loader.id = 'infinite-scroll-loading';
  loader.className = 'infinite-scroll-loading';
  loader.innerHTML = `
    <div class="spinner"></div>
    <p>Loading more images...</p>
  `;
  grid.parentElement.appendChild(loader);
}

function hideInfiniteScrollLoading() {
  const loader = document.getElementById('infinite-scroll-loading');
  if (loader) {
    loader.remove();
  }
}

function showInfiniteScrollEnd() {
  // Remove any existing indicators
  hideInfiniteScrollLoading();
  
  const existing = document.getElementById('infinite-scroll-end');
  if (existing) return; // Already shown
  
  const grid = document.getElementById('images-grid');
  const endMsg = document.createElement('div');
  endMsg.id = 'infinite-scroll-end';
  endMsg.className = 'infinite-scroll-end';
  endMsg.innerHTML = `<p>• End of images •</p>`;
  grid.parentElement.appendChild(endMsg);
}

function hideInfiniteScrollEnd() {
  const endMsg = document.getElementById('infinite-scroll-end');
  if (endMsg) {
    endMsg.remove();
  }
}
