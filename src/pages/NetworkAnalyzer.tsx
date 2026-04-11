import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function NetworkAnalyzer() {
  const [searchParams] = useSearchParams();
  const initialNetwork = searchParams.get('network') || '192.168.1.0/24';

  const [network, setNetwork] = useState(initialNetwork);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('network')) {
      analyzeNetwork(searchParams.get('network')!);
    }
  }, [searchParams]);

  const analyzeNetwork = async (netToAnalyze: string = network) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/network/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network: netToAnalyze })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to analyze network');
      }
    } catch (err) {
      setError('Failed to analyze network');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Network Analyzer</CardTitle>
          <CardDescription>Enter an IP address and subnet mask or CIDR notation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="network">IP Address / CIDR</Label>
              <Input 
                id="network" 
                value={network} 
                onChange={(e) => setNetwork(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && analyzeNetwork()}
                placeholder="e.g., 192.168.1.0/24"
              />
            </div>
            <Button onClick={() => analyzeNetwork()} disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Analyzing...' : 'Analyze Network'}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> {error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <Card className="lg:col-span-2 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">Network: {result.networkId}{result.cidr}</h3>
                  <p className="text-blue-700 dark:text-blue-400 font-medium flex items-center">
                    Class {result.ipClass} &bull; {result.isPrivate ? 'Private Network' : 'Public Network'} &bull; {result.usableHosts.toLocaleString()} Usable Hosts
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Network</p>
                    <p className="font-mono font-bold text-gray-900 dark:text-gray-100">{result.networkId}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">First Host</p>
                    <p className="font-mono font-bold text-green-600 dark:text-green-400">{result.firstUsableHost}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Last Host</p>
                    <p className="font-mono font-bold text-green-600 dark:text-green-400">{result.lastUsableHost}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <ResultRow label="Network ID" value={result.networkId} onCopy={() => copyToClipboard(result.networkId)} />
                <ResultRow label="Broadcast" value={result.broadcastAddress} onCopy={() => copyToClipboard(result.broadcastAddress)} />
                <ResultRow label="First Host" value={result.firstUsableHost} onCopy={() => copyToClipboard(result.firstUsableHost)} />
                <ResultRow label="Last Host" value={result.lastUsableHost} onCopy={() => copyToClipboard(result.lastUsableHost)} />
                <ResultRow label="Subnet Mask" value={result.subnetMask} onCopy={() => copyToClipboard(result.subnetMask)} />
                <ResultRow label="Wildcard Mask" value={result.wildcardMask} onCopy={() => copyToClipboard(result.wildcardMask)} />
                <ResultRow label="CIDR Notation" value={result.cidr} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Host Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <ResultRow label="Total Addresses" value={result.totalHosts.toLocaleString()} />
                <ResultRow label="Usable Hosts" value={result.usableHosts.toLocaleString()} />
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Efficiency</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{((result.usableHosts / result.totalHosts) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 dark:bg-blue-600 rounded-full" style={{ width: `${(result.usableHosts / result.totalHosts) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">{result.usableHosts} usable / {result.totalHosts} total</p>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Binary View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm space-y-3 bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                <div className="flex justify-between">
                  <span className="text-gray-400 w-32">IP Address:</span>
                  <span className="tracking-widest">{result.binaryIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 w-32">Subnet Mask:</span>
                  <span className="tracking-widest text-blue-400">{result.binaryMask}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-gray-400 w-32">Network ID:</span>
                  <span className="tracking-widest text-green-400">{result.binaryNetwork}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 w-32">Broadcast:</span>
                  <span className="tracking-widest text-red-400">{result.binaryBroadcast}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, onCopy }: { label: string, value: string | number, onCopy?: () => void }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 flex items-center">
        {value}
        {onCopy && (
          <button onClick={onCopy} className="ml-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Copy to clipboard">
            <Copy className="w-4 h-4" />
          </button>
        )}
      </dd>
    </div>
  );
}
