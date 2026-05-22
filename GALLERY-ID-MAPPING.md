# Gallery ID to Slug Mapping

Based on your SQL data, here are the gallery IDs:

| Gallery ID | Title | Slug (for URLs) |
|------------|-------|-----------------|
| 4 | Rapa Nui, The Navel of the World | rapa-nui |
| 30 | The City of Brotherly Love | philadelphia |
| 37 | Vessels Of Life | vessels |
| 3 | Tawantinsuyu | peru |
| 2 | Return of the Snow Lion | tibet |
| 15 | Traditional Japan | japan |

## Update Your HTML

In `index.html`, update the portfolio card links to use gallery_id:

### Before (using slug):
```html
<div class="category-card" data-portfolio="peru">
  ...
  <a href="portfolio-detail.html?portfolio=peru" class="category-link">View Gallery →</a>
</div>
```

### After (using gallery_id):
```html
<div class="category-card" data-portfolio="3" data-gallery-id="3">
  ...
  <a href="portfolio-detail.html?id=3" class="category-link">View Gallery →</a>
</div>
```

## Updated Portfolio Cards

Replace your portfolio cards in `index.html` with these:

```html
<!-- Peru / Tawantinsuyu -->
<div class="category-card" data-portfolio="3" data-gallery-id="3" data-images='[...]'>
  <div class="category-image"></div>
  <div class="category-overlay">
    <h3 class="category-title">Tawantinsuyu</h3>
    <p class="category-description">The Inca Empire legacy</p>
    <a href="portfolio-detail.html?id=3" class="category-link">View Gallery →</a>
  </div>
</div>

<!-- Tibet -->
<div class="category-card" data-portfolio="2" data-gallery-id="2" data-images='[...]'>
  <div class="category-image"></div>
  <div class="category-overlay">
    <h3 class="category-title">Return of the Snow Lion</h3>
    <p class="category-description">Tibetan landscapes and culture</p>
    <a href="portfolio-detail.html?id=2" class="category-link">View Gallery →</a>
  </div>
</div>

<!-- Rapa Nui / Easter Island -->
<div class="category-card" data-portfolio="4" data-gallery-id="4" data-images='[...]'>
  <div class="category-image"></div>
  <div class="category-overlay">
    <h3 class="category-title">Rapa Nui, The Navel of the World</h3>
    <p class="category-description">Journey to Easter Island</p>
    <a href="portfolio-detail.html?id=4" class="category-link">View Gallery →</a>
  </div>
</div>

<!-- Japan -->
<div class="category-card" data-portfolio="15" data-gallery-id="15" data-images='[...]'>
  <div class="category-image"></div>
  <div class="category-overlay">
    <h3 class="category-title">Traditional Japan</h3>
    <p class="category-description">Ancient customs and beauty</p>
    <a href="portfolio-detail.html?id=15" class="category-link">View Gallery →</a>
  </div>
</div>

<!-- Vessels of Life -->
<div class="category-card" data-portfolio="37" data-gallery-id="37" data-images='[...]'>
  <div class="category-image"></div>
  <div class="category-overlay">
    <h3 class="category-title">Vessels Of Life</h3>
    <p class="category-description">Stories in stillness</p>
    <a href="portfolio-detail.html?id=37" class="category-link">View Gallery →</a>
  </div>
</div>

<!-- Philadelphia -->
<div class="category-card" data-portfolio="30" data-gallery-id="30" data-images='[...]'>
  <div class="category-image"></div>
  <div class="category-overlay">
    <h3 class="category-title">The City of Brotherly Love</h3>
    <p class="category-description">Philadelphia's vibrant spirit</p>
    <a href="portfolio-detail.html?id=30" class="category-link">View Gallery →</a>
  </div>
</div>
```

## API Usage

Now you can call the API with gallery_id:

```
# Get single portfolio
/api-portfolios.php?id=4
# or
/api-portfolios.php?gallery_id=4

# Update portfolio
PUT /api-portfolios.php?id=4

# Delete portfolio
DELETE /api-portfolios.php?id=4
```

Much faster - no need to search through all galleries!
