export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/teacher/',
        '/student/',
        '/quiz/',
        '/api/'
      ],
    },
    sitemap: 'https://e-examiner.vercel.app/sitemap.xml',
  };
}
