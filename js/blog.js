// Blog Logic for Mobitez
const BLOG_API = {
    baseUrl: '/api',
    apiKey: ''
};

let currentPage = 1;
let currentCategory = 'mobitez'; // Default to mobitez

async function fetchBlogs(page = 1, categorySlug = 'mobitez') {
    const blogList = document.getElementById('blogList');

    blogList.innerHTML = '<div class="loading-message">Loading blogs...</div>';

    try {
        let url = `${BLOG_API.baseUrl}/blogs?page=${page}`;
        if (categorySlug !== 'all') {
            url += `&category_slug=${categorySlug}`;
        }

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': BLOG_API.apiKey
            }
        });

        const data = await response.json();

        // Safely check if data and data.data exist and data.data is an array
        if (data && data.data && Array.isArray(data.data)) {
            renderBlogs(data.data);
            renderPagination(data);
        } else if (data && Array.isArray(data)) {
            // Handle cases where data might be a direct array
            renderBlogs(data);
        } else {
            console.warn('Unexpected blogs API format:', data);
            blogList.innerHTML = `<div class="error-message">${data.message || 'No blogs found.'}</div>`;
        }
    } catch (error) {
        console.error('Error fetching blogs:', error);
        blogList.innerHTML = '<div class="error-message">Failed to load blogs. Please try again later.</div>';
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${BLOG_API.baseUrl}/blog-categories`, {
            headers: {
                'Accept': 'application/json',
                'X-API-Key': BLOG_API.apiKey
            }
        });
        const categories = await response.json();

        // Safety check: Ensure categories is an array before filtering
        if (Array.isArray(categories)) {
            // Filter categories to only show "mobitez"
            const filteredCategories = categories.filter(cat => cat.slug === 'mobitez');
            renderCategories(filteredCategories);

            // Hide categories section if only one is left (optional, but requested "only Mobitez")
            if (filteredCategories.length <= 1) {
                const blogCategoriesEl = document.getElementById('blogCategories');
                if (blogCategoriesEl) blogCategoriesEl.style.display = 'none';
            }
        } else {
            console.error('Expected array for categories, got:', categories);
            const blogCategoriesEl = document.getElementById('blogCategories');
            if (blogCategoriesEl) blogCategoriesEl.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function renderBlogs(blogs) {
    const blogList = document.getElementById('blogList');
    blogList.innerHTML = '';

    if (blogs.length === 0) {
        blogList.innerHTML = '<div class="error-message">No blogs found in this category.</div>';
        return;
    }

    blogs.forEach(blog => {
        const card = document.createElement('div');
        card.className = 'blog-card';

        const date = new Date(blog.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        card.innerHTML = `
            <img src="${blog.image_url}" alt="${blog.title}" class="blog-image" onerror="this.src='/img/placeholder.png'">
            <div class="blog-content">
                <div class="blog-category">${blog.category ? blog.category.name : 'Mobitez'}</div>
                <h2 class="blog-title">${blog.title}</h2>
                <div class="blog-excerpt">${stripHtml(blog.content || '').substring(0, 150)}...</div>
            </div>
            <div class="blog-footer">
                <span class="blog-date">${date}</span>
                <a href="/blog-detail.html?slug=${blog.slug}" class="read-more">Read More</a>
            </div>
        `;
        blogList.appendChild(card);
    });
}

function renderCategories(categories) {
    const categoriesDiv = document.getElementById('blogCategories');
    categoriesDiv.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn active'; // Always active since it's the only one
        btn.textContent = `${cat.name} (${cat.count})`;
        btn.dataset.slug = cat.slug;
        btn.onclick = () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat.slug;
            currentPage = 1;
            fetchBlogs(1, cat.slug);
        };
        categoriesDiv.appendChild(btn);
    });
}

function renderPagination(data) {
    const paginationDiv = document.getElementById('pagination');
    if (!data.last_page || data.last_page <= 1) {
        paginationDiv.style.display = 'none';
        return;
    }

    paginationDiv.style.display = 'block';
    paginationDiv.innerHTML = '';

    for (let i = 1; i <= data.last_page; i++) {
        const btn = document.createElement('button');
        btn.className = `pagination-btn ${i === data.current_page ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            currentPage = i;
            fetchBlogs(i, currentCategory);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        paginationDiv.appendChild(btn);
    }
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    fetchBlogs(1, 'mobitez');
    fetchCategories();
});
