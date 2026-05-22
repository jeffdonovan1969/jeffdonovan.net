<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}
$_SESSION['login_time'] = time();
$username = $_SESSION['username'] ?? 'Admin';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio Admin - Jeff Donovan Photography</title>
  <link rel="stylesheet" href="admin-styles.css">
</head>
<body>
  <div class="admin-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
        <h1>Portfolio Admin</h1>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active" data-view="portfolios">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Portfolios
        </a>
        <a href="#" class="nav-item" data-view="images">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Images
        </a>
        <a href="index.html" class="nav-item" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          View Site
        </a>
      </nav>
      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; border-top: 1px solid var(--border);">
        <a href="logout.php" class="btn btn-secondary btn-small" style="width: 100%; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
          Logout
        </a>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="content-header">
        <div>
          <h2 id="view-title">Portfolios</h2>
          <p id="view-subtitle">Manage your photography portfolios</p>
        </div>
        <button class="btn btn-primary" id="create-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New
        </button>
      </header>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Portfolios View -->
        <div id="portfolios-view" class="view-content active">
          <div class="portfolios-grid" id="portfolios-grid">
            <!-- Portfolios will be loaded here -->
          </div>
        </div>

        <!-- Images View -->
        <div id="images-view" class="view-content">
          <div class="images-controls">
            <input type="text" id="image-search" placeholder="Search images..." class="search-input">
            <select id="gallery-filter" class="filter-select">
              <option value="">All Galleries</option>
            </select>
          </div>
          <div class="images-grid" id="images-grid">
            <!-- Images will be loaded here dynamically with infinite scroll -->
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Portfolio Modal -->
  <div id="portfolio-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title">Create Portfolio</h3>
        <button class="modal-close" onclick="closePortfolioModal()">×</button>
      </div>
      <form id="portfolio-form">
        <input type="hidden" id="portfolio-id">
        
        <div class="form-group">
          <label for="portfolio-title">Title *</label>
          <input type="text" id="portfolio-title" required>
        </div>
        
        <div class="form-group">
          <label for="portfolio-cover">Cover Image URL</label>
          <input type="text" id="portfolio-cover" placeholder="/photos/md/image.jpg">
        </div>
        
        <div class="form-group">
          <label for="portfolio-description">Short Description</label>
          <textarea id="portfolio-description" rows="2"></textarea>
        </div>
        
        <div class="form-group">
          <label for="portfolio-full-description">Full Description</label>
          <textarea id="portfolio-full-description" rows="6"></textarea>
        </div>
        
        <div class="form-group">
          <label for="portfolio-order">Display Order</label>
          <input type="number" id="portfolio-order" value="999">
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closePortfolioModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Portfolio</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Image Modal -->
  <div id="image-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="image-modal-title">Edit Image</h3>
        <button class="modal-close" onclick="closeImageModal()">×</button>
      </div>
      <form id="image-form">
        <input type="hidden" id="image-id">
        
        <!-- Image Preview -->
        <div class="form-group">
          <label>Image Preview</label>
          <div id="image-preview" class="image-preview">
            <img id="preview-img" src="" alt="Image preview" style="max-width: 100%; max-height: 400px; border: 2px solid var(--border); border-radius: 0.375rem; display: none;">
            <p id="preview-placeholder" style="color: var(--text-muted); text-align: center; padding: 2rem; background: var(--bg-darker); border-radius: 0.375rem;">No image to preview</p>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="image-name">Image Name *</label>
            <input type="text" id="image-name" required>
          </div>
          
          <div class="form-group">
            <label for="image-location">Location</label>
            <input type="text" id="image-location">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="image-date">Date</label>
            <input type="text" id="image-date">
          </div>
          
          <div class="form-group">
            <label for="image-date-taken">Date Taken</label>
            <input type="date" id="image-date-taken">
          </div>
        </div>
        
        <div class="form-group">
          <label for="image-xlarge">X-Large File Path</label>
          <input type="text" id="image-xlarge" placeholder="/photos/xlg/image.jpg">
        </div>
        
        <div class="form-group">
          <label for="image-large">Large File Path</label>
          <input type="text" id="image-large" placeholder="/photos/lg/image.jpg">
        </div>
        
        <div class="form-group">
          <label for="image-medium">Medium File Path</label>
          <input type="text" id="image-medium" placeholder="/photos/md/image.jpg" onchange="updateImagePreview()">
        </div>
        
        <div class="form-group">
          <label for="image-small">Small File Path</label>
          <input type="text" id="image-small" placeholder="/photos/sm/image.jpg">
        </div>
        
        <div class="form-group">
          <label for="image-teaser">Teaser</label>
          <textarea id="image-teaser" rows="2"></textarea>
        </div>
        
        <div class="form-group">
          <label for="image-text">Full Description</label>
          <textarea id="image-text" rows="4"></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeImageModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Image</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Gallery Images Modal -->
  <div id="gallery-images-modal" class="modal modal-large">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="gallery-images-title">Manage Portfolio Images</h3>
        <button class="modal-close" onclick="closeGalleryImagesModal()">×</button>
      </div>
      <div class="gallery-images-content">
        <div class="gallery-images-sidebar">
          <h4>Available Images</h4>
          <input type="text" id="available-images-search" placeholder="Search images..." class="search-input">
          <div id="available-images-list" class="images-list">
            <!-- Available images will be loaded here -->
          </div>
          <div id="available-images-loading" class="loading-indicator" style="display: none; text-align: center; padding: 1rem; color: var(--text-muted);">
            <div class="spinner" style="width: 30px; height: 30px; margin: 0 auto;"></div>
            <p style="margin-top: 0.5rem;">Loading more images...</p>
          </div>
          <div id="available-images-end" class="end-indicator" style="display: none; text-align: center; padding: 1rem; color: var(--text-muted);">
            <p>No more images to load</p>
          </div>
        </div>
        <div class="gallery-images-main">
          <h4>Portfolio Images (Drag to reorder)</h4>
          <div id="gallery-images-list" class="images-list sortable">
            <!-- Gallery images will be loaded here -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading Overlay -->
  <div id="loading-overlay" class="loading-overlay">
    <div class="spinner"></div>
  </div>

  <script src="admin-script.js"></script>
</body>
</html>
