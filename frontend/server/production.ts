import { createServer, request as proxyRequest } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApiHandler } from './api.ts'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const api = createApiHandler(process.env)
const backend = new URL(process.env.AUTH_API_TARGET || 'http://backend:8080')
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }

createServer(async (req, res) => {
  try {
    const path = new URL(req.url || '/', 'http://localhost').pathname
    if (path === '/healthz') { res.end('ok'); return }
    if (path === '/api/auth' || path.startsWith('/api/auth/')) {
      const upstream = proxyRequest(new URL(req.url!, backend), {
        method: req.method, headers: { ...req.headers, host: backend.host }, timeout: 30_000,
      }, response => {
        res.writeHead(response.statusCode || 502, response.headers)
        response.pipe(res)
      })
      upstream.on('timeout', () => upstream.destroy())
      upstream.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Backend unavailable') })
      req.on('aborted', () => upstream.destroy())
      req.pipe(upstream)
      return
    }
    if (path.startsWith('/api/fitmap/')) { await api(req, res, () => { res.writeHead(404); res.end() }); return }
    if (path.startsWith('/api/')) { res.writeHead(404); res.end(); return }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return }
    const decoded = decodeURIComponent(path)
    let file = resolve(root, '.' + decoded)
    if (!file.startsWith(resolve(root) + sep) && file !== resolve(root)) { res.writeHead(403); res.end(); return }
    let info = await stat(file).catch(() => null)
    if (!info?.isFile()) {
      const routes = ['/', '/login', '/signup', '/dashboard', '/exercise', '/places', '/favorites', '/mypage']
      if (!routes.includes(path)) { res.writeHead(404); res.end(); return }
      file = resolve(root, 'index.html')
      info = await stat(file)
    }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
    res.setHeader('Content-Length', info.size)
    res.setHeader('Cache-Control', path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
    if (req.method === 'HEAD') { res.end(); return }
    createReadStream(file).on('error', () => res.destroy()).pipe(res)
  } catch {
    if (!res.headersSent) res.writeHead(500)
    res.end('Request failed')
  }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('FitMap production server ready'))
