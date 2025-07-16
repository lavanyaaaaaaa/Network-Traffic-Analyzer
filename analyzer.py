from scapy.all import sniff, conf, IP, TCP, UDP, ICMP
from collections import defaultdict
import time
import logging

logger = logging.getLogger(__name__)

class TrafficAnalyzer:
    def __init__(self):
        self.is_running = False
        self.reset_stats()
        
    def reset_stats(self):
        self.stats = {
            'total_packets': 0,
            'protocols': defaultdict(int),
            'top_talkers': defaultdict(int),
            'alerts': [],
            'start_time': time.time(),
            'packets_per_sec': 0
        }
    
    def start_capture(self, interface=None):
        self.reset_stats()
        self.is_running = True
        sniff_kwargs = {
            'prn': self.process_packet,
            'store': 0,
            'stop_filter': lambda _: not self.is_running
        }
        if interface:
            sniff_kwargs['iface'] = interface
        
        try:
            logger.info(f"Starting capture on interface: {interface or 'default'}")
            sniff(**sniff_kwargs)
        except Exception as e:
            logger.error(f"Capture error: {str(e)}")
            self.is_running = False
            self.stats['alerts'].append(f"Capture error: {str(e)}")
    
    def stop_capture(self):
        self.is_running = False
    
    def process_packet(self, packet):
        if not self.is_running:
            return
        
        try:
            self.stats['total_packets'] += 1
            
            if packet.haslayer(IP):
                ip = packet[IP]
                self.stats['top_talkers'][ip.src] += 1
                
                if packet.haslayer(TCP):
                    self.stats['protocols']['TCP'] += 1
                elif packet.haslayer(UDP):
                    self.stats['protocols']['UDP'] += 1
                elif packet.haslayer(ICMP):
                    self.stats['protocols']['ICMP'] += 1
                
                # Simple anomaly detection
                if packet.haslayer(TCP) and packet[TCP].flags == 2:  # SYN
                    if self.stats['top_talkers'][ip.src] > 100:
                        alert = f"Possible port scan from {ip.src}"
                        if alert not in self.stats['alerts']:
                            self.stats['alerts'].append(alert)
            
            # Update packets per second
            duration = time.time() - self.stats['start_time']
            self.stats['packets_per_sec'] = self.stats['total_packets'] / duration if duration > 0 else 0
            
        except Exception as e:
            logger.error(f"Packet processing error: {str(e)}")
    
    def get_stats(self):
        stats = dict(self.stats)  # Convert defaultdicts to regular dicts
        stats['protocols'] = dict(stats['protocols'])
        stats['top_talkers'] = dict(stats['top_talkers'])
        return stats