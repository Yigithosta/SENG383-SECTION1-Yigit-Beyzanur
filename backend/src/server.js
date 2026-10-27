const { createApp } = require('./app');

const PORT = process.env.PORT || 3001;

createApp().listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
