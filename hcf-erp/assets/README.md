# HCF ERP — Assets

Drop your official Hope Commoners Foundation logo here as:

```
logo.png
```

- Recommended: a square PNG (e.g. 256×256 or 512×512), transparent background.
- Once present, it automatically appears as the logo in the header of the
  portal, login, signup, admin dashboard and landing page.
- If `logo.png` is missing, the app gracefully falls back to the built-in
  leaf/hands icon — nothing breaks.

To publish it on the live VPS after adding the file, re-run the deploy/update
step (see the main README), or copy it into the served folder:

```
cp logo.png /root/playplate/certbot/www/hcf-erp/assets/logo.png
```
