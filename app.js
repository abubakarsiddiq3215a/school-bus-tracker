/* ============================================
   app.js — Shared logic for School Bus Tracker
   ============================================ */

// ─── Firebase Configuration ──────────────────────────────────────
// 🔧 REPLACE the values below with your own Firebase project config.
//    Go to Firebase Console → Project Settings → General → Your apps → Web app
//    Copy the firebaseConfig object and paste it here.

const firebaseConfig = {
  apiKey: "AIzaSyDLU81lWNqyZUlfcb1rK8Z2YkbCevH9FA4",
  authDomain: "school-bus-tracker-2d0f9.firebaseapp.com",
  projectId: "school-bus-tracker-2d0f9",
  storageBucket: "school-bus-tracker-2d0f9.firebasestorage.app",
  messagingSenderId: "781204865210",
  appId: "1:781204865210:web:52ff2359bd9d28888b8283"
};

// Initialize Firebase (compat SDK — beginner-friendly)
firebase.initializeApp(firebaseConfig);

// Shortcuts for Firebase services
const auth = firebase.auth();
const db   = firebase.firestore();

// ─── Toast Notification System ───────────────────────────────────

/**
 * Show a toast notification.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'|'warning'} type - Toast type
 * @param {number} duration - Auto-dismiss time in ms (default 3500)
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Pick icon based on type
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;

  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ─── Loader ──────────────────────────────────────────────────────

/** Show the full-screen loading spinner */
function showLoader() {
  const el = document.getElementById('loader');
  if (el) el.classList.remove('hidden');
}

/** Hide the loading spinner */
function hideLoader() {
  const el = document.getElementById('loader');
  if (el) el.classList.add('hidden');
}

// ─── Auth Guard ──────────────────────────────────────────────────

/**
 * Ensure the current user is logged in and has the required role.
 * If not, redirect to login page.
 * @param {string} requiredRole - 'driver', 'parent', or 'admin'
 * @returns {Promise<{user: object, userData: object}>}
 */
function requireAuth(requiredRole) {
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        // Not logged in — redirect to login
        window.location.href = 'index.html';
        reject(new Error('Not authenticated'));
        return;
      }

      try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (!doc.exists) {
          showToast('User profile not found. Contact admin.', 'error');
          await auth.signOut();
          window.location.href = 'index.html';
          reject(new Error('No profile'));
          return;
        }

        const userData = doc.data();

        if (userData.role !== requiredRole) {
          showToast('Access denied. Wrong role.', 'error');
          await auth.signOut();
          window.location.href = 'index.html';
          reject(new Error('Wrong role'));
          return;
        }

        resolve({ user, userData });
      } catch (err) {
        showToast('Error verifying account.', 'error');
        reject(err);
      }
    });
  });
}

// ─── Logout ──────────────────────────────────────────────────────

/**
 * Sign out the current user and redirect to login.
 */
async function logout() {
  try {
    await auth.signOut();
    window.location.href = 'index.html';
  } catch (err) {
    showToast('Error signing out.', 'error');
  }
}

// ─── Utility: Format coordinates ─────────────────────────────────

/**
 * Format lat/lng to a readable string.
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
function formatCoords(lat, lng) {
  if (lat == null || lng == null) return 'N/A';
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// ─── Utility: Timestamp formatter ────────────────────────────────

/**
 * Format a Firestore timestamp or JS Date to readable string.
 * @param {object} timestamp - Firestore Timestamp or Date
 * @returns {string}
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
}
