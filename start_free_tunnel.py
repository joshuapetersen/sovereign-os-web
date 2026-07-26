"""
Sovereign OS Cloudflare Quick Tunnel Generator
===============================================
Downloads cloudflared if missing and generates a live, 100% free HTTPS public URL
(https://xxx.trycloudflare.com) from any PC or USB drive without credentials or credit cards.
"""

import os
import sys
import time
import subprocess
import urllib.request
import re

def main():
    print("=========================================================================")
    print("      SOVEREIGN OS CLOUDFLARE QUICK TUNNEL GENERATOR (FREE HTTPS)")
    print("=========================================================================")

    web_app_dir = os.path.dirname(__file__)
    bin_dir = os.path.join(web_app_dir, "bin")
    os.makedirs(bin_dir, exist_ok=True)
    cloudflared_exe = os.path.join(bin_dir, "cloudflared.exe")

    # 1. Download cloudflared.exe if not present
    if not os.path.exists(cloudflared_exe):
        url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        print(f"[Tunnel] Downloading cloudflared.exe from GitHub releases to {cloudflared_exe}...")
        try:
            urllib.request.urlretrieve(url, cloudflared_exe)
            print("  [OK] cloudflared.exe downloaded successfully.")
        except Exception as e:
            print(f"  ! Download error: {e}")

    # 2. Ensure local web engine is running on port 8080
    print("\n[Tunnel] Checking Sovereign OS Web Server on port 8080...")
    server_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "cloud_app:app", "--host", "127.0.0.1", "--port", "8080"],
        cwd=web_app_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(2)
    print("  [OK] Local Web Engine Active on http://127.0.0.1:8080")

    # 3. Launch Cloudflare Quick Tunnel
    print("\n[Tunnel] Launching Cloudflare Quick Tunnel...")
    if os.path.exists(cloudflared_exe):
        cmd = [cloudflared_exe, "tunnel", "--url", "http://127.0.0.1:8080"]
        tunnel_proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        print("\n=========================================================================")
        print("   YOUR LIVE FREE PUBLIC CLOUD URL IS BEING GENERATED BELOW:")
        print("=========================================================================\n")

        for line in iter(tunnel_proc.stdout.readline, ''):
            if "trycloudflare.com" in line:
                match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
                if match:
                    cloud_url = match.group(0)
                    print(f"   >>> LIVE HTTPS CLOUD URL: {cloud_url} <<<")
                    print("\n  Open this link on ANY phone, tablet, or PC in the world!")
                    print("  Press Ctrl+C to stop the tunnel when finished.")
                    break
    else:
        print("  ! Please run: npx localtunnel --port 8080")

if __name__ == "__main__":
    main()
