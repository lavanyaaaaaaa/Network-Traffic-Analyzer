from flask import Flask, render_template, request, jsonify
from scapy.all import sniff, get_if_list
import threading

app = Flask(__name__)
capture_thread = None
capturing = False
packet_data = []

def capture_packets(interface):
    global capturing, packet_data
    packet_data.clear()

    def process_packet(packet):
        if capturing:
            packet_info = {
                "src": packet[0][1].src if packet.haslayer(1) else "N/A",
                "dst": packet[0][1].dst if packet.haslayer(1) else "N/A",
                "proto": packet.name
            }
            packet_data.append(packet_info)

    sniff(iface=interface, prn=process_packet, store=False)

@app.route('/')
def index():
    interfaces = get_if_list()
    preferred = [i for i in interfaces if "Wi-Fi" in i or "Ethernet" in i]
    default_iface = preferred[0] if preferred else interfaces[0]
    return render_template('index.html', interfaces=interfaces, default_iface=default_iface)

@app.route('/start', methods=['POST'])
def start_capture():
    global capturing, capture_thread
    interface = request.json.get('interface')
    capturing = True
    capture_thread = threading.Thread(target=capture_packets, args=(interface,))
    capture_thread.start()
    return jsonify({"status": "started"})

@app.route('/stop', methods=['POST'])
def stop_capture():
    global capturing
    capturing = False
    return jsonify({"status": "stopped"})

@app.route('/data')
def get_data():
    return jsonify(packet_data)

if __name__ == '__main__':
    app.run(debug=True)
