// Portfolio Website - Dynamic Script using AJAX
// IMPORTANT: If your site is in a subdirectory, update this:
// const API_BASE = '/newSite';  // ← Change 'newSite' to your folder name
const API_BASE = '';

function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('active');
}

// Add scroll effect to header
window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Hero background slideshow functionality
document.addEventListener('DOMContentLoaded', function() {
  initHeroSlideshow();
  initPortfolioCards();
  initContactForm();
});

function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(url);
    img.onerror = () => resolve(url); // resolve anyway so we don't stall
    img.src = url;
  });
}

function initHeroSlideshow() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const heroImagesData = hero.getAttribute('data-hero-images');
  if (!heroImagesData) return;

  const heroImages = JSON.parse(heroImagesData);
  let currentHeroIndex = 0;

  // Preload first image before showing it
  preloadImage(heroImages[0]).then(() => {
    hero.style.backgroundImage = `url('${heroImages[0]}')`;
    hero.style.opacity = '1';
  });

  // Preload remaining images in background
  heroImages.slice(1).forEach(url => preloadImage(url));

  // Start slideshow
  setInterval(() => {
    hero.style.opacity = '0';
    setTimeout(() => {
      currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
      hero.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
      hero.style.opacity = '1';
    }, 400);
  }, 6000);
}

async function initPortfolioCards() {
  // ALWAYS use DOM data first (it's already in HTML)
  // This ensures the gallery works immediately
  setupPortfolioSlideshowsFromDOM();
  
  // Then optionally try to load from API for future updates
  // (This is non-blocking and won't break the page if it fails)
  try {
    const response = await fetch(API_BASE + '/api-portfolios.php', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Only proceed if we get a successful JSON response
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      
      if (data.portfolios && data.portfolios.length > 0) {
        console.log('API data loaded successfully, updating portfolio cards');
        // Optionally update with API data (for future enhancement)
        // setupPortfolioSlideshows(data.portfolios);
      }
    }
  } catch (error) {
    // Silently fail - we already have the DOM data working
    console.log('API not available, using static data (this is fine)');
  }
}

function setupPortfolioSlideshowsFromDOM() {
  const cards = document.querySelectorAll('.category-card');

  cards.forEach(card => {
    const imageElement = card.querySelector('.category-image');
    const imagesData   = card.getAttribute('data-images');

    if (imagesData) {
      try {
        const images = JSON.parse(imagesData);
        let currentIndex = 0;

        // Preload first image, then set it
        preloadImage(images[0]).then(() => {
          imageElement.style.backgroundImage  = `url('${images[0]}')`;
          imageElement.style.backgroundSize   = 'cover';
          imageElement.style.backgroundPosition = 'center';
        });

        // Preload remaining images in background
        images.slice(1).forEach(url => preloadImage(url));

        // Start slideshow only if multiple images
        if (images.length > 1) {
          setInterval(() => {
            imageElement.classList.add('fade-out');
            setTimeout(() => {
              currentIndex = (currentIndex + 1) % images.length;
              imageElement.style.backgroundImage = `url('${images[currentIndex]}')`;
              imageElement.classList.remove('fade-out');
            }, 400);
          }, 3000);
        }
      } catch (e) {
        console.error('Error parsing image data for card:', card, e);
      }
    }

    // Click handler
    const portfolioId = card.getAttribute('data-portfolio');
    if (portfolioId) {
      card.addEventListener('click', function(e) {
        if (e.target.tagName !== 'A') {
          window.location.href = `portfolio-detail.html?portfolio=${portfolioId}`;
        }
      });
    }
  });
}

function setupPortfolioSlideshows(portfolios) {
  // Optional: Use API data to update portfolio cards
  // Only called if API is available
  const cards = document.querySelectorAll('.category-card');
  
  cards.forEach(card => {
    const portfolioSlug = card.getAttribute('data-portfolio');
    const portfolio = portfolios.find(p => p.slug === portfolioSlug);
    
    if (portfolio && portfolio.preview_images && portfolio.preview_images.length > 0) {
      const imageElement = card.querySelector('.category-image');
      const images = portfolio.preview_images;
      let currentIndex = 0;
      
      // Set initial image
      imageElement.style.backgroundImage = `url('${images[0]}')`;
      imageElement.style.backgroundSize = 'cover';
      imageElement.style.backgroundPosition = 'center';
      
      // Start slideshow for each card
      if (images.length > 1) {
        setInterval(() => {
          imageElement.classList.add('fade-out');
          
          setTimeout(() => {
            currentIndex = (currentIndex + 1) % images.length;
            imageElement.style.backgroundImage = `url('${images[currentIndex]}')`;
            imageElement.classList.remove('fade-out');
          }, 400);
        }, 3000);
      }
    }
  });
}

// ── Contact form AJAX submission ─────────────────────────────────────────────
function initContactForm() {
  const form      = document.getElementById('contact-form');
  const status    = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Basic client-side validation
    const firstName = form.first_name.value.trim();
    const lastName  = form.last_name.value.trim();
    const email     = form.email.value.trim();
    const message   = form.message.value.trim();

    if (!firstName || !lastName || !email || !message) {
      showStatus('Please fill in all required fields.', 'error');
      return;
    }

    // Disable button, show sending state
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display    = 'none';
    submitBtn.querySelector('.btn-sending').style.display = 'inline';
    clearStatus();

    const payload = {
      first_name: firstName,
      last_name:  lastName,
      email:      email,
      type:       form.type.value,
      message:    message,
    };

    try {
      const response = await fetch(API_BASE + '/api-contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        showStatus(data.message || 'Thank you! Your message has been received.', 'success');
        form.reset();
      } else {
        showStatus(data.error || 'Something went wrong. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      showStatus('Unable to send your message right now. Please email jeff@jeffdonovan.net directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').style.display    = 'inline';
      submitBtn.querySelector('.btn-sending').style.display = 'none';
    }
  });

  function showStatus(msg, type) {
    status.textContent  = msg;
    status.className    = 'form-status ' + type;
  }

  function clearStatus() {
    status.textContent = '';
    status.className   = 'form-status';
  }
}
