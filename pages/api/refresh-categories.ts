import { dbAdmin } from '../../src/lib/firebaseAdmin';
import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  const { authorization } = req.headers;
  const token = authorization?.split(' ')[1];

  if (!token || token !== process.env.REFRESH_CACHE_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!dbAdmin) {
    return res.status(500).json({ error: 'Firebase Admin is not initialized.' });
  }

  try {
    const categoriesSnapshot = await dbAdmin.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const cacheDir = path.resolve(process.cwd(), 'public/cached-data');
    const cacheFile = path.resolve(cacheDir, 'categories.json');

    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(categories, null, 2));

    res.status(200).json({ message: 'Cache refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing categories cache:', error);
    res.status(500).json({ error: 'Error refreshing categories cache' });
  }
}