# Ciensite — Ciencia para todos

Sitio web de divulgación científica creado por estudiantes mexicanos. Desarrollado con tecnologías modernas y un enfoque en rendimiento, accesibilidad y diseño limpio.

## Tecnologías

- **[Astro](https://astro.build/)** — Framework de generación estática
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Estilos utilitarios con plugin de tipografía
- **[MDX](https://mdxjs.com/)** — Artículos con componentes interactivos
- **[Decap CMS](https://decapcms.org/)** — Gestión de contenido sin servidor
- **[Pagefind](https://pagefind.app/)** — Búsqueda estática del lado del cliente
- **TypeScript** — Tipado estricto

## Estructura del proyecto

```
src/
├── content/
│   ├── articulos/          ← Artículos en formato MDX
│   └── equipo/             ← Perfiles del equipo en Markdown
├── components/
│   ├── Header.astro        ← Navegación sticky con menú móvil
│   ├── Footer.astro        ← Pie de página con créditos
│   ├── ArticuloCard.astro  ← Tarjeta de artículo
│   ├── TeamCard.astro      ← Tarjeta de miembro del equipo
│   ├── SearchBar.astro     ← Barra de búsqueda con Pagefind
│   └── InstagramEmbed.astro
├── layouts/
│   ├── BaseLayout.astro    ← Layout base con SEO y meta tags
│   └── ArticuloLayout.astro
├── pages/
│   ├── index.astro         ← Página principal
│   ├── articulos/          ← Listado y artículos individuales
│   ├── multimedia.astro    ← Videos, galería e Instagram
│   ├── equipo.astro        ← Miembros del equipo
│   └── contacto.astro      ← Formulario de contacto
└── styles/
    └── global.css          ← Estilos globales y tema
```

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Construir para producción (incluye índice de Pagefind)
npm run build

# Vista previa de la versión de producción
npm run preview
```

## Agregar contenido

### Opción 1: Decap CMS (interfaz visual)

1. Configura el backend en `public/admin/config.yml` con tu repositorio de GitHub
2. Accede a `tu-sitio.com/admin` para gestionar artículos y miembros del equipo
3. Los cambios se guardan directamente en el repositorio

### Opción 2: Archivos MDX (manual)

Crea un archivo `.mdx` en `src/content/articulos/` con el siguiente frontmatter:

```yaml
---
title: "Título del artículo"
description: "Breve descripción del artículo"
date: 2026-03-24
category: "Biología" # Biología | Física | Química | Tecnología | Medio Ambiente
coverImage: "/uploads/mi-imagen.jpg"
author: "Nombre del autor"
---

Contenido del artículo en Markdown...
```

### Agregar miembros del equipo

Crea un archivo `.md` en `src/content/equipo/`:

```yaml
---
name: "Nombre completo"
role: "Rol en el equipo"
bio: "Breve biografía"
photo: "/uploads/foto.jpg"
order: 1
socialLinks:
  instagram: "https://instagram.com/usuario"
  twitter: "https://twitter.com/usuario"
---
```

## Características

- Modo oscuro automático con toggle manual
- Animaciones de scroll suaves con Intersection Observer
- Búsqueda de artículos en tiempo real (Pagefind)
- Filtrado por categorías
- Botones de compartir (Twitter/X, WhatsApp, copiar enlace)
- Galería de fotos con lightbox
- Formulario de contacto con Netlify Forms
- SEO optimizado con Open Graph y meta tags
- Sitemap XML automático
- Diseño responsive mobile-first
- Accesibilidad con ARIA labels y HTML semántico

## Despliegue

El sitio está optimizado para despliegue en **Netlify**:

1. Conecta tu repositorio de GitHub
2. Configura el comando de build: `npm run build`
3. Directorio de publicación: `dist`
4. El formulario de contacto funciona automáticamente con Netlify Forms

## Licencia

Proyecto desarrollado por Isaac Rodríguez.
