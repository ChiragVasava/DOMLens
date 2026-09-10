/**
 * Qursor++ - Comprehensive Asset Extractor Engine
 * 
 * Scans selected element and its entire child DOM subtree to discover all media assets:
 * Images (src, srcset, data-src, data-thumb), CSS Background Images, SVGs, WebP, PNG, JPG, GIF, Videos.
 */

export function extractElementAssets(element) {
  if (!element || !(element instanceof Element)) return [];

  const assets = [];
  const seenUrls = new Set();

  // Helper to add image asset
  const addAsset = (url, type, category, format, name, width = 'Auto', height = 'Auto') => {
    if (!url || seenUrls.has(url) || url.startsWith('data:image/svg+xml;base64,PHN2Zy')) return;
    seenUrls.add(url);

    assets.push({
      id: 'asset_' + Math.random().toString(36).substr(2, 9),
      url,
      type,         // 'IMAGE' | 'SVG' | 'VIDEO'
      category,     // 'PNG' | 'JPG' | 'WEBP' | 'GIF' | 'SVG' | 'VIDEO' | 'OTHER'
      format,       // e.g. 'PNG Image', 'Inline SVG', 'JPEG'
      name: name || getAssetFilename(url),
      width,
      height
    });
  };

  // 1. Scan Element & Descendants for <img> tags
  const imgElements = element.tagName.toLowerCase() === 'img' ? [element] : Array.from(element.querySelectorAll('img'));
  imgElements.forEach(img => {
    const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-thumb') || img.getAttribute('srcset');
    if (src) {
      const cat = getCategoryFromUrl(src);
      addAsset(
        src,
        'IMAGE',
        cat,
        `${cat} Image`,
        img.alt || getAssetFilename(src),
        `${Math.round(img.width || img.naturalWidth || 0)}px`,
        `${Math.round(img.height || img.naturalHeight || 0)}px`
      );
    }
  });

  // 2. Scan Element & Descendants for CSS Background Images
  const allNodes = [element, ...Array.from(element.querySelectorAll('*'))];
  allNodes.forEach(node => {
    const cs = window.getComputedStyle(node);
    if (cs && cs.backgroundImage && cs.backgroundImage !== 'none') {
      const matches = cs.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/g);
      if (matches) {
        matches.forEach(m => {
          const cleanUrl = m.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
          if (cleanUrl) {
            const cat = getCategoryFromUrl(cleanUrl);
            addAsset(cleanUrl, 'IMAGE', cat, `Background ${cat}`, getAssetFilename(cleanUrl));
          }
        });
      }
    }
  });

  // 3. Scan Element & Descendants for Inline SVGs
  const svgElements = element.tagName.toLowerCase() === 'svg' ? [element] : Array.from(element.querySelectorAll('svg'));
  svgElements.forEach((svg, idx) => {
    const svgMarkup = svg.outerHTML;
    const svgBlobUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    const rect = svg.getBoundingClientRect();
    addAsset(
      svgBlobUrl,
      'SVG',
      'SVG',
      'Inline SVG Graphic',
      `svg_icon_${idx + 1}.svg`,
      `${Math.round(rect.width || 24)}px`,
      `${Math.round(rect.height || 24)}px`
    );
  });

  // 4. Scan Element & Descendants for <video> and <source>
  const videoElements = element.tagName.toLowerCase() === 'video' ? [element] : Array.from(element.querySelectorAll('video'));
  videoElements.forEach(vid => {
    const src = vid.currentSrc || vid.src || (vid.querySelector('source') ? vid.querySelector('source').src : null);
    if (src) {
      addAsset(src, 'VIDEO', 'VIDEO', 'Video Media', getAssetFilename(src));
    }
  });

  return assets;
}

/**
 * Filters asset list by category filter ('All', 'Images', 'SVG', 'PNG', 'JPG', 'WEBP', 'GIF', 'Other')
 */
export function filterAssets(assets, filter) {
  if (!assets || !Array.isArray(assets)) return [];
  if (!filter || filter === 'All') return assets;

  const f = filter.toUpperCase();
  if (f === 'IMAGES') return assets.filter(a => a.type === 'IMAGE');
  if (f === 'SVG') return assets.filter(a => a.category === 'SVG');
  if (f === 'PNG') return assets.filter(a => a.category === 'PNG');
  if (f === 'JPG' || f === 'JPEG') return assets.filter(a => a.category === 'JPG');
  if (f === 'WEBP') return assets.filter(a => a.category === 'WEBP');
  if (f === 'GIF') return assets.filter(a => a.category === 'GIF');
  if (f === 'OTHER') return assets.filter(a => ['OTHER', 'VIDEO'].includes(a.category));

  return assets;
}

function getCategoryFromUrl(url) {
  if (!url) return 'OTHER';
  const clean = url.toLowerCase().split('?')[0];
  if (clean.endsWith('.svg') || clean.startsWith('data:image/svg')) return 'SVG';
  if (clean.endsWith('.png')) return 'PNG';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'JPG';
  if (clean.endsWith('.webp')) return 'WEBP';
  if (clean.endsWith('.gif')) return 'GIF';
  return 'IMAGES';
}

function getAssetFilename(url) {
  if (!url) return 'asset';
  try {
    const parts = url.split('/');
    const last = parts[parts.length - 1].split('?')[0];
    return last.length > 20 ? last.substring(0, 18) + '...' : last;
  } catch (e) {
    return 'asset';
  }
}
