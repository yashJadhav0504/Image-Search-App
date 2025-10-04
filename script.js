
let currentPage = 1;
let currentQuery = '';
let currentCategory = 'all';
let totalImagesLoaded = 0;
let isLoading = false;
let currentImageData = null;
const API_KEY = 'Fa1U4fP53h508vwQ-3heXRlmxknIisgNfZID6-kTFrA';
const MAX_IMAGES = 100; 


function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Save theme to localStorage
    localStorage.setItem('theme', newTheme);
}


document.addEventListener('DOMContentLoaded', function() {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    // Hide Show More button initially
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.style.display = 'none';
    
    // Add infinite scroll listener
    window.addEventListener('scroll', handleInfiniteScroll);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
});


function handleEnter(event) {
    if (event.key === 'Enter') {
        searchImages();
    }
}


function filterCategory(category) {
    currentCategory = category;
    
    // Remove active class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Set search input value
    const searchInput = document.getElementById('searchInput');
    searchInput.value = category === 'all' ? '' : category;
    
    // Trigger search
    searchImages();
}

// ================================
// 💀 SHOW SKELETON LOADING
// ================================
function showSkeletonLoading() {
    const skeletonContainer = document.getElementById('skeletonContainer');
    skeletonContainer.innerHTML = '';
    
    for (let i = 0; i < 12; i++) {
        const skeleton = document.createElement('div');
        skeleton.classList.add('skeleton-card');
        skeletonContainer.appendChild(skeleton);
    }
}


function hideSkeletonLoading() {
    const skeletonContainer = document.getElementById('skeletonContainer');
    skeletonContainer.innerHTML = '';
}


function searchImages() {
    if (isLoading) return;
    
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value || currentCategory;

    if (query.trim() === '' || query === 'all') {
        alert('Please enter a search term or select a category! 🔍');
        return;
    }

    currentQuery = query;
    currentPage = 1;
    isLoading = true;

    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = '';
    totalImagesLoaded = 0;
    updateImageCount();
    
    showSkeletonLoading();
    document.getElementById('noResults').classList.remove('active');

    const apiUrl = `https://api.unsplash.com/search/photos?query=${query}&page=${currentPage}&per_page=20&client_id=${API_KEY}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            hideSkeletonLoading();
            
            if (data.results.length === 0) {
                document.getElementById('noResults').classList.add('active');
            } else {
                displayImages(data.results);
                const buttonContainer = document.querySelector('.button-container');
                buttonContainer.style.display = 'block';
                
                // Save to search history
                saveSearchHistory(query);
            }
            
            isLoading = false;
        })
        .catch(error => {
            console.error('Error fetching images:', error);
            hideSkeletonLoading();
            alert('⚠️ Error loading images. Please try again!');
            isLoading = false;
        });
}


function displayImages(images) {
    const imageContainer = document.getElementById('imageContainer');

    if (currentPage === 1) {
        imageContainer.innerHTML = '';
        totalImagesLoaded = 0;
    }

    // Calculate how many images can be added
    const remainingSlots = MAX_IMAGES - totalImagesLoaded;
    const imagesToAdd = images.slice(0, remainingSlots);

    imagesToAdd.forEach(image => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('image-card');
        
        const imageUrl = image.urls.regular;
        const fullImageUrl = image.urls.full;
        const photographer = image.user.name || 'Unknown';
        const likes = image.likes || 0;
        
        // Get real download link with trigger
        const downloadUrl = `${image.links.download}?force=true`;
        
        cardElement.innerHTML = `
            <img src="${imageUrl}" alt="${image.alt_description || 'Image'}" loading="lazy">
            <div class="action-buttons">
                <button class="action-btn" onclick='openLightbox(${JSON.stringify(image).replace(/'/g, "&apos;")})' title="View Full">🔍</button>
                <button class="action-btn" onclick='downloadImageDirect("${fullImageUrl}", "${photographer}")' title="Download">⬇️</button>
                <button class="action-btn" onclick='copyURL("${imageUrl}")' title="Copy URL">🔗</button>
            </div>
            <div class="image-overlay">
                <div class="image-info">
                    <div class="photographer">📷 ${photographer}</div>
                    <div class="image-stats">
                        <span>❤️ ${formatNumber(likes)} likes</span>
                    </div>
                </div>
            </div>
        `;

        imageContainer.appendChild(cardElement);
        totalImagesLoaded++;
    });

    updateImageCount();
    
    // Check if limit reached
    if (totalImagesLoaded >= MAX_IMAGES) {
        const buttonContainer = document.querySelector('.button-container');
        buttonContainer.style.display = 'none';
    } else {
        currentPage++;
    }
}


function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}


function updateImageCount() {
    const imageCount = document.getElementById('imageCount');
    imageCount.textContent = totalImagesLoaded;
}


function showMore() {
    if (isLoading || !currentQuery) return;
    
    // Check if limit reached
    if (totalImagesLoaded >= MAX_IMAGES) {
        alert(`🚫 Maximum limit of ${MAX_IMAGES} images reached!`);
        const buttonContainer = document.querySelector('.button-container');
        buttonContainer.style.display = 'none';
        return;
    }
    
    isLoading = true;
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.classList.add('active');

    const apiUrl = `https://api.unsplash.com/search/photos?query=${currentQuery}&page=${currentPage}&per_page=20&client_id=${API_KEY}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            loadingSpinner.classList.remove('active');
            
            if (data.results.length === 0) {
                alert('✅ No more images to load!');
            } else {
                displayImages(data.results);
            }
            
            isLoading = false;
        })
        .catch(error => {
            console.error('Error fetching more images:', error);
            loadingSpinner.classList.remove('active');
            alert('⚠️ Error loading more images!');
            isLoading = false;
        });
}


