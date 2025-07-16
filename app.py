try:
    from flask import Flask, render_template, jsonify, request
    from threading import Thread
    from analyzer import TrafficAnalyzer
    import logging
except ImportError as e:
    print(f"Import error: {e}")
    print("Please make sure you've installed all requirements:")
    print("pip install -r requirements.txt")
    exit(1)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
analyzer = TrafficAnalyzer()

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/start_capture')
def start_capture():
    interface = request.args.get('interface', None)
    if not analyzer.is_running:
        try:
            Thread(target=analyzer.start_capture, kwargs={'interface': interface}).start()
            logger.info(f"Capture started on interface: {interface}")
            return jsonify({'status': 'capture started'})
        except Exception as e:
            logger.error(f"Failed to start capture: {str(e)}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/stop_capture')
def stop_capture():
    try:
        analyzer.stop_capture()
        logger.info("Capture stopped")
        return jsonify({'status': 'capture stopped'})
    except Exception as e:
        logger.error(f"Failed to stop capture: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/get_stats')
def get_stats():
    try:
        stats = analyzer.get_stats()
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/interfaces')
def get_interfaces():
    try:
        from scapy.all import get_if_list
        return jsonify({'interfaces': get_if_list()})
    except Exception as e:
        logger.error(f"Failed to get interfaces: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Application failed to start: {str(e)}")