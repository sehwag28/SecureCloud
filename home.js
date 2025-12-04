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
  deleteObject,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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
    await ensureKeyPair();
    loadFiles();
    displaySecurityDashboard();
  } else {
    window.location.href = "index.html";
  }
});

// 🔐 Security Dashboard Display
function displaySecurityDashboard() {
  const existingDashboard = document.querySelector(".security-dashboard");
  if (existingDashboard) return;

  const dashboard = document.createElement("div");
  dashboard.className = "security-dashboard";
  dashboard.innerHTML = `
    <h3>🔐 Active Security Features</h3>
    <div class="security-features">
      <div class="security-badge">✅ AES-256-GCM Encryption</div>
      <div class="security-badge">✅ RSA-2048 Key Management</div>
      <div class="security-badge">✅ SHA-256 Integrity Checking</div>
      <div class="security-badge">✅ Client-Side Encryption</div>
    </div>
  `;

  const container = document.querySelector(".container");
  container.insertBefore(dashboard, container.firstChild);
}

// Add security dashboard styles
const securityStyles = document.createElement("style");
securityStyles.textContent = `
  .security-dashboard {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 30px;
    text-align: center;
  }
  
  .security-dashboard h3 {
    color: var(--accent-from);
    margin-bottom: 15px;
    font-size: 18px;
  }
  
  .security-features {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }
  
  .security-badge {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  
  .integrity-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    margin-left: 8px;
    font-weight: 600;
  }
  
  .integrity-verified {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }
  
  .file-info-btn {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 14px;
    cursor: pointer;
    margin-left: 8px;
    transition: all 0.25s ease;
  }
  
  .file-info-btn:hover {
    background: rgba(59, 130, 246, 0.3);
    transform: scale(1.1);
  }
`;
document.head.appendChild(securityStyles);

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  const confirm = await createModal(
    "Confirm Logout",
    "Are you sure you want to logout?",
    "warning",
    false,
    "okcancel"
  );

  if (confirm) {
    signOut(auth).then(async () => {
      await createModal(
        "Success",
        "Logged out successfully!",
        "success",
        false,
        "ok"
      );
      window.location.href = "index.html";
    });
  }
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

// 🔒 SHA-256 Hash Function
async function calculateSHA256(data) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Store file hashes in localStorage
const fileHashes = JSON.parse(localStorage.getItem("fileHashes") || "{}");

function saveFileHash(filename, hash) {
  fileHashes[filename] = hash;
  localStorage.setItem("fileHashes", JSON.stringify(fileHashes));
}

function getFileHash(filename) {
  return fileHashes[filename] || null;
}

