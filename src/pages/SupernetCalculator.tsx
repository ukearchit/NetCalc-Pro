import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ClipboardPaste, Upload, Trash2, CheckCircle2, AlertCircle, Download, Printer, Save, Share2, Info, Copy } from 'lucide-react';
import { downloadTextFile, downloadJsonFile } from '@/utils/exportUtils';

export function SupernetCalculator() {
  const [networks, setNetworks] = useState('192.168.0.0/24\n192.168.1.0/24\n192.168.2.0/24\n192.168.3.0/24');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setNetworks(prev => prev ? `${prev}\n${text}` : text);
      }
    } catch (err) {
      setError('Failed to read from clipboard. Please paste manually.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setNetworks(content);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be imported again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadTextFile(
      `Supernet: ${result.supernet}\nSubnet Mask: ${result.subnetMask}\nWildcard Mask: ${result.wildcardMask}\nRange: ${result.range}\nTotal Addresses: ${result.totalAddresses}\nUsable Hosts: ${result.usableHosts}`,
      'supernet-result.txt'
    );
  };

  const handleSave = () => {
    if (!result) return;
    downloadJsonFile(result, 'supernet-result.json');
  };

  const handleCopyConfig = () => {
    if (!result) return;
    const config = `ip route ${result.supernet.split('/')[0]} ${result.subnetMask} [next-hop]
! Summarizes:
${networks.split('\n').filter(n => n.trim()).map(n => `!   ${n}`).join('\n')}`;
    navigator.clipboard.writeText(config);
  };

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const networkList = networks.split('\n').map(n => n.trim()).filter(n => n);
      const res = await fetch('/api/supernet/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networks: networkList })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to calculate supernet');
      }
    } catch (err) {
      setError('Failed to calculate supernet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Supernet Calculator</CardTitle>
            <CardDescription>Enter contiguous networks to combine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Networks (One per line in CIDR)</Label>
              <textarea 
                className="w-full h-48 p-3 text-sm font-mono border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                value={networks}
                onChange={(e) => setNetworks(e.target.value)}
                placeholder="192.168.0.0/24&#10;192.168.1.0/24"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handlePaste}><ClipboardPaste className="w-4 h-4 mr-2" /> Paste</Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Import</Button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".txt,.csv" className="hidden" />
              <Button variant="outline" size="sm" className="flex-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setNetworks('')}><Trash2 className="w-4 h-4 mr-2" /> Clear</Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Validation Status</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 dark:text-green-400" /> {networks.split('\n').filter(n => n.trim()).length} networks entered</li>
              </ul>
              {error && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center text-red-600 dark:text-red-400 font-medium text-sm">
                  <AlertCircle className="w-5 h-5 mr-2" /> {error}
                </div>
              )}
              {!error && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center text-green-600 dark:text-green-400 font-medium text-sm">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Ready to calculate supernet
                </div>
              )}
            </div>

            <Button className="w-full" onClick={calculate} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Supernet'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Calculation Results</CardTitle>
                  <CardDescription>Optimal route summarization.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Export" onClick={handleDownload}><Download className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" title="Print" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" title="Save JSON" onClick={handleSave}><Save className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Calculated Supernet</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">Supernet Address:</dt>
                          <dd className="font-mono font-bold text-blue-700 dark:text-blue-400">{result.supernet}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">Subnet Mask:</dt>
                          <dd className="font-mono">{result.subnetMask}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">Wildcard Mask:</dt>
                          <dd className="font-mono">{result.wildcardMask}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">Network Range:</dt>
                          <dd className="font-mono text-xs">{result.range}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">Total Addresses:</dt>
                          <dd className="font-medium">{result.totalAddresses.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600 dark:text-gray-400">Usable Hosts:</dt>
                          <dd className="font-medium">{result.usableHosts.toLocaleString()}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Routing Optimization</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">Before:</dt>
                          <dd className="font-medium text-gray-900 dark:text-gray-100">{result.originalCount} routing table entries</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">After:</dt>
                          <dd className="font-medium text-green-600 dark:text-green-400">1 routing table entry</dd>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-800 mt-2">
                          <dt className="font-semibold text-gray-900 dark:text-gray-100">Reduction:</dt>
                          <dd className="font-bold text-blue-600 dark:text-blue-400">{result.reduction}%</dd>
                        </div>
                      </dl>
                      
                      <div className="mt-4">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-green-500 dark:bg-green-600" style={{ width: `${result.reduction}%` }}></div>
                          <div className="h-full bg-gray-300 dark:bg-gray-700" style={{ width: `${100 - result.reduction}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                          <Info className="w-3 h-3 mr-1" /> This supernet reduces routing overhead by {result.reduction}%.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                      <h4 className="text-gray-400 mb-3 font-sans font-semibold">Binary Analysis</h4>
                      <p className="text-gray-500 mb-2">Network portion (3rd octet):</p>
                      <ul className="space-y-1 text-xs">
                        <li>192.168.0.0/24 &rarr; 000000<span className="text-blue-400">00</span></li>
                        <li>192.168.1.0/24 &rarr; 000000<span className="text-blue-400">01</span></li>
                        <li>192.168.2.0/24 &rarr; 000000<span className="text-blue-400">10</span></li>
                        <li>192.168.3.0/24 &rarr; 000000<span className="text-blue-400">11</span></li>
                      </ul>
                      <div className="border-t border-gray-700 my-3"></div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Common bits:</span>
                          <span className="text-green-400">{result.binary.commonBits} ({result.binary.matchCount} bits match)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Supernet CIDR:</span>
                          <span className="text-blue-400">{result.binary.cidr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Export Configuration</h4>
                      <div className="flex gap-2 mb-3">
                        <Button variant="outline" size="sm" className="flex-1 bg-white dark:bg-gray-800">Cisco IOS</Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-white dark:bg-gray-800">Juniper</Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-white dark:bg-gray-800">Generic</Button>
                      </div>
                      <div className="bg-gray-900 dark:bg-black text-gray-300 p-3 rounded-md font-mono text-xs overflow-x-auto">
                        <pre>
{`ip route ${result.supernet.split('/')[0]} ${result.subnetMask} [next-hop]
! Summarizes:
!   192.168.0.0/24
!   192.168.1.0/24
!   192.168.2.0/24
!   192.168.3.0/24`}
                        </pre>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={handleCopyConfig}><Copy className="w-4 h-4 mr-2" /> Copy Config</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
