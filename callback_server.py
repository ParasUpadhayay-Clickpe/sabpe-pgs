#!/usr/bin/env python3
"""
Pay10 Integration - Callback Server
Handles callback URL responses and decrypts ENCDATA
"""

from flask import Flask, request, render_template_string, jsonify
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64
import binascii
import json
from datetime import datetime
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pay10 AES key (UTF-8 string, not hex) - matches Node.js implementation
AES_KEY = "7367D2EB6A0D4D36EF81D2EB5E4EFA5C"  # 32 ASCII chars = 256 bits

def decrypt_aes_data(encrypted_data, key):
    """
    Decrypt AES encrypted data from Pay10
    Matches Node.js crypto.createDecipheriv with UTF-8 key/IV
    """
    try:
        logger.info(f"Attempting to decrypt data: {encrypted_data[:100]}...")
        logger.info(f"Data length: {len(encrypted_data)}")
        
        # Exact parameters from Node.js script
        secret_key = "7367D2EB6A0D4D36EF81D2EB5E4EFA5C"  # 32 ASCII chars = 256 bits
        iv = "7367D2EB6A0D4D36"                          # 16 ASCII chars = 16 bytes
        
        logger.info(f"Secret Key (UTF-8): {secret_key} - Length: {len(secret_key)} chars")
        logger.info(f"IV (UTF-8): {iv} - Length: {len(iv)} chars")
        
        # Convert UTF-8 strings to bytes (like Node.js Buffer.from(key, "utf8"))
        key_bytes = secret_key.encode('utf-8')  # 32 bytes
        iv_bytes = iv.encode('utf-8')           # 16 bytes
        
        logger.info(f"Key bytes length: {len(key_bytes)} bytes")
        logger.info(f"IV bytes length: {len(iv_bytes)} bytes")
        
        # Decode base64 encrypted data
        try:
            encrypted_bytes = base64.b64decode(encrypted_data)
            logger.info(f"Base64 decoded successfully, length: {len(encrypted_bytes)} bytes")
        except Exception as e:
            logger.error(f"Base64 decode failed: {e}")
            return None
        
        # AES-256-CBC decryption (matches Node.js crypto.createDecipheriv)
        cipher = AES.new(key_bytes, AES.MODE_CBC, iv_bytes)
        decrypted = cipher.decrypt(encrypted_bytes)
        
        # Remove PKCS7 padding (matches Node.js decipher.setAutoPadding(true))
        decrypted = unpad(decrypted, AES.block_size)
        
        # Convert to UTF-8 string (matches Node.js decipher.final("utf8"))
        decrypted_text = decrypted.decode('utf-8')
        
        logger.info(f"Decryption successful! Result length: {len(decrypted_text)} chars")
        logger.info(f"First 100 chars: {decrypted_text[:100]}")
        
        return decrypted_text
        
    except Exception as e:
        logger.error(f"Decryption error: {str(e)}")
        return None

def parse_decrypted_data(decrypted_text):
    """
    Parse the decrypted data into key-value pairs
    """
    try:
        # Try to parse as JSON first
        return json.loads(decrypted_text)
    except:
        # If not JSON, parse as key=value pairs separated by ~
        data = {}
        pairs = decrypted_text.split('~')
        for pair in pairs:
            if '=' in pair:
                key, value = pair.split('=', 1)
                data[key] = value
        return data

