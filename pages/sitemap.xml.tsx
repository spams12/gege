import { GetStaticPropsContext } from 'next';
import { fetchAllProducts } from '../src/services/products';
import { Product } from '../src/types';
import fs from 'fs';
import path from 'path';

const YOUR_DOMAIN = 'https://yourdomain.com';

function generateSitemapXml(staticPaths: string[], productPaths: string[], auctionPaths: string[]) {
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Static Pages
  staticPaths.forEach(pagePath => {
    let priority = '0.7';
    if (pagePath === '/') {
      priority = '1.0';
    }
    sitemap += `
  <url>
    <loc>${YOUR_DOMAIN}${pagePath}</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>${priority}</priority>
  </url>`;
  });

  // Product Pages
  productPaths.forEach(pagePath => {
    sitemap += `
  <url>
    <loc>${YOUR_DOMAIN}${pagePath}</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.8</priority>
  </url>`;
  });

  // Auction Pages
  auctionPaths.forEach(pagePath => {
    sitemap += `
  <url>
    <loc>${YOUR_DOMAIN}${pagePath}</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>0.8</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;
  return sitemap;
}

export async function getStaticProps() {
  // 1. Identify Static Routes
  const staticPages = [
    '/',
    '/about',
    '/account',
    '/auth',
    '/cart',
    '/checkout',
    '/complete-order',
    '/user-info',
    '/products',
    '/auctions',
  ];

  // 2. Fetch Dynamic Routes (Products and Auctions)
  let products: Product[] = [];
  try {
    products = await fetchAllProducts();
  } catch (error) {
    console.error('Error fetching products for sitemap generation:', error);
    // If fetching fails, proceed with static pages only
  }

  const productPaths = products.map(product => `/products/${product.id}`);
  const auctionPaths = products
    .filter(product => product.isAuction)
    .map(product => `/auctions/${product.id}`);

  const sitemapXml = generateSitemapXml(staticPages, productPaths, auctionPaths);

  // Write Sitemap File to public directory
  const publicDir = path.join(process.cwd(), 'public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
  console.log(`Sitemap generated at ${sitemapPath}`);

  return {
    props: {}, // An empty props object is required
  };
}

// A default export is required for a Next.js page, even if it's just for getStaticProps
export default function Sitemap() {
  return null;
}