/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NetworkAnalyzer } from './pages/NetworkAnalyzer';
import { SubnetCalculator } from './pages/SubnetCalculator';
import { VLSMDesigner } from './pages/VLSMDesigner';
import { SupernetCalculator } from './pages/SupernetCalculator';
import { Utilities } from './pages/Utilities';

import { ThemeProvider } from './components/theme-provider';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem attribute="class">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="analyzer" element={<NetworkAnalyzer />} />
            <Route path="subnet" element={<SubnetCalculator />} />
            <Route path="vlsm" element={<VLSMDesigner />} />
            <Route path="supernet" element={<SupernetCalculator />} />
            <Route path="utilities" element={<Utilities />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
