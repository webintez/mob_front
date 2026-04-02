// Short Videos Logic for Mobitez Homepage
const VIDEO_API = {
    baseUrl: '/api',
    apiKey: ''
};

function renderVideosSection() {
    // Check if section already exists
    if (document.querySelector('.short-videos-section')) return;

    // Create section
    const section = document.createElement('section');
    section.className = 'short-videos-section';
    section.innerHTML = `
        <div class="videos-container">
            <div class="videos-scroll-wrapper">
                <div class="videos-grid" id="videosGrid">
                    <!-- Videos will be loaded here -->
                    <div class="loading-spinner" style="padding: 20px; color: #666;">Loading videos...</div>
                </div>
            </div>
        </div>
        
        <!-- Video Player Modal -->
        <div class="video-player-modal" id="videoModal">
            <div class="modal-content-wrapper">
                <button class="close-modal-btn" id="closeVideoBtn">
                    <i class="fas fa-times"></i>
                </button>
                <div class="video-iframe-container" id="videoPlayerContainer">
                    <!-- Iframe injected here -->
                </div>
            </div>
        </div>
    `;

    // Placement: Above SEO Footer / Brand Directory
    // The SEO Footer is added after <main>
    const seoFooter = document.querySelector('.seo-footer-section');
    const mainMain = document.querySelector('main');

    if (seoFooter) {
        seoFooter.parentNode.insertBefore(section, seoFooter);
    } else if (mainMain) {
        mainMain.parentNode.insertBefore(section, mainMain.nextSibling);
    } else {
        document.body.appendChild(section);
    }

    // Initialize events
    document.getElementById('closeVideoBtn').onclick = closeVideoModal;
    document.getElementById('videoModal').onclick = (e) => {
        if (e.target.id === 'videoModal') closeVideoModal();
    };

    // Fetch data
    fetchVideos();
}

async function fetchVideos() {
    const grid = document.getElementById('videosGrid');

    try {
        const response = await fetch(`${VIDEO_API.baseUrl}/videos`, {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': VIDEO_API.apiKey
            }
        });
        const data = await response.json();


        if (data && data.data && data.data.length > 0) {
            renderVideoCards(data.data);
        } else {
            grid.innerHTML = '<div style="padding: 20px; color: #666;">No videos available at the moment.</div>';
        }
    } catch (error) {
        console.error('Error fetching videos:', error);
        grid.innerHTML = '<div style="padding: 20px; color: #f44336;">Failed to load videos.</div>';
    }
}

function renderVideoCards(videos) {
    const grid = document.getElementById('videosGrid');
    grid.innerHTML = '';

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openVideoModal(video.video_url);

        card.innerHTML = `
            <img src="${video.thumbnail_url}" alt="${video.title}" class="video-thumbnail" onerror="this.src='/img/placeholder-vertical.png'">
            <div class="play-btn-overlay">
                <i class="fas fa-play"></i>
            </div>
            <div class="video-overlay">
                <div class="video-title-small">${video.title}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openVideoModal(url) {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoPlayerContainer');

    // Support YouTube links - convert watch?v=, /shorts/, or youtu.be/ to embed/
    let videoId = '';
    if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('shorts/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('/').pop().split('?')[0];
    }

    let embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : url;

    container.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('videoPlayerContainer');

    container.innerHTML = ''; // Stop video
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll
}

// Ensure it runs after footer/seo injection
// Since seo-footer.js is deferred, we should also wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(renderVideosSection, 500));
} else {
    setTimeout(renderVideosSection, 500);
}
