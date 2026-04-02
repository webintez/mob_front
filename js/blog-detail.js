// Blog Detail Logic for Mobitez
const BLOG_API = {
    baseUrl: '/api',
    apiKey: ''
};

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (slug) {
        fetchBlogDetail(slug);
    } else {
        window.location.href = '/blog.html';
    }

    fetchRecentPosts();
});

async function fetchBlogDetail(slug) {
    const container = document.getElementById('blogDetail');

    try {
        const response = await fetch(`${BLOG_API.baseUrl}/blogs/${slug}`, {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': BLOG_API.apiKey
            }
        });

        if (!response.ok) throw new Error('Post not found');

        const blog = await response.json();
        renderBlogDetail(blog);

        // Update Title
        document.title = `${blog.title} - Mobitez Blog`;

    } catch (error) {
        console.error('Error fetching blog detail:', error);
        container.innerHTML = `
            <div class="error-message">
                <h2>Opps! Post not found</h2>
                <p>The blog post you are looking for does not exist or has been removed.</p>
                <a href="/blog.html" class="back-link">Back to Blogs</a>
            </div>
        `;
    }
}

function renderBlogDetail(blog) {
    const container = document.getElementById('blogDetail');

    const date = new Date(blog.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    container.innerHTML = `
        <article class="blog-full-post">
            <header class="blog-detail-header">
                <span class="blog-detail-category">${blog.category ? blog.category.name : 'General'}</span>
                <h1 class="blog-detail-title">${blog.title}</h1>
                <div class="blog-detail-meta">
                    <span><i class="far fa-calendar-alt"></i> ${date}</span>
                    <span><i class="far fa-user"></i> ${blog.author || 'Mobitez Team'}</span>
                </div>
            </header>

            <div class="blog-detail-image-wrapper">
                <img src="${blog.image_url}" alt="${blog.title}" class="blog-detail-image" onerror="this.src='/img/placeholder.png'">
            </div>

            <div class="blog-detail-text">
                ${blog.content}
            </div>
        </article>
    `;
}

async function fetchRecentPosts() {
    const recentPostsDiv = document.getElementById('recentPosts');

    try {
        const response = await fetch(`${BLOG_API.baseUrl}/blogs?limit=5`, {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': BLOG_API.apiKey
            }
        });

        const data = await response.json();

        if (data && data.data) {
            renderRecentPosts(data.data);
        }
    } catch (error) {
        console.error('Error fetching recent posts:', error);
    }
}

function renderRecentPosts(posts) {
    const container = document.getElementById('recentPosts');
    container.innerHTML = '';

    posts.forEach(post => {
        const date = new Date(post.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const item = document.createElement('a');
        item.href = `/blog-detail.html?slug=${post.slug}`;
        item.className = 'recent-post-item';
        item.innerHTML = `
            <img src="${post.image_url}" alt="${post.title}" class="recent-post-thumb" onerror="this.src='/img/placeholder.png'">
            <div class="recent-post-info">
                <h4>${post.title}</h4>
                <span class="recent-post-date">${date}</span>
            </div>
        `;
        container.appendChild(item);
    });
}
