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

function showToast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

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

// REGISTER
$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("reg-username").value.trim();
  const email = $("reg-email").value.trim();
  const phone = $("reg-phone").value.trim();
  const password = $("reg-password").value;
  const confirm = $("reg-password-confirm").value;

  if (
    !username ||
    !isValidEmail(email) ||
    !isValidPhone(phone) ||
    password.length < 6 ||
    password !== confirm
  ) {
    showToast("Please fill all fields correctly");
    return;
  }

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    await userCred.user.updateProfile({ displayName: username });
    await db.collection("users").doc(userCred.user.uid).set({
      username,
      email,
      phone,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await userCred.user.sendEmailVerification();
    showToast("Registration successful! Verify your email before login.");
    $("register-form").reset();
  } catch (err) {
    if (err.code === "auth/email-already-in-use")
      showToast("Email already registered. Please login instead.");
    else showToast(err.message);
  }
});

// LOGIN
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("login-email").value.trim();
  const password = $("login-password").value;

  if (!isValidEmail(email) || password.length < 6) {
    showToast("Enter valid email and password");
    return;
  }

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    const user = userCred.user;

    if (!user.emailVerified) {
      await user.sendEmailVerification();
      showToast("Please verify your email before login. Verification sent.");
      await auth.signOut();
      return;
    }

    showToast("Login successful — redirecting...");
    $("login-form").reset();
    setTimeout(() => {
      window.location.href = "home.html";
    }, 1000);
  } catch (err) {
    showToast(err.message);
  }
});

// Forgot password
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
  if (!isValidEmail(email)) return showToast("Enter a valid email");

  try {
    await auth.sendPasswordResetEmail(email);
    showToast("Password reset link sent to your email");
    $("forgot-form").reset();
    $("forgot-box").style.display = "none";
    tabLogin.click();
  } catch (err) {
    showToast(err.message);
  }
});

// Auto redirect if already logged in
auth.onAuthStateChanged((user) => {
  if (user && user.emailVerified) {
    window.location.href = "home.html";
  }
});
