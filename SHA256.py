"""
SHA-256 File Integrity Checker with Flask
==========================================
This demo application shows how SHA-256 hashing works for file integrity verification.
It complements your JavaScript cloud storage system by demonstrating server-side hashing.

NEW: Can be integrated with JavaScript frontend via CORS-enabled API

Requirements:
    pip install flask flask-cors

Run this file:
    python app.py

Then visit: http://localhost:5000
"""

from flask import Flask, request, render_template_string, jsonify
import hashlib
import os
from datetime import datetime

# Initialize Flask application
app = Flask(__name__)

# NEW: Enable CORS so JavaScript can call this API
app, resources={
    r"/api/*": {
        "origins": ["http://127.0.0.1:5500", "http://localhost:5500"],  # Your JS dev server
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
}

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# SHA-256 HASHING FUNCTIONS

def calculate_sha256(file_path):
    """
    Calculate SHA-256 hash of a file.
    
    This function reads the file in chunks (to handle large files efficiently)
    and calculates its SHA-256 hash.
    
    Args:
        file_path (str): Path to the file
    
    Returns:
        str: Hexadecimal SHA-256 hash string
    
    How it works:
        1. Creates a SHA-256 hash object
        2. Reads file in 8KB chunks (memory efficient)
        3. Updates hash with each chunk
        4. Returns final hash as hex string
    """
    sha256_hash = hashlib.sha256()  # Create hash object
    
    # Read file in chunks to handle large files
    with open(file_path, "rb") as f:
        # Read file in 8KB chunks
        for byte_block in iter(lambda: f.read(8192), b""):
            sha256_hash.update(byte_block)  # Update hash with each chunk
    
    # Return hash as hexadecimal string
    return sha256_hash.hexdigest()


def calculate_sha256_from_bytes(file_bytes):
    """
    Calculate SHA-256 hash directly from file bytes.
    
    Useful when you have file data in memory (like from web uploads).
    
    Args:
        file_bytes (bytes): File content as bytes
    
    Returns:
        str: Hexadecimal SHA-256 hash string
    """
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_bytes)
    return sha256_hash.hexdigest()

def verify_file_integrity(file_path, expected_hash):
    """
    Verify if a file's hash matches the expected hash.
    
    This is the core of integrity checking - if even one bit changes,
    the hash will be completely different.
    
    Args:
        file_path (str): Path to file to check
        expected_hash (str): The hash we expect
    
    Returns:
        bool: True if hashes match, False otherwise
    """
    current_hash = calculate_sha256(file_path)
    return current_hash == expected_hash

# DEMONSTRATION FUNCTIONS

def demonstrate_sha256():
    """
    Demonstrate how SHA-256 works with sample data.
    Shows how even tiny changes produce completely different hashes.
    
    Returns:
        dict: Dictionary with demonstration results
    """
    # Sample text data
    text1 = "Hello World"
    text2 = "Hello World!"  # Just added one character
    text3 = "hello world"   # Just changed case
    
    # Calculate hashes
    hash1 = hashlib.sha256(text1.encode()).hexdigest()
    hash2 = hashlib.sha256(text2.encode()).hexdigest()
    hash3 = hashlib.sha256(text3.encode()).hexdigest()
    
    return {
        'original': {'text': text1, 'hash': hash1},
        'added_char': {'text': text2, 'hash': hash2},
        'case_change': {'text': text3, 'hash': hash3},
        'explanation': 'Notice how tiny changes produce completely different hashes!'
    }

