import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info, Download, Printer, Save } from 'lucide-react';
import { downloadCsvFile, downloadJsonFile } from '@/utils/exportUtils';

export function SubnetCalculator() {
  const [method, setMethod] = useState<'count' | 'hosts'>('count');
  const [network, setNetwork] = useState('192.168.1.0/24');
  const [value, setValue] = useState('4');
  const [result, setResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadCsv = () => {
    if (!result || !result.subnets) return;
    const data = result.subnets.map((s: any) => ({
      ID: s.id,
      Network: s.network,
      FirstHost: s.first,
      LastHost: s.last,
      Broadcast: s.broadcast,
      Hosts: s.hosts
    }));
    downloadCsvFile(data, 'subnets.csv');
  };

  const handleSaveJson = () => {
    if (!result) return;
    downloadJsonFile(result, 'subnets.json');
  };

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/subnet/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network, method, value })
      });
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to calculate subnets');
      }
    } catch (err) {
      setError('Failed to calculate subnets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit">
        <button 
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${method === 'count' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          onClick={() => setMethod('count')}
        >
          By Number of Subnets
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${method === 'hosts' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          onClick={() => setMethod('hosts')}
        >
          By Hosts per Subnet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Enter base network and requirements.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Base Network</Label>
              <Input value={network} onChange={e => setNetwork(e.target.value)} placeholder="192.168.1.0/24" />
            </div>
            
            <div className="space-y-2">
              <Label>{method === 'count' ? 'Number of Subnets Needed' : 'Hosts Needed per Subnet'}</Label>
              <Input type="number" value={value} onChange={e => setValue(e.target.value)} min="1" />
              {method === 'count' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {[2, 4, 8, 16, 32, 64].map(n => (
                    <button key={n} onClick={() => setValue(n.toString())} className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {result && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Calculation Preview</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Original CIDR:</span>
                  <span className="font-mono font-medium">{result.originalCidr}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Bits to Borrow:</span>
                  <span className="font-mono font-medium text-blue-700 dark:text-blue-400">{result.bitsBorrowed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">New CIDR:</span>
                  <span className="font-mono font-medium text-green-600 dark:text-green-400">{result.newCidr}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subnets Created:</span>
                  <span className="font-mono font-medium">{result.subnetsCreated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Hosts per Subnet:</span>
                  <span className="font-mono font-medium">{result.hostsPerSubnet}</span>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <Button className="w-full" onClick={calculate} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Subnets'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Subnet Allocation</CardTitle>
                <CardDescription>Base Network: {network} &rarr; {result.subnetsCreated} Subnets of {result.newCidr}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" title="Export Table" onClick={handleDownloadCsv}><Download className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" title="Print" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" title="Save JSON" onClick={handleSaveJson}><Save className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {result.isTruncated && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md text-sm border border-yellow-200 dark:border-yellow-900/50">
                  Showing first 100 subnets out of {result.subnetsCreated} total subnets.
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Network</th>
                      <th className="px-4 py-3 font-medium">First Host</th>
                      <th className="px-4 py-3 font-medium">Last Host</th>
                      <th className="px-4 py-3 font-medium">Broadcast</th>
                      <th className="px-4 py-3 font-medium text-right">Hosts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subnets.map((subnet: any) => (
                      <tr key={subnet.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer">
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{subnet.id}</td>
                        <td className="px-4 py-3 font-mono font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          {subnet.network}
                          <Info className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">{subnet.first}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">{subnet.last}</td>
                        <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">{subnet.broadcast}</td>
                        <td className="px-4 py-3 text-right font-medium">{subnet.hosts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center"><Info className="w-3 h-3 mr-1" /> Click on any row for detailed subnet view</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