@app.route('/')
def index():
    """
    Home page showing server status
    """
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pay10 Callback Server</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .status { 
                color: #28a745; 
                font-weight: bold;
            }
            .endpoint {
                background: #e9ecef;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Pay10 Integration - Callback Server</h1>
            <p class="status">✅ Server is running successfully!</p>
            
            <h3>Available Endpoints:</h3>
            <div class="endpoint">POST /callback - Handles Pay10 callback with ENCDATA</div>
            <div class="endpoint">GET /test - Test decryption functionality</div>
            
            <h3>Server Info:</h3>
            <p><strong>Started:</strong> {{ current_time }}</p>
            <p><strong>AES Key:</strong> {{ aes_key }}</p>
            
            <h3>Usage:</h3>
            <p>Set your Pay10 return URL to: <code>http://localhost:5000/callback</code></p>
        </div>
    </body>
    </html>
    """, current_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), aes_key=AES_KEY)

@app.route('/callback', methods=['GET', 'POST'])
def callback():
    """
    Handle Pay10 callback - decrypt ENCDATA and display results
    """
    logger.info(f"Callback received - Method: {request.method}")
    
    if request.method == 'POST':
        # Get POST data
        encdata = request.form.get('ENCDATA')
        pay_id = request.form.get('PAY_ID')
        
        logger.info(f"Received ENCDATA: {encdata}")
        logger.info(f"Received PAY_ID: {pay_id}")
        
        if not encdata:
            return jsonify({
                'error': 'No ENCDATA received',
                'received_data': dict(request.form)
            }), 400
        
        # Decrypt the data
        decrypted_data = decrypt_aes_data(encdata, AES_KEY)
        
        if decrypted_data:
            # Parse the decrypted data
            parsed_data = parse_decrypted_data(decrypted_data)
            
            return render_template_string("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Response - Decrypted</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 1000px; 
                        margin: 20px auto; 
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .success { 
                        color: #28a745; 
                        background: #d4edda;
                        padding: 15px;
                        border-radius: 5px;
                        border: 1px solid #c3e6cb;
                        margin-bottom: 20px;
                    }
                    .data-section {
                        margin: 20px 0;
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 5px;
                        border-left: 4px solid #007bff;
                    }
                    .raw-data {
                        background: #e9ecef;
                        padding: 15px;
                        border-radius: 5px;
                        font-family: monospace;
                        word-break: break-all;
                        white-space: pre-wrap;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    th, td {
                        border: 1px solid #dee2e6;
                        padding: 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #e9ecef;
                        font-weight: bold;
                    }
                    .timestamp {
                        color: #6c757d;
                        font-size: 0.9em;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Payment Response Received</h1>
                    <div class="success">
                        ✅ Payment callback received and decrypted successfully!
                    </div>
                    
                    <div class="timestamp">
                        Received at: {{ timestamp }}
                    </div>
                    
                    <div class="data-section">
                        <h3>Payment Information</h3>
                        <table>
                            <tr><th>Field</th><th>Value</th></tr>
                            <tr><td><strong>PAY_ID</strong></td><td>{{ pay_id }}</td></tr>
                            {% for key, value in parsed_data.items() %}
                            <tr><td><strong>{{ key }}</strong></td><td>{{ value }}</td></tr>
                            {% endfor %}
                        </table>
                    </div>
                    
                    <div class="data-section">
                        <h3>Raw Encrypted Data (ENCDATA)</h3>
                        <div class="raw-data">{{ encdata }}</div>
                    </div>
                    
                    <div class="data-section">
                        <h3>Decrypted Data</h3>
                        <div class="raw-data">{{ decrypted_data }}</div>
                    </div>
                </div>
            </body>
            </html>
            """, 
            encdata=encdata,
            pay_id=pay_id,
            decrypted_data=decrypted_data,
            parsed_data=parsed_data,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
        else:
            return render_template_string("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Decryption Failed</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        max-width: 800px; 
                        margin: 50px auto; 
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .error { 
                        color: #dc3545; 
                        background: #f8d7da;
                        padding: 15px;
                        border-radius: 5px;
                        border: 1px solid #f5c6cb;
                    }
                    .raw-data {
                        background: #e9ecef;
                        padding: 15px;
                        border-radius: 5px;
                        font-family: monospace;
                        word-break: break-all;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Decryption Failed</h1>
                    <div class="error">
                        ❌ Failed to decrypt the payment response data.
                    </div>
                    
                    <h3>Received Data:</h3>
                    <p><strong>PAY_ID:</strong> {{ pay_id }}</p>
                    <p><strong>ENCDATA:</strong></p>
                    <div class="raw-data">{{ encdata }}</div>
                    
                    <h3>Possible Issues:</h3>
                    <ul>
                        <li>Incorrect AES key</li>
                        <li>Wrong encryption format</li>
                        <li>Data corruption during transmission</li>
                    </ul>
                </div>
            </body>
            </html>
            """, encdata=encdata, pay_id=pay_id)
    
    else:
        # GET request - show callback URL info
        return render_template_string("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pay10 Callback Endpoint</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 50px auto; 
                    padding: 20px;
                    background: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .info { 
                    color: #0c5460; 
                    background: #d1ecf1;
                    padding: 15px;
                    border-radius: 5px;
                    border: 1px solid #bee5eb;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Pay10 Callback Endpoint</h1>
                <div class="info">
                    ℹ️ This endpoint is ready to receive POST requests from Pay10 with ENCDATA and PAY_ID.
                </div>
                <p>Use this URL as your return URL in the payment form:</p>
                <code>http://localhost:5000/callback</code>
            </div>
        </body>
        </html>
        """)

@app.route('/test')
def test_decryption():
    """
    Test endpoint to verify decryption functionality
    """
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Decryption</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .form-group {
                margin-bottom: 20px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            textarea, input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-family: monospace;
            }
            textarea {
                height: 100px;
            }
            button {
                background: #007bff;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            button:hover {
                background: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Test Decryption</h1>
            <form method="post" action="/callback">
                <div class="form-group">
                    <label for="encdata">ENCDATA (Base64 or Hex):</label>
                    <textarea name="ENCDATA" id="encdata" placeholder="Paste your encrypted data here..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="payid">PAY_ID:</label>
                    <input type="text" name="PAY_ID" id="payid" placeholder="Enter PAY_ID">
                </div>
                
                <button type="submit">Test Decryption</button>
            </form>
        </div>
    </body>
    </html>
    """)

@app.route('/test-specific')
def test_specific_data():
    """
    Test endpoint for the latest encrypted data from Node.js script
    """
    encrypted_data = "MxZFqtwYL6b/wB+n5ztuMG4xJsXURB5oegKgeUbovBhG4kpDA0JdOGZaLYmR/piE2kz0C2oSx1cps+N6Th4+Hpwgc6yNOOaZjN1couNS/EV4mrETAXwII/9txROt1MosqDLDgYlYlK6Cd4gKAQrrXq2CrSvMJ02c0BgRaHNCQ/IZChTYMNEdwHFrL1FEpkF4xuqZtTJk/o+A4M2IDkesQ1FimZenZpgBFH3rsAx09HwyaKtTqjoDBB7t4anfb4/tZN9+iQf1qLXZRVrSSznWHCGACwM6YYxC/pusGHgbuX0KsJk/XIOJrPDGS1K0LhfX65AKNrA2RZ7JkaAh/p74N5SVTsrdf+8GplWH8J2RN7lN3WSvUtC/8ZgH/pyvZQaPqbg9abAkldAzwCY2aJZntKhmfvpQlqjaax5kDWoGwYzZg1yXLagGzHvrktra6oT+5ReGnPqjS47Bys1OHTRkewak1Y1kpm6rTxBYk0Gp/A0i5K+jBKLbvbSYESzPobo9dJ5hzcwjQlbVFGjAQXWt9Fb95qs0rsAoJUc7Qz7j5Z6BO/oRBB99ISeff7kZl7BX2BZD7XFeCE+lDPgfAoxc5jzC1MDpywj77F5drp5zLu2ewh9tPge9q0h7nmjfftlnIrAd7yWZcqQi4jCRe8+3eYP7gtX8mcm5o22KSYsohrl5ZVa0zMdJlhAX2COrBxUtsPTeww5PEX/PwxnzQ/Lrnpdn1zu+vaAjPxvECqmgGJdowQEpgl9m2mU8lMkDbnIj7soSZE0KDHAqz/+Q/qV7p+eP0POKouz3F3fGAiMMv9eM7M5Q5hQktCYLM/u+TxAcnZh9QXAN9MO1dJRZiGZGi5pCcpeS9yJjkVidF9wvPx5FVEXDNRNFmcohjuNwWBuT14stpCiMg9jF0+ysH6f0+U2uJNpcdeCp/DWGHdzs68+00yg4vH55WgwzYQzbsWH2BXonWaY/aVlQwhyGDpi7Poqmj2TlQpUIY5DCo4N0ZzAEzgPDkNMR+s+ez6nFgzV9rFE316HY8eEVnQnFaf5+2jrXXmslAMxbT3kW43rEI04LpVwsgPp/lWx8Oyoo4AbJRh5KG9GN3G8MWcC2AicQoeeUJg9H6MoijJK+ZwCDnOdqtmLXt0HhRp9xM7Fzj9CCNOnks3NwRrhHf0n+6pGN2wORCMb2SL+vk37NDhQwP/1UklBuUXEwVl8OfzcwVVLab5BKLn1XEDdfeOJ5tEnQk8MCXbgVETDPIjLVZVhDdIc9a42mG/gbbmyd94a9vyFB"
    
    logger.info(f"Testing latest encrypted data from Node.js script")
    logger.info(f"Data length: {len(encrypted_data)} characters")
    
    # Try decryption with UTF-8 key/IV approach
    decrypted_data = decrypt_aes_data(encrypted_data, AES_KEY)
    
    return render_template_string("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Specific Encrypted Data</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 1000px; 
                margin: 20px auto; 
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { 
                color: #28a745; 
                background: #d4edda;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #c3e6cb;
                margin-bottom: 20px;
            }
            .error { 
                color: #dc3545; 
                background: #f8d7da;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #f5c6cb;
                margin-bottom: 20px;
            }
            .data-section {
                margin: 20px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 5px;
                border-left: 4px solid #007bff;
            }
            .raw-data {
                background: #e9ecef;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
                word-break: break-all;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Test Specific Encrypted Data</h1>
            
            <div class="data-section">
                <h3>Input Data</h3>
                <p><strong>Encrypted Data:</strong> {{ encrypted_data }}</p>
                <p><strong>AES Key:</strong> {{ aes_key }}</p>
            </div>
            
            {% if decrypted_data %}
            <div class="success">
                ✅ Decryption successful!
            </div>
            
            <div class="data-section">
                <h3>Decrypted Result</h3>
                <div class="raw-data">{{ decrypted_data }}</div>
            </div>
            {% else %}
            <div class="error">
                ❌ Decryption failed. Check the server logs for detailed error information.
            </div>
            
            <div class="data-section">
                <h3>Troubleshooting</h3>
                <ul>
                    <li>Verify the AES key is correct</li>
                    <li>Check if the encrypted data format is correct (hex/base64)</li>
                    <li>Ensure the encryption method matches Pay10's implementation</li>
                    <li>Check server logs for detailed error messages</li>
                </ul>
            </div>
            {% endif %}
            
            <div class="data-section">
                <h3>Try Different Keys</h3>
                <form method="post" action="/test-with-key">
                    <div style="margin-bottom: 15px;">
                        <label for="test_key" style="display: block; margin-bottom: 5px; font-weight: bold;">AES Key:</label>
                        <input type="text" name="test_key" id="test_key" value="{{ aes_key }}" 
                               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace;">
                    </div>
                    <input type="hidden" name="test_data" value="{{ encrypted_data }}">
                    <button type="submit" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                        Test with This Key
                    </button>
                </form>
            </div>
        </div>
    </body>
    </html>
    """, 
    encrypted_data=encrypted_data,
    aes_key=AES_KEY,
    decrypted_data=decrypted_data
    )

@app.route('/test-with-key', methods=['POST'])
def test_with_key():
    """
    Test decryption with a custom key
    """
    test_key = request.form.get('test_key')
    test_data = request.form.get('test_data')
    
    if not test_key or not test_data:
        return jsonify({'error': 'Missing test_key or test_data'}), 400
    
    logger.info(f"Testing with custom key: {test_key}")
    logger.info(f"Testing with data: {test_data}")
    
    decrypted_data = decrypt_aes_data(test_data, test_key)
    
    return jsonify({
        'encrypted_data': test_data,
        'test_key': test_key,
        'decrypted_data': decrypted_data,
        'success': decrypted_data is not None
    })

if __name__ == '__main__':
    print("=" * 60)
    print("Pay10 Integration - Callback Server")
    print("=" * 60)
    print(f"Server starting on http://localhost:5000")
    print(f"Callback URL: http://localhost:5000/callback")
    print(f"AES Key: {AES_KEY}")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True) 