const firebaseConfig = {
  apiKey: "AIzaSyCLSnw7ouL7Yu4VCD-JDlgVmkAzkAC6_p4",
  authDomain: "cloud-storage-418bc.firebaseapp.com",
  projectId: "cloud-storage-418bc",
  storageBucket: "cloud-storage-418bc.firebasestorage.app",
  messagingSenderId: "427317055745",
  appId: "1:427317055745:web:53b85f9eb62c2a10890b00",
  measurementId: "G-NT8DNB8MWY",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function $(id) {
  return document.getElementById(id);
}

// ============================================
// IMPROVED TOAST MESSAGE SYSTEM
// ============================================

function showToast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;

  // Add icon based on type
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  el.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  document.getElementById("toast-container").appendChild(el);

  // Animate in
  setTimeout(() => el.classList.add("show"), 10);

  // Animate out and remove
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ============================================
// CUSTOM MODAL FOR ERRORS
// ============================================

function showErrorModal(title, message) {
  // Remove existing modal if any
  const existing = document.querySelector(".auth-modal-overlay");
  if (existing) existing.remove();

  // Create modal
  const overlay = document.createElement("div");
  overlay.className = "auth-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "auth-modal";
  modal.innerHTML = `
    <div class="modal-icon-large">❌</div>
    <h2 class="modal-title">${title}</h2>
    <p class="modal-message">${message}</p>
    <button class="modal-btn" onclick="this.closest('.auth-modal-overlay').remove()">
      OK
    </button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Animate in
  setTimeout(() => {
    overlay.classList.add("show");
    modal.classList.add("show");
  }, 10);

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("show");
      modal.classList.remove("show");
      setTimeout(() => overlay.remove(), 300);
    }
  });
}

function showSuccessModal(title, message, redirectUrl = null) {
  const existing = document.querySelector(".auth-modal-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "auth-modal-overlay";

  const modal = document.createElement("div");
  modal.className = "auth-modal";
  modal.innerHTML = `
    <div class="modal-icon-large">✅</div>
    <h2 class="modal-title">${title}</h2>
    <p class="modal-message">${message}</p>
    <button class="modal-btn modal-btn-success" onclick="this.closest('.auth-modal-overlay').remove()">
      ${redirectUrl ? "Continue" : "OK"}
    </button>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add("show");
    modal.classList.add("show");
  }, 10);

  const btn = modal.querySelector(".modal-btn");
  btn.addEventListener("click", () => {
    overlay.classList.remove("show");
    modal.classList.remove("show");
    setTimeout(() => {
      overlay.remove();
      if (redirectUrl) window.location.href = redirectUrl;
    }, 300);
  });
}

// Add modal styles dynamically
const modalStyles = document.createElement("style");
modalStyles.textContent = `
  .auth-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .auth-modal-overlay.show {
    opacity: 1;
  }
  
  .auth-modal {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    max-width: 450px;
    width: 90%;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: translateY(50px);
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .auth-modal.show {
    transform: translateY(0);
    opacity: 1;
  }
  
  .modal-icon-large {
    font-size: 72px;
    margin-bottom: 20px;
    animation: bounce 0.6s ease;
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  
  .modal-title {
    color: #fff;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 15px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .modal-message {
    color: rgba(255, 255, 255, 0.85);
    font-size: 15px;
    line-height: 1.8;
    margin-bottom: 30px;
    white-space: pre-line;
  }
  
  .modal-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 40px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    min-width: 120px;
  }
  
  .modal-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }
  
  .modal-btn-success {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }
  
  .modal-btn-success:hover {
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }
  
  /* Improved Toast Styles */
  .toast {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 15px;
    border-left: 4px solid #667eea;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease;
  }
  
  .toast.show {
    opacity: 1;
    transform: translateX(0);
  }
  
  .toast-success {
    border-left-color: #10b981;
    background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  }
  
  .toast-error {
    border-left-color: #ef4444;
    background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  }
  
  .toast-warning {
    border-left-color: #f59e0b;
    background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  }
  
  .toast-info {
    border-left-color: #3b82f6;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  }
  
  .toast-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .toast-message {
    flex: 1;
    line-height: 1.4;
  }
`;
document.head.appendChild(modalStyles);

// Tabs
const tabLogin = $("tab-login"),
  tabRegister = $("tab-register"),
  loginBox = $("login-box"),
  registerBox = $("register-box");

tabLogin.onclick = () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginBox.style.display = "block";
  registerBox.style.display = "none";
  $("forgot-box").style.display = "none";
};

tabRegister.onclick = () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerBox.style.display = "block";
  loginBox.style.display = "none";
  $("forgot-box").style.display = "none";
};

$("to-register").onclick = () => tabRegister.click();
$("to-login").onclick = () => tabLogin.click();

function togglePassword(inputId, eyeId) {
  const inp = $(inputId);
  const eye = $(eyeId);
  eye.addEventListener("click", () => {
    if (inp.type === "password") {
      inp.type = "text";
      eye.textContent = "🙈";
    } else {
      inp.type = "password";
      eye.textContent = "👁️";
    }
  });
}
togglePassword("login-password", "login-eye");
togglePassword("reg-password", "reg-eye");

