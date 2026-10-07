"""Serve the web export locally with Expo Router deep-link fallback."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

os.chdir(Path(__file__).resolve().parent.parent / "web-dist")

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if not Path(self.translate_path(self.path)).exists() and "." not in self.path.rsplit("/", 1)[-1]:
            self.path = "/index.html"
        super().do_GET()

if __name__ == "__main__":
    print("Stride preview: http://127.0.0.1:8082", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 8082), Handler).serve_forever()
