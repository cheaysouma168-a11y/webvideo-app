#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os
from pathlib import Path
import threading

app = Flask(__name__)
CORS(app)

DOWNLOAD_DIR = os.path.join(os.getcwd(), 'videos')
Port = 5000

Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'running',
        'message': 'Web Video Downloader API'
    })

@app.route('/download', methods=['POST'])
def download():
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        fileName = data.get('fileName', 'video').strip()
        
        if not url:
            return jsonify({'success': False, 'message': 'URL required'}), 400
        
        thread = threading.Thread(target=start_download, args=(url, fileName))
        thread.daemon = True
        thread.start()
        
        return jsonify({'success': True, 'message': 'Download started'}), 202
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def start_download(url, fileName):
    print(f"Downloading: {fileName}")

@app.route('/videos', methods=['GET'])
def list_videos():
    try:
        videos = []
        if os.path.exists(DOWNLOAD_DIR):
            for file in os.listdir(DOWNLOAD_DIR):
                videos.append({'name': file})
        return jsonify({'success': True, 'videos': videos})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    print(f"🚀 Server running on http://localhost:{Port}")
    app.run(host='0.0.0.0', port=Port, debug=False)