# FLASK ROUTES (WEB INTERFACE)
# HTML Template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>SHA-256 File Integrity Checker</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .section h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .demo-item {
            margin: 15px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
        }
        .hash-display {
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            background: #333;
            color: #0f0;
            padding: 10px;
            border-radius: 5px;
            margin-top: 5px;
        }
        input[type="file"] {
            margin: 10px 0;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            width: 100%;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            margin-top: 10px;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }
        .result.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .result.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        .badge.match {
            background: #28a745;
            color: white;
        }
        .badge.different {
            background: #dc3545;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 SHA-256 File Integrity Checker</h1>
        <p class="subtitle">Demonstration of SHA-256 hashing for file integrity verification</p>

        <!-- Demo Section -->
        <div class="section">
            <h2>📚 How SHA-256 Works</h2>
            <p style="margin-bottom: 15px;">SHA-256 creates a unique "fingerprint" for any data. Even tiny changes produce completely different hashes:</p>
            
            <div class="demo-item">
                <strong>Original:</strong> "Hello World"
                <div class="hash-display">2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f2</div>
            </div>
            
            <div class="demo-item">
                <strong>Added "!":</strong> "Hello World!"
                <div class="hash-display">7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</div>
                <span class="badge different">Completely Different!</span>
            </div>
            
            <div class="demo-item">
                <strong>Lowercase:</strong> "hello world"
                <div class="hash-display">b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9</div>
                <span class="badge different">Completely Different!</span>
            </div>
        </div>

        <!-- Upload and Hash Section -->
        <div class="section">
            <h2>📁 Upload File & Calculate Hash</h2>
            <p style="margin-bottom: 15px;">Upload any file to calculate its SHA-256 hash:</p>
            
            <form id="uploadForm" enctype="multipart/form-data">
                <input type="file" id="fileInput" name="file" required>
                <button type="submit">Calculate SHA-256 Hash</button>
            </form>
            
            <div id="uploadResult" class="result"></div>
        </div>

        <!-- Verify Section -->
        <div class="section">
            <h2>✅ Verify File Integrity</h2>
            <p style="margin-bottom: 15px;">Upload a file and its expected hash to verify integrity:</p>
            
            <form id="verifyForm" enctype="multipart/form-data">
                <input type="file" id="verifyFileInput" name="file" required>
                <input type="text" id="expectedHash" name="expected_hash" 
                       placeholder="Enter expected SHA-256 hash" 
                       style="width: 100%; padding: 10px; margin: 10px 0; border: 2px solid #ddd; border-radius: 5px;">
                <button type="submit">Verify Integrity</button>
            </form>
            
            <div id="verifyResult" class="result"></div>
        </div>

        <!-- Connection to Your System -->
        <div class="section" style="border-left-color: #28a745;">
            <h2>🔗 How This Relates to Your Cloud Storage</h2>
            <p style="line-height: 1.8;">
                Your JavaScript system does this <strong>client-side</strong> (in the browser):<br><br>
                
                <strong>1. Upload:</strong> Calculate hash of original file → Encrypt file → Store both<br>
                <strong>2. Download:</strong> Decrypt file → Calculate hash → Compare with stored hash<br>
                <strong>3. Match?</strong> ✅ File is intact | ❌ File corrupted/tampered<br><br>
                
                This Python demo shows the <strong>same concept</strong> but on the server side!
            </p>
        </div>
    </div>

    <script>
        // Handle file upload and hash calculation
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            const fileInput = document.getElementById('fileInput');
            formData.append('file', fileInput.files[0]);
            
            const resultDiv = document.getElementById('uploadResult');
            resultDiv.style.display = 'block';
            resultDiv.className = 'result';
            resultDiv.innerHTML = '⏳ Calculating hash...';
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        <strong>✅ Hash Calculated Successfully!</strong><br><br>
                        <strong>File:</strong> ${data.filename}<br>
                        <strong>Size:</strong> ${data.size} bytes<br>
                        <strong>Uploaded:</strong> ${data.timestamp}<br><br>
                        <strong>SHA-256 Hash:</strong>
                        <div class="hash-display">${data.hash}</div>
                        <br>
                        <small>💡 This hash is unique to this file. If the file changes even slightly, the hash will be completely different.</small>
                    `;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `❌ Error: ${data.error}`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `❌ Upload failed: ${error.message}`;
            }
        });

        // Handle file integrity verification
        document.getElementById('verifyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            const fileInput = document.getElementById('verifyFileInput');
            const expectedHash = document.getElementById('expectedHash').value;
            
            formData.append('file', fileInput.files[0]);
            formData.append('expected_hash', expectedHash);
            
            const resultDiv = document.getElementById('verifyResult');
            resultDiv.style.display = 'block';
            resultDiv.className = 'result';
            resultDiv.innerHTML = '⏳ Verifying integrity...';
            
            try {
                const response = await fetch('/verify', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.verified) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        <strong>✅ FILE INTEGRITY VERIFIED!</strong><br><br>
                        <strong>File:</strong> ${data.filename}<br>
                        <strong>Calculated Hash:</strong><br>
                        <div class="hash-display">${data.calculated_hash}</div>
                        <strong>Expected Hash:</strong><br>
                        <div class="hash-display">${data.expected_hash}</div>
                        <br>
                        <span class="badge match">✅ MATCH</span>
                        <br><br>
                        <small>✅ The file has not been modified or corrupted!</small>
                    `;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `
                        <strong>❌ INTEGRITY CHECK FAILED!</strong><br><br>
                        <strong>File:</strong> ${data.filename}<br>
                        <strong>Calculated Hash:</strong><br>
                        <div class="hash-display">${data.calculated_hash}</div>
                        <strong>Expected Hash:</strong><br>
                        <div class="hash-display">${data.expected_hash}</div>
                        <br>
                        <span class="badge different">❌ NO MATCH</span>
                        <br><br>
                        <small>⚠️ The file may have been modified, corrupted, or the hash is incorrect!</small>
                    `;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `❌ Verification failed: ${error.message}`;
            }
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """
    Main page route - displays the web interface.
    
    Returns:
        HTML page with SHA-256 demonstration and file upload interface
    """
    return render_template_string(HTML_TEMPLATE)

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handle file upload and calculate SHA-256 hash.
    
    This endpoint:
    1. Receives uploaded file
    2. Saves it temporarily
    3. Calculates SHA-256 hash
    4. Returns hash and file info
    
    Returns:
        JSON response with file hash and metadata
    """
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    
    # Check if filename is empty
    if file.filename == '':
        return jsonify({'success': False, 'error': 'No file selected'}), 400
    
    try:
        # Save file temporarily
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Calculate SHA-256 hash
        file_hash = calculate_sha256(filepath)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        # Get current timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Return success response
        return jsonify({
            'success': True,
            'filename': filename,
            'hash': file_hash,
            'size': file_size,
            'timestamp': timestamp
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/verify', methods=['POST'])
def verify_file():
    """
    Verify file integrity by comparing hashes.
    
    This endpoint:
    1. Receives file and expected hash
    2. Calculates actual hash of uploaded file
    3. Compares with expected hash
    4. Returns verification result
    
    Returns:
        JSON response with verification status
    """
    # Check if file and hash were provided
    if 'file' not in request.files or 'expected_hash' not in request.form:
        return jsonify({'verified': False, 'error': 'Missing file or hash'}), 400
    
    file = request.files['file']
    expected_hash = request.form['expected_hash'].strip().lower()
    
    if file.filename == '':
        return jsonify({'verified': False, 'error': 'No file selected'}), 400
    
    try:
        # Save file temporarily
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"verify_{filename}")
        file.save(filepath)
        
        # Calculate actual hash
        calculated_hash = calculate_sha256(filepath)
        
        # Compare hashes
        is_verified = (calculated_hash == expected_hash)
        
        # Clean up temporary file
        os.remove(filepath)
        
        # Return verification result
        return jsonify({
            'verified': is_verified,
            'filename': filename,
            'calculated_hash': calculated_hash,
            'expected_hash': expected_hash
        })
        
    except Exception as e:
        return jsonify({'verified': False, 'error': str(e)}), 500


@app.route('/api/verify-hash', methods=['POST'])
def api_verify_hash():
    """
    NEW API ENDPOINT: For JavaScript integration
    
    This allows your JavaScript app to send:
    - File
    - Client-side calculated hash
    
    Server will:
    - Calculate its own hash
    - Compare with client hash
    - Return verification result
    
    Usage from JavaScript:
        const formData = new FormData();
        formData.append('file', fileBlob);
        formData.append('client_hash', clientCalculatedHash);
        
        const response = await fetch('http://localhost:5000/api/verify-hash', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
    
    Returns:
        JSON with verification result and both hashes
    """
    try:
        # Get file and client hash
        if 'file' not in request.files or 'client_hash' not in request.form:
            return jsonify({
                'success': False,
                'error': 'Missing file or client_hash'
            }), 400
        
        file = request.files['file']
        client_hash = request.form['client_hash'].strip().lower()
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Calculate server-side hash
        file_bytes = file.read()
        server_hash = calculate_sha256_from_bytes(file_bytes)
        
        # Compare hashes
        hashes_match = (client_hash == server_hash)
        
        return jsonify({
            'success': True,
            'verified': hashes_match,
            'client_hash': client_hash,
            'server_hash': server_hash,
            'filename': file.filename,
            'timestamp': datetime.now().isoformat(),
            'message': 'Hashes match! File integrity verified.' if hashes_match else 'Hash mismatch! Possible corruption.'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/calculate-hash', methods=['POST'])
def api_calculate_hash():
    """
    NEW API ENDPOINT: Calculate hash server-side
    
    Allows JavaScript to upload file and get server-calculated hash.
    
    Usage from JavaScript:
        const formData = new FormData();
        formData.append('file', fileBlob);
        
        const response = await fetch('http://localhost:5000/api/calculate-hash', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Server hash:', data.hash);
    
    Returns:
        JSON with calculated hash
    """
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Calculate hash
        file_bytes = file.read()
        file_hash = calculate_sha256_from_bytes(file_bytes)
        
        return jsonify({
            'success': True,
            'hash': file_hash,
            'filename': file.filename,
            'size': len(file_bytes),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/demo')
def demo():
    """
    API endpoint for SHA-256 demonstration.
    
    Returns:
        JSON with example hashes showing how small changes affect output
    """
    return jsonify(demonstrate_sha256())


# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == '__main__':
    """
    Run the Flask application.
    
    The app will be available at: http://localhost:5000
    
    Features:
    - Upload files and get SHA-256 hash
    - Verify file integrity by comparing hashes
    - See live demonstrations of how SHA-256 works
    """
    print("=" * 60)
    print("SHA-256 File Integrity Checker - Flask Demo")
    print("=" * 60)
    print("\nStarting server...")
    print("Visit: http://localhost:5000")
    print("\nThis demonstrates the same SHA-256 concept used in your")
    print("JavaScript cloud storage system, but on the server side!")
    print("=" * 60)
    print("\nPress CTRL+C to stop the server\n")
    
    # Run Flask app in debug mode
    app.run(debug=True, host='0.0.0.0', port=5000)