function toggleMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('active');
}

function filterPhotos(category) {
  const photos = document.querySelectorAll('.photo-item');
  const buttons = document.querySelectorAll('.filter-btn');
  
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  photos.forEach(photo => {
    if (category === 'all' || photo.dataset.category === category) {
      photo.style.display = 'block';
    } else {
      photo.style.display = 'none';
    }
  });
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
  const hero = document.querySelector('.hero');
  const heroImagesData = hero.getAttribute('data-hero-images');
  
  if (heroImagesData) {
    const heroImages = JSON.parse(heroImagesData);
    let currentHeroIndex = 0;
    
    // Set initial hero image
    hero.style.backgroundImage = `url('${heroImages[0]}')`;
    
    // Start hero slideshow
    setInterval(() => {
      // Fade out current image
      hero.style.opacity = '0';
      
      // After fade out, change to next image and fade in
      setTimeout(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
        hero.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
        hero.style.opacity = '1';
      }, 400);
    }, 6000); // Change image every 6 seconds
  }
  
  // Portfolio card slideshow functionality
  const cards = document.querySelectorAll('.category-card');
  
  cards.forEach(card => {
    const imageElement = card.querySelector('.category-image');
    const imagesData = card.getAttribute('data-images');
    
    if (imagesData) {
      const images = JSON.parse(imagesData);
      let currentIndex = 0;
      
      // Set initial image
      imageElement.style.backgroundImage = `url('${images[0]}')`;
      imageElement.style.backgroundSize = 'cover';
      imageElement.style.backgroundPosition = 'center';
      
      // Start slideshow for each card
      setInterval(() => {
        // Fade out current image
        imageElement.classList.add('fade-out');
        
        // After fade out, change to next image and fade in
        setTimeout(() => {
          currentIndex = (currentIndex + 1) % images.length;
          imageElement.style.backgroundImage = `url('${images[currentIndex]}')`;
          imageElement.classList.remove('fade-out');
        }, 400);
      }, 3000); // Change image every 3 seconds
    }
    
    // Add click handler to navigate to portfolio detail page
    const portfolioId = card.getAttribute('data-portfolio');
    if (portfolioId) {
      card.addEventListener('click', function(e) {
        // Don't navigate if clicking on a link inside the card
        if (e.target.tagName !== 'A') {
          window.location.href = `portfolio-detail.html?portfolio=${portfolioId}`;
        }
      });
    }
  });
});