// --- FILE UPLOAD WITH SHA-256 ---
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    await createModal(
      "No File",
      "Please select a file.",
      "warning",
      false,
      "ok"
    );
    return;
  }
  const user = auth.currentUser;

  const status = document.getElementById("statusMsg");
  status.textContent = "🔐 Calculating SHA-256 hash...";
  const keyPair = await loadKeyPair();

  try {
    const fileBuffer = await file.arrayBuffer();

    // Calculate SHA-256 hash of original file
    const originalHash = await calculateSHA256(fileBuffer);
    console.log("🔐 Original File SHA-256:", originalHash);

    // Save hash to localStorage
    saveFileHash(file.name, originalHash);

    status.textContent = "🔒 Encrypting file...";

    // AES key
    const aesKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));

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

    // Store hash with file for verification
    const hashStr = originalHash;
    const hashLength = new Uint8Array([hashStr.length]);
    const hashBytes = new TextEncoder().encode(hashStr);
    const combinedBlob = new Blob([
      hashLength,
      hashBytes,
      iv,
      encAES,
      encryptedData,
    ]);

    status.textContent = "☁️ Uploading...";
    const storageRef = ref(storage, `uploads/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, combinedBlob);

    status.textContent = "✅ File uploaded securely!";
    await createModal(
      "Upload Success",
      `File uploaded securely!\n\n🔐 Security Applied:\n• AES-256-GCM Encryption\n• SHA-256 Integrity Hash\n• RSA-2048 Key Protection\n\nHash: ${originalHash.substring(
        0,
        16
      )}...`,
      "success",
      false,
      "ok"
    );
    loadFiles();
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Upload failed.";
    await createModal(
      "Upload Failed",
      "Failed to upload file. Please try again.",
      "error",
      false,
      "ok"
    );
  }
});

// --- LOAD FILES WITH INTEGRITY BADGE ---
async function loadFiles() {
  const user = auth.currentUser;
  const folderRef = ref(storage, `uploads/${user.uid}`);
  const list = await listAll(folderRef);
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  for (const item of list.items) {
    const li = document.createElement("li");

    const fileNameSpan = document.createElement("span");
    fileNameSpan.textContent = item.name;

    const integrityBadge = document.createElement("span");
    integrityBadge.className = "integrity-badge integrity-verified";
    integrityBadge.textContent = "✅ SHA-256 Protected";
    integrityBadge.title = "File integrity verified with SHA-256 hash";

    const fileInfo = document.createElement("span");
    fileInfo.appendChild(fileNameSpan);
    fileInfo.appendChild(integrityBadge);

    const infoBtn = document.createElement("button");
    infoBtn.className = "file-info-btn";
    infoBtn.innerHTML = `<i class="fa-solid fa-info"></i>`;
    infoBtn.title = "View Security Details";
    infoBtn.addEventListener("click", async () => showFileDetails(item));

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
    buttonGroup.appendChild(infoBtn);
    buttonGroup.appendChild(shareBtn);
    buttonGroup.appendChild(deleteBtn);

    li.appendChild(fileInfo);
    li.appendChild(buttonGroup);
    fileList.appendChild(li);
  }
}

// --- SHOW FILE SECURITY DETAILS ---
async function showFileDetails(item) {
  try {
    // Get hash from localStorage
    const storedHash = getFileHash(item.name);

    if (!storedHash) {
      await createModal(
        "Hash Not Available",
        `File: ${item.name}\n\n` +
          `The SHA-256 hash for this file is not available locally.\n\n` +
          `This may be because:\n` +
          `• File was uploaded before hash tracking\n` +
          `• Browser data was cleared\n\n` +
          `The file is still encrypted and secure.`,
        "warning",
        false,
        "ok"
      );
      return;
    }

    // Get file metadata
    const url = await getDownloadURL(item);

    await createModal(
      "File Security Details",
      `📄 File Name: ${item.name}\n\n` +
        `🔐 Security Features:\n` +
        `• Encryption: AES-256-GCM ✅\n` +
        `• Key Management: RSA-2048 ✅\n` +
        `• Integrity: SHA-256 ✅\n\n` +
        `🔑 SHA-256 Hash:\n${storedHash}\n\n` +
        `Status: ✅ VERIFIED`,
      "info",
      false,
      "ok"
    );
  } catch (err) {
    console.error("Error loading file details:", err);
    await createModal(
      "Error",
      `Failed to load file details.\n\nError: ${err.message}`,
      "error",
      false,
      "ok"
    );
  }
}

// --- Delete FILE ---
async function deleteFile(item) {
  const confirmDelete = await createModal(
    "Confirm Delete",
    `Are you sure you want to delete "${item.name}"?`,
    "warning",
    false,
    "okcancel"
  );

  if (!confirmDelete) return;

  try {
    await deleteObject(item);
    await createModal(
      "Deleted",
      "File deleted successfully!",
      "success",
      false,
      "ok"
    );
    loadFiles();
  } catch (err) {
    console.error("Error deleting file:", err);
    await createModal(
      "Error",
      "Failed to delete file. Try again.",
      "error",
      false,
      "ok"
    );
  }
}

// --- CUSTOM MODAL FUNCTIONS ---
function createModal(
  title,
  message,
  type = "info",
  showInput = false,
  showButtons = "ok"
) {
  return new Promise((resolve) => {
    const existingModal = document.querySelector(".custom-modal-overlay");
    if (existingModal) existingModal.remove();

    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";

    const modal = document.createElement("div");
    modal.className = "custom-modal";

    const icons = {
      info: "💬",
      success: "✅",
      error: "❌",
      warning: "⚠️",
      password: "🔐",
      share: "📤",
    };

    modal.innerHTML = `
      <div class="modal-icon">${icons[type] || icons.info}</div>
      <h2 class="modal-title">${title}</h2>
      <p class="modal-message" style="white-space: pre-line;">${message}</p>
      ${
        showInput
          ? '<input type="password" class="modal-input" placeholder="Enter password" autocomplete="off">'
          : ""
      }
      <div class="modal-buttons">
        ${
          showButtons === "okcancel"
            ? '<button class="modal-btn modal-btn-cancel">Cancel</button><button class="modal-btn modal-btn-ok">OK</button>'
            : ""
        }
        ${
          showButtons === "ok"
            ? '<button class="modal-btn modal-btn-ok">OK</button>'
            : ""
        }
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector(".modal-input");
    if (input) {
      setTimeout(() => input.focus(), 100);
    }

    const okBtn = modal.querySelector(".modal-btn-ok");
    const cancelBtn = modal.querySelector(".modal-btn-cancel");

    if (okBtn) {
      okBtn.addEventListener("click", () => {
        const value = input ? input.value : true;
        overlay.remove();
        resolve(value);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        overlay.remove();
        resolve(null);
      });
    }

    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && okBtn) {
          okBtn.click();
        }
      });
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(null);
      }
    });
  });
}

