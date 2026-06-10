import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('API fungerar!');
});

app.listen(PORT, () => {
  console.log(`Servern körs på port ${PORT}`);
});