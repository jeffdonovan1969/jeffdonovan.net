// Portfolio Detail Page - Dynamic Script using AJAX
// IMPORTANT: If your site is in a subdirectory, update this:
// const API_BASE = '/newSite';  // ← Change 'newSite' to your folder name
const API_BASE = '';

// Mobile menu toggle function
function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

// Load portfolio details based on URL parameter
const urlParams = new URLSearchParams(window.location.search);
// The 'portfolio' parameter now contains the gallery_id (not a slug)
const galleryId = urlParams.get('portfolio') || urlParams.get('id') || urlParams.get('gallery_id');
let currentImageIndex = 0;
let currentPortfolio = null;

if (galleryId) {
  loadPortfolioDetails(galleryId);
} else {
  showError('No portfolio specified');
}

async function loadPortfolioDetails(galleryId) {
  try {
    // Use gallery_id parameter
    const response = await fetch(API_BASE + `/api-portfolios.php?id=${galleryId}`);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
      throw new Error('API not available');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    currentPortfolio = data.portfolio;
    displayPortfolio(currentPortfolio);
  } catch (error) {
    console.log('API not available, checking for portfolio-data.js fallback:', error.message);
    // Try to load from portfolio-data.js if it exists
    loadFromStaticData(galleryId);
  }
}

function loadFromStaticData(galleryId) {
  // Map gallery IDs to slugs in portfolio-data.js
  const idToSlugMap = {
    '3': 'peru',
    '2': 'tibet', 
    '4': 'rapa-nui',
    '15': 'japan',
    '37': 'vessels',
    '30': 'philadelphia'
  };
  
  const slug = idToSlugMap[String(galleryId)];
  
  // Check if portfolioData exists (from portfolio-data.js)
  if (typeof portfolioData !== 'undefined' && slug && portfolioData[slug]) {
    console.log('Loading from static portfolio-data.js');
    currentPortfolio = portfolioData[slug];
    displayPortfolio(currentPortfolio);
  } else {
    showError('Portfolio not found. The API is not configured and portfolio-data.js is not available.');
  }
}

function displayPortfolio(portfolio) {
  // Set page title
  document.title = `${portfolio.title} - Jeff Donovan Photography`;
  
  // Set portfolio title and short description
  document.getElementById('portfolio-title').textContent = portfolio.title;
  document.getElementById('portfolio-description').textContent = portfolio.description || '';

  // Populate full description — handles both API (full_description) and
  // static data (fullDescription) field names
  const fullDesc = portfolio.full_description || portfolio.fullDescription || '';
  const readMoreContainer = document.getElementById('read-more-container');
  if (fullDesc && readMoreContainer) {
    document.getElementById('full-description-text').innerHTML = fullDesc;
    readMoreContainer.style.display = 'block';
  } else if (readMoreContainer) {
    readMoreContainer.style.display = 'none';
  }
  
  // Load images
  const grid = document.getElementById('portfolio-grid');
  grid.innerHTML = '';
  
  if (!portfolio.images || portfolio.images.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #a3a3a3; padding: 3rem;">No images in this portfolio yet.</p>';
    return;
  }
  
  portfolio.images.forEach((image, index) => {
    const card = document.createElement('div');
    card.className = 'portfolio-card';
    card.onclick = () => openModal(image, index);
    
    const img = document.createElement('img');
    img.src = image.medium_file;
    img.alt = image.name || `${portfolio.title} ${index + 1}`;
    img.loading = 'lazy';
    
    const overlay = document.createElement('div');
    overlay.className = 'portfolio-card-overlay';
    
    if (image.name) {
      const title = document.createElement('h4');
      title.className = 'card-title';
      title.textContent = image.name;
      overlay.appendChild(title);
    }
    
    if (image.teaser) {
      const teaser = document.createElement('p');
      teaser.className = 'card-teaser';
      teaser.textContent = image.teaser;
      overlay.appendChild(teaser);
    }
    
    card.appendChild(img);
    card.appendChild(overlay);
    grid.appendChild(card);
  });
}

