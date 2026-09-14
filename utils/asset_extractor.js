/**
 * Qursor++ - Comprehensive Asset Extractor Engine
 * 
 * Deeply scans the selected element and child DOM subtree to discover all media assets:
 * - Images (src, currentSrc, srcset, data-src, data-thumb, data-original, etc.)
 * - HTML5 <picture> and <source> elements
 * - CSS Background Images (inline & computed)
 * - Inline & External SVGs
 * - Videos (<video>, <source>)
 * - URL normalization against document.baseURI
 * - Filter categories: All, Images, SVG, PNG, JPG, WEBP, GIF, Other
 */

/**
 * Resolves and normalizes relative or protocol-relative URLs against document.baseURI
 * @param {string} rawUrl 
 * @returns {string}
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  try {
    return new URL(trimmed, document.baseURI).href;
  } catch (e) {
    return trimmed;
  }
}

/**
 * Extracts candidate URLs from srcset attributes (takes highest resolution / largest descriptor)
 * @param {string} srcsetString 
 * @returns {string[]}
 */
function parseSrcsetUrls(srcsetString) {
  if (!srcsetString) return [];
  const urls = [];
  const entries = srcsetString.split(',');
  for (const entry of entries) {
    const parts = entry.trim().split(/\s+/);
    if (parts[0]) {
      urls.push(normalizeUrl(parts[0]));
    }
  }
  return urls;
}

/**
 * Determines asset format and category from URL or Data URI
 * @param {string} url 
 * @returns {{ category: string, format: string }}
 */
function detectAssetCategory(url) {
  if (!url) return { category: 'OTHER', format: 'Other Asset' };

  if (url.startsWith('data:')) {
    if (url.startsWith('data:image/svg')) return { category: 'SVG', format: 'SVG Vector' };
    if (url.startsWith('data:image/png')) return { category: 'PNG', format: 'PNG Image' };
    if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) return { category: 'JPG', format: 'JPEG Image' };
    if (url.startsWith('data:image/webp')) return { category: 'WEBP', format: 'WebP Image' };
    if (url.startsWith('data:image/gif')) return { category: 'GIF', format: 'GIF Animation' };
    return { category: 'IMAGES', format: 'Image Data' };
  }

  const clean = url.toLowerCase().split('?')[0];
  const query = url.toLowerCase().includes('?') ? url.toLowerCase().split('?')[1] : '';

  if (clean.endsWith('.svg') || query.includes('format=svg')) return { category: 'SVG', format: 'SVG Graphic' };
  if (clean.endsWith('.png') || query.includes('format=png')) return { category: 'PNG', format: 'PNG Image' };
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg') || query.includes('format=jpg') || query.includes('format=jpeg')) {
    return { category: 'JPG', format: 'JPEG Image' };
  }
  if (clean.endsWith('.webp') || query.includes('format=webp')) return { category: 'WEBP', format: 'WebP Image' };
  if (clean.endsWith('.gif') || query.includes('format=gif')) return { category: 'GIF', format: 'GIF Animation' };
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg')) return { category: 'VIDEO', format: 'Video Stream' };

  // YouTube thumbnail patterns e.g. /vi/<id>/hqdefault.jpg or ytimg.com
  if (url.includes('ytimg.com') || url.includes('googleusercontent.com') || url.includes('/vi/')) {
    return { category: 'JPG', format: 'Thumbnail (JPEG)' };
  }

  return { category: 'IMAGES', format: 'Image' };
}

/**
 * Extracts clean filename for display
 * @param {string} url 
 * @returns {string}
 */
export function getAssetFilename(url) {
  if (!url) return 'asset';
  if (url.startsWith('data:image/svg')) return 'inline-icon.svg';
  if (url.startsWith('data:')) return 'embedded-asset';
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.length > 0) {
      return last.length > 22 ? last.substring(0, 19) + '...' : last;
    }
  } catch (e) {
    // fallback to string split
  }
  return 'media-asset';
}

/**
 * Scans an element and its subtree for all discoverable media assets
 * @param {Element} element 
 * @returns {Array<Object>}
 */
