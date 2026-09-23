#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import threading
import uuid
from pathlib import Path
import yt_dlp

app = Flask(__name__)
CORS(app)

DOWNLOAD_DIR = os.path.join(os.getcwd(), 'videos')
Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)
Port = 5000

tasks = {}
tasks_lock = threading.Lock()


@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'running',
        'message': 'Web Video Downloader API'
    })


@app.route('/download', methods=['POST'])
def download():
    try:
        data = request.get_json(silent=True) or {}
        url = (data.get('url') or '').strip()
        file_name = (data.get('fileName') or '').strip()

        if not url:
            return jsonify({'success': False, 'message': 'URL required'}), 400

        task_id = uuid.uuid4().hex
        with tasks_lock:
            tasks[task_id] = {'status': 'downloading', 'percent': 0, 'message': '', 'file': None}

        thread = threading.Thread(target=run_download, args=(task_id, url, file_name), daemon=True)
        thread.start()

        return jsonify({'success': True, 'taskId': task_id}), 202

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/status/<task_id>', methods=['GET'])
def status(task_id):
    with tasks_lock:
        task = tasks.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Unknown task'}), 404
    return jsonify({'success': True, **task})


def run_download(task_id, url, file_name):
    def progress_hook(d):
        with tasks_lock:
            task = tasks[task_id]
            if d['status'] == 'downloading':
                total = d.get('total_bytes') or d.get('total_bytes_estimate')
                downloaded = d.get('downloaded_bytes', 0)
                if total:
                    task['percent'] = round(downloaded / total * 100, 1)
                task['status'] = 'downloading'
            elif d['status'] == 'finished':
                task['status'] = 'processing'

    outtmpl = os.path.join(DOWNLOAD_DIR, (file_name or '%(title)s') + '.%(ext)s')
    ydl_opts = {
        'outtmpl': outtmpl,
        'progress_hooks': [progress_hook],
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'merge_output_format': 'mp4',
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filepath = None
            for d in info.get('requested_downloads') or []:
                if d.get('filepath'):
                    filepath = d['filepath']
                    break
            if not filepath:
                filepath = ydl.prepare_filename(info)
            filename = os.path.basename(filepath)
        with tasks_lock:
            tasks[task_id].update({'status': 'completed', 'percent': 100, 'file': filename})
    except Exception as e:
        with tasks_lock:
            tasks[task_id].update({'status': 'error', 'message': str(e)})


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


@app.route('/videos/<path:filename>', methods=['GET'])
def get_video(filename):
    return send_from_directory(DOWNLOAD_DIR, filename, as_attachment=True)


if __name__ == '__main__':
    print(f"🚀 Server running on http://localhost:{Port}")
    app.run(host='0.0.0.0', port=Port, debug=False)