function showError(message) {
  document.getElementById('portfolio-title').textContent = 'Error Loading Portfolio';
  const descElement = document.getElementById('portfolio-description');
  descElement.innerHTML = `
    <p style="color: #ef4444; margin-bottom: 1rem;">${message}</p>
    <div style="background: #1e293b; padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid #ef4444; margin-top: 1rem;">
      <h3 style="color: #FFFACD; margin-bottom: 0.5rem;">Quick Fix Options:</h3>
      <ol style="color: #d4d4d4; line-height: 1.8; padding-left: 1.5rem;">
        <li><strong>Include portfolio-data.js:</strong> Add this line before the closing &lt;/body&gt; tag:
          <br><code style="background: #0f172a; padding: 0.25rem 0.5rem; border-radius: 0.25rem; display: inline-block; margin-top: 0.5rem;">&lt;script src="portfolio-data.js"&gt;&lt;/script&gt;</code>
        </li>
        <li style="margin-top: 0.75rem;"><strong>Or configure the API:</strong> Make sure config.php has correct database credentials and api-portfolios.php is uploaded.</li>
        <li style="margin-top: 0.75rem;"><strong>Or update links:</strong> Change portfolio URLs from ?portfolio=peru to ?id=3 (see gallery ID mapping)</li>
      </ol>
      <p style="margin-top: 1rem;"><a href="index.html" style="color: #60a5fa;">← Back to Home</a></p>
    </div>
  `;
  document.getElementById('portfolio-grid').innerHTML = '';
}

// Modal functions
function openModal(image, index) {
  currentImageIndex = index;
  updateModalContent();
  const modal = document.getElementById('image-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Initialize swipe functionality
  initializeSwipe();
}

function updateModalContent() {
  if (!currentPortfolio || !currentPortfolio.images[currentImageIndex]) return;
  
  const image = currentPortfolio.images[currentImageIndex];
  document.getElementById('modal-image').src = image.large_file || image.xlarge_file;
  document.getElementById('modal-title').textContent = image.name || '';
  
  // Combine location and date
  let locationDate = '';
  if (image.location) locationDate += image.location;
  if (image.location && image.date) locationDate += ', ';
  if (image.date) locationDate += image.date;
  
  document.getElementById('modal-teaser').textContent = locationDate;
  document.getElementById('modal-detail').textContent = image.text || '';
}

function navigateImage(direction) {
  if (!currentPortfolio) return;

  currentImageIndex += direction;

  // Wrap around
  if (currentImageIndex < 0) {
    currentImageIndex = currentPortfolio.images.length - 1;
  } else if (currentImageIndex >= currentPortfolio.images.length) {
    currentImageIndex = 0;
  }

  updateModalContent();

  // Animate the entire scene (frame + label) like walking past paintings in a gallery
  const scene = document.querySelector('.modal-content');
  if (scene) {
    scene.classList.remove('walk-in-right', 'walk-in-left');
    void scene.offsetWidth; // force reflow so animation retriggers
    scene.classList.add(direction > 0 ? 'walk-in-right' : 'walk-in-left');
  }
}

function closeModal() {
  const modal = document.getElementById('image-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  
  // Remove swipe listeners
  removeSwipeListeners();
}

// Touch/Swipe functionality for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}

function handleSwipe() {
  const swipeThreshold = 50;
  const swipeXDistance = touchEndX - touchStartX;
  const swipeYDistance = touchEndY - touchStartY;
  const absSwipeXDistance = Math.abs(swipeXDistance);
  const absSwipeYDistance = Math.abs(swipeYDistance);
  
  // Vertical swipe for navigation
  if (absSwipeYDistance > swipeThreshold && absSwipeYDistance > absSwipeXDistance) {
    if (swipeYDistance < 0) {
      navigateImage(1); // Swipe up = next
    } else if (swipeYDistance > 0) {
      navigateImage(-1); // Swipe down = previous
    }
  }
  // Horizontal swipe for closing
  else if (absSwipeXDistance > swipeThreshold && absSwipeXDistance > absSwipeYDistance) {
    closeModal();
  }
}

function initializeSwipe() {
  const modal = document.getElementById('image-modal');
  modal.addEventListener('touchstart', handleTouchStart, { passive: true });
  modal.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function removeSwipeListeners() {
  const modal = document.getElementById('image-modal');
  modal.removeEventListener('touchstart', handleTouchStart);
  modal.removeEventListener('touchend', handleTouchEnd);
}

// Close modal on ESC key, arrow keys for navigation
document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('image-modal');
  if (modal.style.display !== 'flex') return;
  
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'ArrowLeft') {
    navigateImage(-1);
  } else if (e.key === 'ArrowRight') {
    navigateImage(1);
  }
});

// Read More toggle function
function toggleReadMore() {
  const content = document.getElementById('read-more-content');
  const btn = document.getElementById('read-more-btn');
  
  if (!content || !btn) {
    console.error('Read more elements not found');
    return;
  }
  
  const isOpen = content.classList.contains('open');
  
  console.log('Toggle clicked, isOpen:', isOpen);

  if (isOpen) {
    // Closing - scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    content.classList.remove('open');
    btn.classList.remove('open');
    btn.textContent = '→ Read More';
  } else {
    // Opening
    content.classList.add('open');
    btn.classList.add('open');
    btn.textContent = '↓ Description';
  }
}

// Make toggleReadMore globally accessible
window.toggleReadMore = toggleReadMore;