export function extractElementAssets(element) {
  if (!element || !(element instanceof Element)) return [];

  const assets = [];
  const seenUrls = new Set();

  const addAsset = (rawUrl, type, name = '', width = 'Auto', height = 'Auto') => {
    if (!rawUrl) return;
    const url = normalizeUrl(rawUrl);
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);

    const { category, format } = detectAssetCategory(url);
    assets.push({
      id: 'asset_' + Math.random().toString(36).substring(2, 9),
      url,
      type,       // 'IMAGE' | 'SVG' | 'VIDEO' | 'OTHER'
      category,   // 'PNG' | 'JPG' | 'WEBP' | 'GIF' | 'SVG' | 'VIDEO' | 'OTHER' | 'IMAGES'
      format,
      name: name || getAssetFilename(url),
      width,
      height
    });
  };

  // 1. Scan Element & Descendants for <img> tags
  const imgElements = element.tagName.toLowerCase() === 'img'
    ? [element]
    : Array.from(element.querySelectorAll('img'));

  imgElements.forEach(img => {
    const candidates = [
      img.currentSrc,
      img.src,
      img.getAttribute('data-src'),
      img.getAttribute('data-thumb'),
      img.getAttribute('data-thumbnail-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-lazy-src')
    ].filter(Boolean);

    // Also check srcset
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const srcsetUrls = parseSrcsetUrls(srcset);
      if (srcsetUrls.length > 0) {
        candidates.push(srcsetUrls[srcsetUrls.length - 1]); // highest resolution
      }
    }

    const primaryUrl = candidates[0];
    if (primaryUrl) {
      const w = Math.round(img.width || img.naturalWidth || 0);
      const h = Math.round(img.height || img.naturalHeight || 0);
      addAsset(
        primaryUrl,
        'IMAGE',
        img.alt || img.getAttribute('title') || getAssetFilename(primaryUrl),
        w > 0 ? `${w}px` : 'Auto',
        h > 0 ? `${h}px` : 'Auto'
      );
    }
  });

  // 2. Scan <picture> and <source> elements
  const sourceElements = Array.from(element.querySelectorAll('picture source, source'));
  sourceElements.forEach(source => {
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      const urls = parseSrcsetUrls(srcset);
      urls.forEach(u => addAsset(u, 'IMAGE'));
    }
    const src = source.getAttribute('src');
    if (src) addAsset(src, 'IMAGE');
  });

  // 3. Scan CSS Background Images (Inline styles first, then computed styles on relevant nodes)
  const allDescendants = [element, ...Array.from(element.querySelectorAll('*'))];
  // Check inline background-images on all nodes
  allDescendants.forEach(node => {
    const inlineStyle = node.getAttribute('style');
    if (inlineStyle && inlineStyle.includes('url(')) {
      const matches = inlineStyle.match(/url\(['"]?(.*?)['"]?\)/g);
      if (matches) {
        matches.forEach(m => {
          const clean = m.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '').trim();
          if (clean && !clean.startsWith('data:image/svg')) {
            addAsset(clean, 'IMAGE');
          }
        });
      }
    }
  });

  // Check computed background-images on candidate visual elements (limit to 120 elements to avoid reflow spikes)
  const candidateNodes = allDescendants.slice(0, 120);
  candidateNodes.forEach(node => {
    try {
      const cs = window.getComputedStyle(node);
      const bgImg = cs.getPropertyValue('background-image');
      if (bgImg && bgImg !== 'none') {
        const matches = bgImg.match(/url\(['"]?(.*?)['"]?\)/g);
        if (matches) {
          matches.forEach(m => {
            const clean = m.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '').trim();
            if (clean && !clean.startsWith('data:image/svg')) {
              addAsset(clean, 'IMAGE');
            }
          });
        }
      }
    } catch (e) {
      // ignore
    }
  });

  // 4. Scan Element & Descendants for Inline SVGs
  const svgElements = element.tagName.toLowerCase() === 'svg'
    ? [element]
    : Array.from(element.querySelectorAll('svg'));

  svgElements.forEach((svg, idx) => {
    try {
      const svgMarkup = svg.outerHTML;
      const svgBlobUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
      const rect = svg.getBoundingClientRect();
      addAsset(
        svgBlobUrl,
        'SVG',
        `icon_${idx + 1}.svg`,
        `${Math.round(rect.width || 24)}px`,
        `${Math.round(rect.height || 24)}px`
      );
    } catch (e) {
      // ignore
    }
  });

  // 5. Scan Element & Descendants for <video>
  const videoElements = element.tagName.toLowerCase() === 'video'
    ? [element]
    : Array.from(element.querySelectorAll('video'));

  videoElements.forEach(vid => {
    const src = vid.currentSrc || vid.src || vid.querySelector('source')?.src;
    if (src) {
      addAsset(src, 'VIDEO', getAssetFilename(src));
    }
  });

  return assets;
}

/**
 * Filters the asset collection by user-selected category tab
 * @param {Array<Object>} assets 
 * @param {string} filter 
 * @returns {Array<Object>}
 */
export function filterAssets(assets, filter = 'All') {
  if (!assets || !Array.isArray(assets)) return [];
  if (!filter || filter === 'All') return assets;

  const f = filter.toUpperCase();
  switch (f) {
    case 'IMAGES':
      return assets.filter(a => a.type === 'IMAGE' || a.category === 'IMAGES');
    case 'SVG':
      return assets.filter(a => a.category === 'SVG');
    case 'PNG':
      return assets.filter(a => a.category === 'PNG');
    case 'JPG':
    case 'JPEG':
      return assets.filter(a => a.category === 'JPG');
    case 'WEBP':
      return assets.filter(a => a.category === 'WEBP');
    case 'GIF':
      return assets.filter(a => a.category === 'GIF');
    case 'OTHER':
      return assets.filter(a => a.category === 'OTHER' || a.type === 'VIDEO');
    default:
      return assets;
  }
}
