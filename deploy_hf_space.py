"""
Sovereign OS Hugging Face Spaces 1-Click Deployer
==================================================
Automates git repo initialization and deployment to Hugging Face Spaces.
"""

import os
import sys
import subprocess

def deploy():
    print("=========================================================================")
    print("      SOVEREIGN OS HUGGING FACE SPACES 1-CLICK DEPLOYMENT")
    print("=========================================================================")
    
    web_app_dir = os.path.dirname(__file__)
    space_repo = input("[HF Deploy] Enter your Hugging Face Space Git URL (e.g., https://huggingface.co/spaces/username/sovereign-os): ").strip()
    
    if not space_repo:
        print("[HF Deploy] Error: Space URL is required. Create a Space at https://huggingface.co/new-space")
        return

    print(f"\n[HF Deploy] Initializing git repository in {web_app_dir}...")
    try:
        subprocess.run(["git", "init"], cwd=web_app_dir, check=True)
        subprocess.run(["git", "add", "."], cwd=web_app_dir, check=True)
        subprocess.run(["git", "commit", "-m", "Deploy Sovereign OS Cloud Mind Web App"], cwd=web_app_dir, check=True)
        subprocess.run(["git", "remote", "add", "space", space_repo], cwd=web_app_dir, check=True)
        print("[HF Deploy] Pushing Sovereign OS container files to Hugging Face Space...")
        subprocess.run(["git", "push", "-u", "space", "main", "--force"], cwd=web_app_dir, check=True)
        print("\n=========================================================================")
        print("   DEPLOYS COMPLETE! YOUR SPACE IS BUILDING LIVE ON HUGGING FACE.")
        print("=========================================================================")
    except Exception as e:
        print(f"[HF Deploy] Deployment note: {e}")

if __name__ == "__main__":
    deploy()
