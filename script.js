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
      const displayName =
        document.getElementById("regDisplayName")?.value.trim() || username;
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
    const storedUser = currentUser
      ? JSON.parse(localStorage.getItem(currentUser))
      : null;
    if (currentUser) {
      const storedUser = JSON.parse(localStorage.getItem(currentUser));
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
      if (profileMenu) profileMenu.style.display = "flex";

      if (profileIcon && storedUser) profileIcon.title = storedUser.displayName;

      if (blogForm) {
        blogForm.querySelector("button").disabled = false;
        blogForm
          .querySelectorAll("input, textarea")
          .forEach((el) => (el.disabled = false));
      }
      if (loginWarning) loginWarning.style.display = "none";
    } else {
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (registerBtn) registerBtn.style.display = "inline-block";
      if (profileMenu) profileMenu.style.display = "none";

      if (blogForm) {
        blogForm.querySelector("button").disabled = true;
        blogForm
          .querySelectorAll("input, textarea")
          .forEach((el) => (el.disabled = true));
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

      const post = {
        title,
        content,
        author,
        authorId: currentUser, // store username for ownership checks
        date: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        edited: false,
        editedAt: null,
      };

      let posts = JSON.parse(localStorage.getItem("posts")) || [];
      posts.push(post);
      localStorage.setItem("posts", JSON.stringify(posts));

      appendPostToFeed(post);
      blogForm.reset();
    });
  }

  // -------- Load Existing Posts on Page Load --------
  const postsList = document.getElementById("postsList");
  if (postsList) {
    const posts = JSON.parse(localStorage.getItem("posts")) || [];
    posts.reverse().forEach((post) => appendPostToFeed(post));
  }

  // -------- Function to Append Post to Feed --------
  function appendPostToFeed(post) {
    const postsList = document.getElementById("postsList");
    if (!postsList) return;

    const currentUser = localStorage.getItem("currentUser");

    const postDiv = document.createElement("div");
    postDiv.className = "post-card";
    postDiv.dataset.date = post.date;
    const canEdit =
      currentUser &&
      (post.authorId === currentUser ||
        (storedUser && post.author === storedUser.displayName));

    postDiv.innerHTML = `
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-excerpt">${escapeHtml(post.content)}</p>
            <small class="post-meta">by ${escapeHtml(post.author)} | ${new Date(
      post.date
    ).toLocaleString()} ${
      post.edited ? '<span class="edited-badge">edited</span>' : ""
    }</small>
            <div class="post-actions">
                <button class="like-btn">${
                  post.likedBy.includes(currentUser) ? "⭐ Liked" : "☆ Like"
                } (${post.likes})</button>
                <button class="delete-post-btn">Delete</button>
                ${canEdit ? '<button class="edit-post-btn">Edit</button>' : ""}
            </div>
        `;
    postsList.prepend(postDiv);

    // -------- Like Button --------
    const likeBtn = postDiv.querySelector(".like-btn");
    likeBtn.addEventListener("click", () => {
      const username = localStorage.getItem("currentUser");
      if (!username) return alert("Login to like posts!");

      const posts = JSON.parse(localStorage.getItem("posts")) || [];
      const postIndex = posts.findIndex((p) => p.date === post.date);

      if (postIndex !== -1) {
        if (posts[postIndex].likedBy.includes(username)) {
          // Unlike
          posts[postIndex].likedBy = posts[postIndex].likedBy.filter(
            (u) => u !== username
          );
          posts[postIndex].likes--;
        } else {
          // Like
          posts[postIndex].likedBy.push(username);
          posts[postIndex].likes++;
        }
        localStorage.setItem("posts", JSON.stringify(posts));
        likeBtn.innerText = `${
          posts[postIndex].likedBy.includes(username) ? "⭐ Liked" : "☆ Like"
        } (${posts[postIndex].likes})`;
      }
    });

    // -------- Delete Button --------
    const deleteBtn = postDiv.querySelector(".delete-post-btn");
    deleteBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this post?")) {
        postDiv.remove();
        let posts = JSON.parse(localStorage.getItem("posts")) || [];
        posts = posts.filter((p) => p.date !== post.date);
        localStorage.setItem("posts", JSON.stringify(posts));
      }
    });

    // -------- Edit Button --------
    const editBtn = postDiv.querySelector(".edit-post-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        const titleEl = postDiv.querySelector(".post-title");
        const contentEl = postDiv.querySelector(".post-excerpt");
        const actionsEl = postDiv.querySelector(".post-actions");

        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.className = "edit-title-input";
        titleInput.value = post.title;

        const contentTextarea = document.createElement("textarea");
        contentTextarea.className = "edit-content-textarea";
        contentTextarea.rows = 6;
        contentTextarea.value = post.content;

        titleEl.replaceWith(titleInput);
        contentEl.replaceWith(contentTextarea);

        editBtn.style.display = "none";

        const saveBtn = document.createElement("button");
        saveBtn.className = "save-post-btn";
        saveBtn.innerText = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "cancel-post-btn";
        cancelBtn.innerText = "Cancel";

        actionsEl.appendChild(saveBtn);
        actionsEl.appendChild(cancelBtn);

        cancelBtn.addEventListener("click", () => {
          titleInput.replaceWith(createTitleElement(post.title));
          contentTextarea.replaceWith(createContentElement(post.content));
          saveBtn.remove();
          cancelBtn.remove();
          editBtn.style.display = "";
        });

        saveBtn.addEventListener("click", () => {
          const newTitle = titleInput.value.trim();
          const newContent = contentTextarea.value.trim();
          if (!newTitle || !newContent)
            return alert("Please provide title and content.");

          let posts = JSON.parse(localStorage.getItem("posts")) || [];
          const idx = posts.findIndex((p) => p.date === post.date);
          if (idx === -1) return alert("Post not found.");

          posts[idx].title = newTitle;
          posts[idx].content = newContent;
          posts[idx].edited = true;
          posts[idx].editedAt = new Date().toISOString();
          localStorage.setItem("posts", JSON.stringify(posts));

          titleInput.replaceWith(createTitleElement(newTitle));
          contentTextarea.replaceWith(createContentElement(newContent));
          saveBtn.remove();
          cancelBtn.remove();
          editBtn.style.display = "";

          const metaEl = postDiv.querySelector(".post-meta");
          if (metaEl && !metaEl.querySelector(".edited-badge")) {
            metaEl.insertAdjacentHTML(
              "beforeend",
              ' <span class="edited-badge">edited</span>'
            );
          }
        });
      });
    }
  }

  // helpers
  function createTitleElement(text) {
    const h = document.createElement("h3");
    h.className = "post-title";
    h.innerText = text;
    return h;
  }

  function createContentElement(text) {
    const p = document.createElement("p");
    p.className = "post-excerpt";
    p.innerText = text;
    return p;
  }

  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