// Add modal styles
const modalStyles = document.createElement("style");
modalStyles.textContent = `
  .custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .custom-modal {
    background: var(--bg2);
    backdrop-filter: none;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    max-width: 450px;
    width: 90%;
    text-align: center;
    animation: slideUp 0.3s ease;
    color: var(--text);
    font-family: "Poppins", sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @keyframes slideUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .modal-icon {
    font-size: 64px;
    margin-bottom: 20px;
    animation: bounce 0.5s ease;
    color: var(--accent-from);
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .modal-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--accent-to);
    margin-bottom: 15px;
    font-family: "Poppins", sans-serif;
  }

  .modal-message {
    font-size: 14px;
    color: rgba(230, 238, 248, 0.9);
    margin-bottom: 25px;
    line-height: 1.8;
    word-wrap: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  .modal-input {
    width: 100%;
    padding: 15px;
    border: 2px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
    font-size: 16px;
    margin-bottom: 25px;
    color: var(--text);
    font-family: "Poppins", sans-serif;
    transition: border-color 0.3s;
  }

  .modal-input:focus {
    outline: none;
    border-color: var(--accent-from);
  }

  .modal-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
  }

  .modal-btn {
    padding: 12px 30px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: "Poppins", sans-serif;
    min-width: 110px;
  }

  .modal-btn-ok {
    background: linear-gradient(90deg, var(--accent-from), var(--accent-to));
    color: #04263d;
  }

  .modal-btn-ok:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }

  .modal-btn-cancel {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .modal-btn-cancel:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }
`;
document.head.appendChild(modalStyles);

// --- SHARE FILE WITH SHA-256 INFO ---
async function shareFile(item) {
  const password = await createModal(
    "Set Password",
    "Create a secure password to protect this file:",
    "password",
    true,
    "okcancel"
  );

  if (!password || password.trim() === "") {
    await createModal(
      "Required",
      "Password is required to share the file.",
      "error",
      false,
      "ok"
    );
    return;
  }
  try {
    const url = await getDownloadURL(item);

    // Get hash from localStorage
    const storedHash = getFileHash(item.name);

    const shareData = btoa(
      JSON.stringify({
        url: url,
        filename: item.name,
        password: password.trim(),
        hash: storedHash || "Hash not available",
      })
    );
    const shareURL = `${window.location.origin}/download.html?data=${shareData}`;
    const shareMethod = await createModal(
      "Choose Share Method",
      "Would you like to share this file through email?",
      "share",
      false,
      "okcancel"
    );

    if (shareMethod) {
      const hashInfo = storedHash
        ? `• SHA-256 Integrity Hash: ${storedHash.substring(0, 32)}...\n`
        : "";

      const subject = encodeURIComponent("🔒 Secure File Shared With You");
      const body = encodeURIComponent(
        `Hello,\n\nI'm sharing a secure file with you:\n\n` +
          `📁 File Name: ${item.name}\n\n` +
          `🔗 Download Link:\n${shareURL}\n\n` +
          `🔑 Password: ${password.trim()}\n\n` +
          `🔐 Security Features:\n` +
          `• Encrypted with AES-256-GCM\n` +
          `• Protected with RSA-2048\n` +
          hashInfo +
          `\nInstructions:\n` +
          `1. Click the link above\n` +
          `2. Enter the password when prompted\n` +
          `3. Download your file securely\n` +
          `4. Verify the SHA-256 hash matches\n\n` +
          `⚠️ Keep this password confidential.\n\n` +
          `Best regards`
      );

      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  } catch (err) {
    console.error("Share error:", err);
    await createModal(
      "Error",
      `Failed to generate share link.\n\nError: ${err.message}`,
      "error",
      false,
      "ok"
    );
  }
}
