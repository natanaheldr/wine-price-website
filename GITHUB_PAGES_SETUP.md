# 🍷 Wine Price Website - GitHub Pages Deploy

## ✅ Configuración para GitHub Pages

El proyecto está 100% configurado para desplegar en GitHub Pages automáticamente con cada push.

---

## 🚀 PASOS PARA GITHUB PAGES

### 1️⃣ **Si NO tienes repositorio en GitHub aún**

```bash
# Inicializar Git
git init

# Agregar remote (reemplaza USERNAME con tu usuario de GitHub)
git remote add origin https://github.com/USERNAME/wine-price-website.git

# Crear rama main
git branch -M main

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit - wine price website configured for GitHub Pages"

# Subir a GitHub
git push -u origin main
```

### 2️⃣ **Si YA tienes repositorio en GitHub**

```bash
git add .
git commit -m "Configure for GitHub Pages"
git push
```

---

## ⚙️ CONFIGURACIÓN EN GITHUB

### Pasos en la interfaz de GitHub:

1. **Ve a tu repositorio** en GitHub
2. **Settings** → **Pages** (en el menú izquierdo)
3. En **Source** selecciona: **Deploy from a branch**
4. En **Branch** selecciona: **main** (o master)
5. En **folder** selecciona: **/ (root)**
6. Click en **Save**

### Espera 2-3 minutos y tu sitio estará en vivo 🎉

```
https://USERNAME.github.io/wine-price-website
```

---

## 🤖 AUTOMATIZACIÓN CON GITHUB ACTIONS

Ya está configurado automáticamente:

✅ **Archivo:** `.github/workflows/deploy.yml`
- Cada vez que hagas **push** a `main` o `master`
- Se ejecuta build automáticamente
- Se deploira a GitHub Pages
- Todo sin hacer nada más

---

## 📋 ARCHIVOS CREADOS/MODIFICADOS

```
wine-price-website/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← GitHub Actions (auto-deploy)
├── .nojekyll                 ← Archivo de configuración
├── next.config.mjs           ← Actualizado (output: 'export')
└── [resto del proyecto]
```

---

## 🔍 VERIFICACIÓN

Después de hacer push, en GitHub:
1. Ve a tu repositorio
2. Click en **Actions** (arriba)
3. Verás el workflow ejecutándose
4. Cuando termine con ✅ estará listo

---

## 📝 WORKFLOW DE DESARROLLO

De ahora en adelante:

```bash
# Haces cambios locales...

# 1. Commit
git add .
git commit -m "Tu mensaje"

# 2. Push
git push

# 3. ¡Listo! GitHub Actions despliega automáticamente
```

---

## 💡 NOTAS IMPORTANTES

- **output: 'export'** en next.config.mjs genera un sitio estático
- **GitHub Pages actualiza cada 2-3 minutos** después de push
- **No necesitas hacer nada manual** - todo es automático
- **Gratis para siempre** ✓

---

## 🆘 TROUBLESHOOTING

### Si no aparece el sitio:
1. Verifica en Actions que no haya errores (rojo ❌)
2. Espera 5 minutos
3. Limpia caché del navegador (Ctrl+Shift+Del)

### Si falla el deploy:
1. Ve a Actions → último build
2. Click en el workflow para ver logs
3. Busca el error en los logs rojos

---

¡Listo! GitHub Pages está configurado y automatizado! 🚀
