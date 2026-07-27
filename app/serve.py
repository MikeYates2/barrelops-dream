#!/usr/bin/env python3
"""Static file server for local dev that disables caching.

Plain `python3 -m http.server` leaves Chrome free to heuristically cache
JS modules across reloads (even hard reloads), which makes iterating on
this no-build-tool app confusing — you edit a file, reload, and still see
old behavior. This just adds Cache-Control: no-store to every response.
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    HTTPServer(("", port), NoCacheHandler).serve_forever()
