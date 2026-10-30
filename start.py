import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

print(f"========================================================")
print(f"  CampusConnect (UniGraph) DSA Engine Server")
print(f"  Running at: http://localhost:{PORT}")
print(f"  Press Ctrl+C to stop the server.")
print(f"========================================================")

webbrowser.open(f"http://localhost:{PORT}")

try:
    with ReusableTCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
except Exception as e:
    print(f"Error starting server: {e}")
    # Try alternate port if 8000 is occupied
    try:
        PORT = 8080
        print(f"Attempting fallback port http://localhost:{PORT}...")
        webbrowser.open(f"http://localhost:{PORT}")
        with ReusableTCPServer(("", PORT), http.server.SimpleHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except Exception as e2:
        print(f"Fallback also failed: {e2}")