$("reg-confirm-eye").addEventListener("click", function () {
  const confirmInput = $("reg-password-confirm");
  const type = confirmInput.type === "password" ? "text" : "password";
  confirmInput.type = type;
  this.textContent = type === "password" ? "👁️" : "🙈";
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^(\+\d{7,15}|0\d{8,9}|\d{10})$/.test(phone.replace(/\s+/g, ""));
}

// ============================================
// REGISTER WITH IMPROVED MESSAGES
// ============================================

$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("reg-username").value.trim();
  const email = $("reg-email").value.trim();
  const phone = $("reg-phone").value.trim();
  const password = $("reg-password").value;
  const confirm = $("reg-password-confirm").value;

  if (!username) {
    showToast("Username is required", "warning");
    return;
  }

  if (!isValidEmail(email)) {
    showToast("Please enter a valid email address", "warning");
    return;
  }

  if (!isValidPhone(phone)) {
    showToast("Please enter a valid phone number", "warning");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "warning");
    return;
  }

  if (password !== confirm) {
    showToast("Passwords do not match", "warning");
    return;
  }

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await userCred.user.updateProfile({ displayName: username });

    // Try to save to Firestore, but don't fail registration if it doesn't work
    try {
      await db.collection("users").doc(userCred.user.uid).set({
        username,
        email,
        phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (firestoreError) {
      console.warn(
        "Firestore save failed, but registration succeeded:",
        firestoreError
      );
      // Continue anyway - user is still registered in Auth
    }

    await userCred.user.sendEmailVerification();

    // Show success modal with callback to switch to login
    showSuccessModal(
      "Registration Successful! 🎉",
      "Your account has been created successfully!\n\nA verification email has been sent to:\n" +
        email +
        "\n\nPlease verify your email before logging in."
    );

    // Clear form
    $("register-form").reset();

    // Switch to login tab after modal closes
    setTimeout(() => {
      tabLogin.click();
      showToast("Please check your email to verify your account", "info");
    }, 2000);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      showErrorModal(
        "Email Already Registered",
        "This email is already associated with an account. Please login instead or use a different email address."
      );
    } else if (err.code === "auth/weak-password") {
      showErrorModal(
        "Weak Password",
        "Please choose a stronger password with at least 6 characters."
      );
    } else if (err.code === "auth/invalid-email") {
      showErrorModal("Invalid Email", "Please enter a valid email address.");
    } else {
      showErrorModal("Registration Failed", err.message);
    }
  }
});

// ============================================
// LOGIN WITH IMPROVED MESSAGES
// ============================================

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("login-email").value.trim();
  const password = $("login-password").value;

  if (!isValidEmail(email)) {
    showToast("Please enter a valid email address", "warning");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "warning");
    return;
  }

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    const user = userCred.user;

    if (!user.emailVerified) {
      await user.sendEmailVerification();
      showErrorModal(
        "Email Not Verified",
        "Please verify your email before logging in. A new verification link has been sent to " +
          email
      );
      await auth.signOut();
      return;
    }

    // Show success toast
    showToast("Login successful! Redirecting...", "success");

    $("login-form").reset();

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1500);
  } catch (err) {
    // Handle specific error codes
    if (err.code === "auth/user-not-found") {
      showErrorModal(
        "Account Not Found",
        "No account exists with this email address. Please check your email or create a new account."
      );
    } else if (err.code === "auth/wrong-password") {
      showErrorModal(
        "Incorrect Password",
        "The password you entered is incorrect. Please try again or use 'Forgot Password' to reset it."
      );
    } else if (err.code === "auth/invalid-email") {
      showErrorModal("Invalid Email", "Please enter a valid email address.");
    } else if (err.code === "auth/user-disabled") {
      showErrorModal(
        "Account Disabled",
        "This account has been disabled. Please contact support for assistance."
      );
    } else if (err.code === "auth/too-many-requests") {
      showErrorModal(
        "Too Many Attempts",
        "Too many unsuccessful login attempts. Please try again later or reset your password."
      );
    } else if (err.code === "auth/invalid-credential") {
      showErrorModal(
        "Invalid Credentials",
        "The email or password you entered is incorrect. Please check your credentials and try again."
      );
    } else {
      showErrorModal("Login Failed", err.message);
    }
  }
});

// ============================================
// FORGOT PASSWORD WITH IMPROVED MESSAGES
// ============================================

$("forgot-link").onclick = () => {
  $("forgot-box").style.display = "block";
  $("register-box").style.display = "none";
  $("login-box").style.display = "none";
};

$("forgot-cancel").onclick = () => {
  $("forgot-box").style.display = "none";
  tabLogin.click();
};

$("forgot-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("forgot-email").value.trim();

  if (!isValidEmail(email)) {
    showToast("Please enter a valid email address", "warning");
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);

    showSuccessModal(
      "Password Reset Email Sent! 📧",
      "A password reset link has been sent to " +
        email +
        ". Please check your inbox and follow the instructions."
    );

    $("forgot-form").reset();
    $("forgot-box").style.display = "none";
    tabLogin.click();
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      showErrorModal(
        "Email Not Found",
        "No account exists with this email address. Please check your email or create a new account."
      );
    } else if (err.code === "auth/invalid-email") {
      showErrorModal("Invalid Email", "Please enter a valid email address.");
    } else {
      showErrorModal("Password Reset Failed", err.message);
    }
  }
});

// Auto redirect if already logged in
auth.onAuthStateChanged((user) => {
  if (user && user.emailVerified) {
    window.location.href = "home.html";
  }
});
