import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

import { deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// 🔧 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCLSnw7ouL7Yu4VCD-JDlgVmkAzkAC6_p4",
  authDomain: "cloud-storage-418bc.firebaseapp.com",
  projectId: "cloud-storage-418bc",
  storageBucket: "cloud-storage-418bc.firebasestorage.app",
  messagingSenderId: "427317055745",
  appId: "1:427317055745:web:53b85f9eb62c2a10890b00",
  measurementId: "G-NT8DNB8MWY",
};

// 🔐 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
    await ensureKeyPair(); // auto generate keys if not exist
    loadFiles();
  } else {
    window.location.href = "index.html";
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    alert("Logged out successfully!");
    window.location.href = "index.html";
  });
});

// 🧠 Auto-generate or load existing RSA keys
async function ensureKeyPair() {
  if (localStorage.getItem("privateKey")) return;

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const priv = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const pub = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  localStorage.setItem(
    "privateKey",
    btoa(String.fromCharCode(...new Uint8Array(priv)))
  );
  localStorage.setItem(
    "publicKey",
    btoa(String.fromCharCode(...new Uint8Array(pub)))
  );
  console.log("✅ RSA key pair created and stored locally.");
}

async function loadKeyPair() {
  const priv = Uint8Array.from(atob(localStorage.getItem("privateKey")), (c) =>
    c.charCodeAt(0)
  );
  const pub = Uint8Array.from(atob(localStorage.getItem("publicKey")), (c) =>
    c.charCodeAt(0)
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    priv,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );

  const publicKey = await crypto.subtle.importKey(
    "spki",
    pub,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  return { privateKey, publicKey };
}

// --- FILE UPLOAD ---
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Please select a file.");
  const user = auth.currentUser;

  const status = document.getElementById("statusMsg");
  status.textContent = "Encrypting & uploading...";
  const keyPair = await loadKeyPair();

  try {
    // AES key
    const aesKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      fileBuffer
    );

    // Encrypt AES key with user's RSA public key
    const rawAES = await crypto.subtle.exportKey("raw", aesKey);
    const encAES = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      keyPair.publicKey,
      rawAES
    );

    // Combine
    const combinedBlob = new Blob([iv, encAES, encryptedData]);

    const storageRef = ref(storage, `uploads/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, combinedBlob);

    status.textContent = "✅ File uploaded securely!";
    loadFiles();
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Upload failed.";
  }
});

// --- LOAD FILES ---
async function loadFiles() {
  const user = auth.currentUser;
  const folderRef = ref(storage, `uploads/${user.uid}`);
  const list = await listAll(folderRef);
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  for (const item of list.items) {
    const li = document.createElement("li");
    li.textContent = item.name;

    const decryptBtn = document.createElement("button");
    decryptBtn.classList.add("icon-btn");
    decryptBtn.innerHTML = `<i class="fa-solid fa-download"></i>`;
    decryptBtn.title = "Download";
    decryptBtn.addEventListener("click", async () => decryptAndDownload(item));

    const shareBtn = document.createElement("button");
    shareBtn.classList.add("icon-btn");
    shareBtn.innerHTML = `<i class="fa-solid fa-share-nodes"></i>`;
    shareBtn.title = "Share";
    shareBtn.addEventListener("click", async () => shareFile(item));

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("icon-btn");
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    deleteBtn.title = "Delete";
    deleteBtn.addEventListener("click", async () => deleteFile(item));

    const buttonGroup = document.createElement("div");
    buttonGroup.appendChild(decryptBtn);
    buttonGroup.appendChild(shareBtn);
    buttonGroup.appendChild(deleteBtn);

    li.textContent = item.name;
    li.appendChild(buttonGroup);
    fileList.appendChild(li);
  }
}

// --- DECRYPT & DOWNLOAD ---
async function decryptAndDownload(item) {
  const status = document.getElementById("statusMsg");
  status.textContent = "🔓 Decrypting file...";

  try {
    const url = await getDownloadURL(item);
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();

    // --- Split Encrypted File ---
    const iv = new Uint8Array(buffer.slice(0, 12)); // AES IV (12 bytes)
    const rsaKeySize = 256; // 2048-bit RSA → 256 bytes
    const encryptedAESKey = buffer.slice(12, 12 + rsaKeySize);
    const encryptedData = buffer.slice(12 + rsaKeySize);

    // --- Load RSA Private Key ---
    const { privateKey } = await loadKeyPair();

    // --- Decrypt AES Key ---
    const rawAESKey = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAESKey
    );

    // --- Import AES Key ---
    const aesKey = await crypto.subtle.importKey(
      "raw",
      rawAESKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // --- Decrypt File Data ---
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedData
    );

    // --- Download Decrypted File ---
    const blob = new Blob([decrypted]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = item.name.replace(".enc", ""); // optional rename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    status.textContent = "✅ File decrypted and downloaded!";
  } catch (err) {
    console.error("Decryption error:", err);
    status.textContent = "❌ Decryption failed (wrong key or corrupted file).";
    alert(
      "❌ Decryption failed. Make sure you’re using the same account that uploaded it."
    );
  }
}

async function regenerateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exportedPrivate = await crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey
  );
  const exportedPublic = await crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey
  );
  localStorage.setItem("rsa_private_key", JSON.stringify(exportedPrivate));
  localStorage.setItem("rsa_public_key", JSON.stringify(exportedPublic));
  alert("🔑 New RSA key pair generated!");
}
regenerateKeyPair();

// --- Delete FILE ---
async function deleteFile(item) {
  const confirmDelete = confirm(
    `Are you sure you want to delete "${item.name}"?`
  );
  if (!confirmDelete) return;

  try {
    await deleteObject(item);
    alert("✅ File deleted successfully!");
    loadFiles(); // refresh file list
  } catch (err) {
    console.error("Error deleting file:", err);
    alert("❌ Failed to delete file. Try again.");
  }
}

// --- SHARE FILE ---
let currentSharePassword = null;
let currentShareURL = null;

// When user sets password
document.getElementById("setSharePasswordBtn").addEventListener("click", () => {
  const passwordInput = document.getElementById("sharePassword");
  const password = passwordInput.value.trim();

  if (!password) return alert("Please enter a password.");
  currentSharePassword = password;
  document.getElementById("shareOptions").style.display = "block";
  alert("✅ Password set! Now choose a file to share.");
});

// When file’s share button is clicked
async function shareFile(item) {
  if (!currentSharePassword) {
    alert("⚠️ Please set a share password first.");
    return;
  }

  const url = await getDownloadURL(item);
  const encryptedLink = btoa(`${url}||${currentSharePassword}`);
  currentShareURL = `${url}?auth=${btoa(currentSharePassword)}`;

  document.getElementById("shareLink").textContent = currentShareURL;
  alert("✅ Link generated. Click 'Copy Share Link' to copy it.");
}

// Copy link button
document.getElementById("copyShareLinkBtn").addEventListener("click", () => {
  if (!currentShareURL) return alert("No share link generated yet!");
  navigator.clipboard.writeText(currentShareURL);
  alert("📋 Share link copied to clipboard!");

  // Share via Email button
  document.getElementById("shareEmailBtn").addEventListener("click", () => {
    if (!currentShareURL) return alert("No share link generated yet!");

    const subject = encodeURIComponent("Secure File Share 🔒");
    const body = encodeURIComponent(
      `Here’s your secure file:\n\n${currentShareURL}\n\nPassword: ${currentSharePassword}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });
});
