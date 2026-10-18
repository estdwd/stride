// --- 1. SESSION & LOGIN CHECK ---
const USER_KEY = 'stride_user';
const LAST_ACTIVE_KEY = 'stride_last_active';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

function checkAuth() {
  const user = localStorage.getItem(USER_KEY);
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  const now = Date.now();
  
  // If no user, or it's been more than 30 days, force login
  if (!user || !lastActive || (now - lastActive > THIRTY_DAYS)) {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    
    // If we are on app.html, kick them to login
    if (window.location.pathname.includes('app.html')) {
      window.location.href = 'index.html';
    }
  } else {
    // Update the last active time
    localStorage.setItem(LAST_ACTIVE_KEY, now);
    
    // If we are on index.html but logged in, skip to app
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      window.location.href = 'app.html';
    }
  }
}

// Run check immediately
checkAuth();

// --- 2. APP LOGIC (Runs only on app.html) ---
document.addEventListener('DOMContentLoaded', () => {
  // Load User Data into UI
  const user = JSON.parse(localStorage.getItem(USER_KEY));
  if (user) {
    // Home Page
    if (document.getElementById('user-greeting')) {
      document.getElementById('user-greeting').innerText = `Hello, ${user.name.split(' ')[0]}`;
      document.getElementById('user-avatar').innerText = user.name.charAt(0).toUpperCase();
      document.getElementById('user-id-display').innerText = `ID: ${user.id}`;
    }
    // Profile Page
    if (document.getElementById('profile-name')) {
      document.getElementById('profile-name').innerText = user.name;
      document.getElementById('profile-email').innerText = user.email;
      document.getElementById('profile-id').innerText = user.id;
      document.getElementById('profile-course').innerText = user.course;
      document.getElementById('profile-phone').innerText = user.phone;
      document.getElementById('profile-avatar').innerText = user.name.charAt(0).toUpperCase();
    }
  }
  
  // Initialize Icons
  lucide.createIcons();
  
  // --- SMOOTH TAB SWITCHING ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const pages = document.querySelectorAll('.page');
  
  navBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const currentActivePage = document.querySelector('.page.active');
      
      if (currentActivePage && currentActivePage.id === targetId) return;
      
      // Remove active state from all buttons and pages
      navBtns.forEach(b => b.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));
      
      // Set new active state (CSS handles the smooth fade/slide)
      btn.classList.add('active');
      document.getElementById(targetId).classList.add('active');
    });
  });
});

// Logout function
function logout() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
  window.location.href = 'index.html';
}