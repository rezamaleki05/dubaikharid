const baseUrl = String(process.env.DEPLOYMENT_URL || process.argv[2] || '').trim().replace(/\/$/, '');

if (!baseUrl) {
  console.error('Set DEPLOYMENT_URL or pass an HTTPS deployment URL as the first argument.');
  process.exitCode = 1;
} else {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    console.error('Deployment URL is invalid.');
    process.exitCode = 1;
  }

  if (parsed && !['http:', 'https:'].includes(parsed.protocol)) {
    console.error('Deployment URL must use HTTP or HTTPS.');
    process.exitCode = 1;
  } else if (parsed) {
    const checks = ['/', '/buy-from-dubai', '/robots.txt', '/sitemap.xml', '/api/health', '/api/health/ready'];
    Promise.all(checks.map(async path => {
      const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
      return { path, status: response.status, ok: response.status >= 200 && response.status < 400 };
    }))
      .then(results => {
        console.table(results);
        if (results.some(result => !result.ok)) process.exitCode = 1;
      })
      .catch(error => {
        console.error(`Postdeploy check failed: ${error.message}`);
        process.exitCode = 1;
      });
  }
}
