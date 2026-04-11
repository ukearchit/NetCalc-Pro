import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { analyzeNetwork, calculateSubnets, calculateVLSM, calculateSupernet } from './utils/ipCalculator.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/network/analyze', (req, res) => {
    try {
      const { network } = req.body;
      if (!network || typeof network !== 'string') {
        return res.status(400).json({ success: false, error: 'Invalid network format' });
      }

      const data = analyzeNetwork(network);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/subnet/calculate', (req, res) => {
    try {
      const { network, method, value } = req.body;
      if (!network || !method || !value) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const data = calculateSubnets(network, method, parseInt(value, 10));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/vlsm/design', (req, res) => {
    try {
      const { baseNetwork, requirements } = req.body;
      if (!baseNetwork || !requirements || !Array.isArray(requirements)) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const data = calculateVLSM(baseNetwork, requirements);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

  app.post('/api/supernet/calculate', (req, res) => {
    try {
      const { networks } = req.body;
      if (!networks || !Array.isArray(networks)) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const data = calculateSupernet(networks);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
