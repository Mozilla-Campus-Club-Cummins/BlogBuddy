document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const blogForm = document.getElementById("blogForm");

    const logoutBtn = document.getElementById("logoutBtn");
    const profileMenu = document.querySelector(".profile-menu");
    const loginBtn = document.querySelector("#loginLink");
    const registerBtn = document.querySelector("#registerLink");

    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");

    const createPostSection = document.querySelector(".create-post");
    const loginWarning = document.createElement("p");
    loginWarning.style.color = "red";
    loginWarning.style.display = "none";
    loginWarning.innerText = "Please login to create a post.";
    if (createPostSection) createPostSection.appendChild(loginWarning);

    // -------- Register User --------
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("regUsername").value.trim();
            const displayName = document.getElementById("regDisplayName")?.value.trim() || username;
            const password = document.getElementById("regPassword").value;

            if (!username || !password) {
                alert("Please fill all fields.");
                return;
            }

            if (localStorage.getItem(username)) {
                alert("User already exists! Please login.");
                return;
            }

            localStorage.setItem(username, JSON.stringify({ password, displayName }));
            alert("Registration successful! You can now login.");
            registerForm.reset();
        });
    }

    // -------- Login User --------
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value;

            const storedUser = JSON.parse(localStorage.getItem(username));
            if (storedUser && storedUser.password === password) {
                localStorage.setItem("currentUser", username);
                alert(`Hi, ${storedUser.displayName}! Welcome back 👋`);
                updateUI();
                loginForm.reset();
            } else {
                alert("Invalid credentials!");
            }
        });
    }

    // -------- Update UI Based on Login State --------
    function updateUI() {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
            const storedUser = JSON.parse(localStorage.getItem(currentUser));
            if (loginBtn) loginBtn.style.display = "none";
            if (registerBtn) registerBtn.style.display = "none";
            if (profileMenu) profileMenu.style.display = "flex";

            if (profileIcon && storedUser) profileIcon.title = storedUser.displayName;

            if (blogForm) {
                blogForm.querySelector("button").disabled = false;
                blogForm.querySelectorAll("input, textarea").forEach(el => el.disabled = false);
            }
            if (loginWarning) loginWarning.style.display = "none";
        } else {
            if (loginBtn) loginBtn.style.display = "inline-block";
            if (registerBtn) registerBtn.style.display = "inline-block";
            if (profileMenu) profileMenu.style.display = "none";

            if (blogForm) {
                blogForm.querySelector("button").disabled = true;
                blogForm.querySelectorAll("input, textarea").forEach(el => el.disabled = true);
            }
            if (loginWarning) loginWarning.style.display = "block";
        }
    }

    updateUI();

    // -------- Logout --------
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("currentUser");
            updateUI();
            window.location.href = "index.html";
        });
    }

    // -------- Multiple Image Upload Preview --------
    const imageUpload = document.getElementById("imageUpload");
    const imagePreview = document.getElementById("imagePreview");
    let selectedImages = [];
    
    if (imageUpload && imagePreview) {
        imageUpload.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                selectedImages = [];
                imagePreview.innerHTML = '<div class="loading-text">Loading images...</div>';
                
                let loadedCount = 0;
                files.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        selectedImages.push({
                            data: e.target.result,
                            name: file.name,
                            index: index
                        });
                        loadedCount++;
                        
                        if (loadedCount === files.length) {
                            displayImagePreviews();
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
    }

    // -------- Display Image Previews --------
    function displayImagePreviews() {
        if (selectedImages.length === 0) {
            imagePreview.innerHTML = '';
            return;
        }
        
        let previewHTML = '<div class="preview-gallery">';
        selectedImages.forEach((img, index) => {
            previewHTML += `
                <div class="preview-item">
                    <img src="${img.data}" alt="Preview ${index + 1}" class="preview-image">
                    <button type="button" class="remove-single-image-btn" onclick="removeSingleImage(${index})">×</button>
                </div>
            `;
        });
        previewHTML += '</div>';
        previewHTML += '<button type="button" class="remove-all-images-btn" onclick="removeAllImages()">Remove All Images</button>';
        
        imagePreview.innerHTML = previewHTML;
    }

    // -------- Remove Single Image Function --------
    window.removeSingleImage = function(index) {
        selectedImages.splice(index, 1);
        displayImagePreviews();
    };

    // -------- Remove All Images Function --------
    window.removeAllImages = function() {
        selectedImages = [];
        if (imageUpload) imageUpload.value = '';
        if (imagePreview) imagePreview.innerHTML = '';
    };

    // -------- Blog Post Submission --------
    if (blogForm) {
        blogForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const currentUser = localStorage.getItem("currentUser");

            if (!currentUser) {
                alert("You need to login/register to publish a post.");
                return;
            }

            const title = document.getElementById("title").value.trim();
            const content = document.getElementById("content").value.trim();
            const storedUser = JSON.parse(localStorage.getItem(currentUser));
            const author = storedUser ? storedUser.displayName : currentUser;

            if (!title || !content) {
                alert("Please fill all fields to publish a post.");
                return;
            }

            // Handle multiple image uploads
            const images = selectedImages.map(img => img.data);
            savePostWithImages(title, content, author, images);
        });
    }

    // -------- Save Post with Multiple Images --------
    function savePostWithImages(title, content, author, images) {
        const post = { 
            title, 
            content, 
            author, 
            date: new Date().toISOString(), 
            likes: 0, 
            likedBy: [],
            images: images.length > 0 ? images : null
        };

        let posts = JSON.parse(localStorage.getItem("posts")) || [];
        posts.push(post);
        localStorage.setItem("posts", JSON.stringify(posts));

        appendPostToFeed(post);
        blogForm.reset();
        selectedImages = [];
        if (imagePreview) imagePreview.innerHTML = '';
    }

    // -------- Load Existing Posts on Page Load --------
    const postsList = document.getElementById("postsList");
    if (postsList) {
        const posts = JSON.parse(localStorage.getItem("posts")) || [];
        posts.reverse().forEach(post => appendPostToFeed(post));
    }

    // -------- Function to Append Post to Feed --------
    function appendPostToFeed(post) {
        const postsList = document.getElementById("postsList");
        if (!postsList) return;

        const currentUser = localStorage.getItem("currentUser");

        const postDiv = document.createElement("div");
        postDiv.className = "post-card";
        postDiv.dataset.date = post.date;
        // Handle both old single image format and new multiple images format
        let imagesHTML = '';
        if (post.images && post.images.length > 0) {
            // New multiple images format
            imagesHTML = '<div class="post-images-gallery">';
            post.images.forEach((img, index) => {
                imagesHTML += `<img src="${img}" alt="Post image ${index + 1}" class="post-image">`;
            });
            imagesHTML += '</div>';
        } else if (post.image) {
            // Old single image format (for backward compatibility)
            imagesHTML = `<img src="${post.image}" alt="Post image" class="post-image">`;
        }

        postDiv.innerHTML = `
            <h3 class="post-title">${post.title}</h3>
            ${imagesHTML}
            <p class="post-excerpt">${post.content}</p>
            <small class="post-meta">by ${post.author} | ${new Date(post.date).toLocaleString()}</small>
            <div class="post-actions">
                <button class="like-btn">${post.likedBy.includes(currentUser) ? '⭐ Liked' : '☆ Like'} (${post.likes})</button>
                <button class="delete-post-btn">Delete</button>
            </div>
        `;
        postsList.prepend(postDiv);

        // -------- Like Button --------
        const likeBtn = postDiv.querySelector(".like-btn");
        likeBtn.addEventListener("click", () => {
            const username = localStorage.getItem("currentUser");
            if (!username) return alert("Login to like posts!");

            const posts = JSON.parse(localStorage.getItem("posts")) || [];
            const postIndex = posts.findIndex(p => p.date === post.date);

            if (postIndex !== -1) {
                if (posts[postIndex].likedBy.includes(username)) {
                    // Unlike
                    posts[postIndex].likedBy = posts[postIndex].likedBy.filter(u => u !== username);
                    posts[postIndex].likes--;
                } else {
                    // Like
                    posts[postIndex].likedBy.push(username);
                    posts[postIndex].likes++;
                }
                localStorage.setItem("posts", JSON.stringify(posts));
                likeBtn.innerText = `${posts[postIndex].likedBy.includes(username) ? '⭐ Liked' : '☆ Like'} (${posts[postIndex].likes})`;
            }
        });

        // -------- Delete Button --------
        const deleteBtn = postDiv.querySelector(".delete-post-btn");
        deleteBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete this post?")) {
                postDiv.remove();
                let posts = JSON.parse(localStorage.getItem("posts")) || [];
                posts = posts.filter(p => p.date !== post.date);
                localStorage.setItem("posts", JSON.stringify(posts));
            }
        });
    }

    // -------- Profile Dropdown Toggle --------
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener("click", () => {
            profileDropdown.classList.toggle("show");
        });

        // Close dropdown if clicked outside
        window.addEventListener("click", (e) => {
            if (!profileMenu.contains(e.target)) {
                profileDropdown.classList.remove("show");
            }
        });
    }
});
