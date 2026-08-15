const { exec } = require('child_process');
exec('npm run dev', { env: { ...process.env, BACKEND_PORT: 8000, FRONTEND_PORT: 5173, PORT: 8000 } }, (err, stdout, stderr) => {
  if (err) console.error(err);
  console.log(stdout);
  console.error(stderr);
});