function handleInfiniteScroll() {
    if (isLoading || !currentQuery) return;
    
    // Check if limit reached
    if (totalImagesLoaded >= MAX_IMAGES) {
        return;
    }
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    // Load more when 200px from bottom
    if (scrollTop + clientHeight >= scrollHeight - 200) {
        showMore();
    }
}


function openLightbox(imageData) {
    currentImageData = imageData;
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxPhotographer = document.getElementById('lightboxPhotographer');
    const lightboxLikes = document.getElementById('lightboxLikes');
    const lightboxViews = document.getElementById('lightboxViews');
    
    lightboxImage.src = imageData.urls.full;
    lightboxPhotographer.textContent = `📷 Photo by ${imageData.user.name}`;
    lightboxLikes.textContent = `❤️ ${formatNumber(imageData.likes || 0)} likes`;
    
    // Fetch real-time statistics from Unsplash
    fetch(`https://api.unsplash.com/photos/${imageData.id}?client_id=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            const downloads = data.downloads || 0;
            lightboxViews.textContent = `⬇️ ${formatNumber(downloads)} downloads`;
        })
        .catch(error => {
            console.error('Error fetching image stats:', error);
            lightboxViews.textContent = `⬇️ Downloads unavailable`;
        });
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}


function closeLightbox(event) {
    if (event && event.target.id !== 'lightbox' && event.type === 'click') {
        return;
    }
    
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentImageData = null;
}

// ================================
// ⬇️ DOWNLOAD IMAGE
// ================================
function downloadImage() {
    if (!currentImageData) return;
    
    const imageUrl = currentImageData.urls.full;
    const photographer = currentImageData.user.name || 'Unknown';
    const filename = `${photographer.replace(/\s+/g, '_')}_${currentImageData.id}.jpg`;
    
    // Trigger download with proper filename
    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert('✅ Image downloaded successfully!');
            
            
            fetch(`https://api.unsplash.com/photos/${currentImageData.id}/download?client_id=${API_KEY}`)
                .catch(err => console.log('Download tracking failed:', err));
        })
        .catch(error => {
            console.error('Download error:', error);
            alert('⚠️ Download failed! Try right-click and "Save Image As"');
        });
}


function downloadImageDirect(imageUrl, photographer) {
    const filename = `${photographer.replace(/\s+/g, '_')}_image.jpg`;
    
    fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            alert('✅ Image downloaded successfully!');
        })
        .catch(error => {
            console.error('Download error:', error);
            alert('⚠️ Download failed! Try right-click and "Save Image As"');
        });
}


function shareImage() {
    if (!currentImageData) return;
    
    const imageUrl = currentImageData.urls.full;
    const photographer = currentImageData.user.name;
    const shareText = `Check out this amazing photo by ${photographer}!`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Beautiful Image',
            text: shareText,
            url: imageUrl
        }).then(() => {
            console.log('✅ Shared successfully');
        }).catch(err => {
            console.log('❌ Share failed:', err);
            copyImageURL();
        });
    } else {
        // Fallback: Copy to clipboard
        copyImageURL();
    }
}


function copyImageURL() {
    if (!currentImageData) return;
    
    const imageUrl = currentImageData.urls.full;
    copyURL(imageUrl);
}


function copyURL(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ URL copied to clipboard!');
    }).catch(err => {
        console.error('❌ Failed to copy:', err);
        alert('⚠️ Failed to copy URL!');
    });
}


function saveSearchHistory(query) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    
    // Remove duplicates
    history = history.filter(item => item !== query);
    
    // Add to beginning
    history.unshift(query);
    
    // Keep only last 10 searches
    history = history.slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(history));
}


function handleKeyboardShortcuts(event) {
    // ESC key - Close lightbox
    if (event.key === 'Escape') {
        closeLightbox();
    }
    
    
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('searchInput').focus();
    }
}


console.log('🚀 Advanced Image Search App Loaded!');
console.log('🎨 Features: Dark Mode, Lightbox, Infinite Scroll, Download, Share, Copy URL');
console.log('⌨️ Shortcuts: ESC (Close), Ctrl/Cmd+K (Search)');


