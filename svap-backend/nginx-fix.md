# Nginx 413 Fix - Server Pe Run Karna Hai

## Problem
Nginx ka default `client_max_body_size` sirf **1MB** hai.
Video/image upload karte waqt 413 error aata hai.

## Fix - Server Pe SSH Karke Run Karo

```bash
# 1. Nginx config kholo
sudo nano /etc/nginx/nginx.conf

# 2. http {} block ke andar yeh add karo:
#    client_max_body_size 250M;

# Ya site-specific config mein:
sudo nano /etc/nginx/sites-available/default
# (ya jis file mein aapka site config hai)
```

### Site config mein yeh hona chahiye:
```nginx
server {
    listen 80;
    server_name 187.127.204.45;

    # ← YEH LINE ADD KARO
    client_max_body_size 250M;

    location /api/ {
        proxy_pass http://localhost:5004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # ← YEH BHI ADD KARO (large file timeouts)
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    location / {
        root /var/www/html;  # ya jahan frontend build hai
        try_files $uri $uri/ /index.html;
    }
}
```

## Config Test & Reload
```bash
# Config test karo
sudo nginx -t

# Reload karo (agar test pass ho)
sudo nginx -s reload
```

## Backend Restart
```bash
cd /path/to/svap-backend
pm2 restart all
# ya
pm2 restart svap-backend
```
