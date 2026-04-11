import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Edit2, ArrowUpDown, Plus, ArrowRight, ArrowLeft, Info, Download, Printer, Save, Share2 } from 'lucide-react';
import { downloadCsvFile, downloadJsonFile } from '@/utils/exportUtils';

export function VLSMDesigner() {
  const [step, setStep] = useState(1);
  const [baseNetwork, setBaseNetwork] = useState('10.0.0.0/24');
  const [requirements, setRequirements] = useState([
    { id: 1, name: 'Sales Dept', hosts: 50 },
    { id: 2, name: 'IT Department', hosts: 25 },
    { id: 3, name: 'HR Department', hosts: 12 },
    { id: 4, name: 'Management', hosts: 5 },
    { id: 5, name: 'WAN Link 1', hosts: 2 },
  ]);

  const [results, setResults] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownloadCsv = () => {
    if (!results || !results.allocations) return;
    const data = results.allocations.map((a: any) => ({
      Name: a.name,
      RequiredHosts: a.req,
      AvailableHosts: a.avail,
      Network: a.network,
      Mask: a.mask,
      HostRange: a.range
    }));
    downloadCsvFile(data, 'vlsm-allocations.csv');
  };

  const handleSaveJson = () => {
    if (!results) return;
    downloadJsonFile(results, 'vlsm-results.json');
  };

  const calculateVLSM = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vlsm/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseNetwork, requirements })
      });
      const data = await res.json();
      
      if (data.success) {
        setResults(data.data);
        setStep(3);
      } else {
        setError(data.error || 'Failed to calculate VLSM');
      }
    } catch (err) {
      setError('Failed to calculate VLSM');
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, { id: Date.now(), name: `Subnet ${requirements.length + 1}`, hosts: 10 }]);
  };

  const removeRequirement = (id: number) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  const updateRequirement = (id: number, field: string, value: any) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>1</div>
          <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>2</div>
          <div className={`h-1 w-16 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>3</div>
        </div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Step {step} of 3: {step === 1 ? 'Base Network' : step === 2 ? 'Requirements' : 'Results'}
        </div>
      </div>

      {step === 1 && (
        <Card className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Enter Base Network</CardTitle>
            <CardDescription>Define the starting address space for your VLSM design.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Base Network (CIDR)</Label>
              <Input value={baseNetwork} onChange={e => setBaseNetwork(e.target.value)} placeholder="e.g., 10.0.0.0/24" className="text-lg h-12" />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Network Details</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>&bull; Total Available Addresses: 256</li>
                <li>&bull; Maximum Subnets Possible: Varies by requirements</li>
              </ul>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} className="w-full sm:w-auto">
                Next: Add Requirements <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Define Subnet Requirements</CardTitle>
            <CardDescription>Add the number of hosts needed for each subnet. They will be automatically sorted by size.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border dark:border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-medium w-12">#</th>
                    <th className="px-4 py-3 font-medium">Subnet Name</th>
                    <th className="px-4 py-3 font-medium w-48">Hosts Required</th>
                    <th className="px-4 py-3 font-medium w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((req, index) => (
                    <tr key={req.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Input value={req.name} onChange={e => updateRequirement(req.id, 'name', e.target.value)} className="h-8" />
                      </td>
                      <td className="px-4 py-3">
                        <Input type="number" value={req.hosts} onChange={e => updateRequirement(req.id, 'hosts', parseInt(e.target.value) || 0)} className="h-8" min="1" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><ArrowUpDown className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400" onClick={() => removeRequirement(req.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Button variant="outline" onClick={addRequirement} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" /> Add New Requirement
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                Total Hosts Required: <strong className="ml-1 text-gray-900 dark:text-gray-100">{requirements.reduce((acc, curr) => acc + curr.hosts, 0)}</strong>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="flex items-center gap-4">
                {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
                <Button onClick={calculateVLSM} disabled={loading}>
                  {loading ? 'Calculating...' : 'Review & Calculate'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && results && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>VLSM Allocation Results</CardTitle>
                <CardDescription>Base Network: {baseNetwork}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" title="Export Table" onClick={handleDownloadCsv}><Download className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" title="Print" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" title="Save JSON" onClick={handleSaveJson}><Save className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border dark:border-gray-800 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Subnet Name</th>
                      <th className="px-4 py-3 font-medium text-right">Req</th>
                      <th className="px-4 py-3 font-medium text-right">Avail</th>
                      <th className="px-4 py-3 font-medium">Network</th>
                      <th className="px-4 py-3 font-medium">Mask</th>
                      <th className="px-4 py-3 font-medium">Host Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.allocations.map((alloc: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{alloc.name}</td>
                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{alloc.req}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">{alloc.avail}</td>
                        <td className="px-4 py-3 font-mono font-medium text-blue-700 dark:text-blue-400">{alloc.network}</td>
                        <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">{alloc.mask}</td>
                        <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300 flex justify-between items-center">
                          {alloc.range}
                          <Info className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Efficiency Analysis</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Total Allocated:</dt>
                      <dd className="font-medium text-gray-900 dark:text-gray-100">{results.efficiency.totalAllocated} addresses</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Total Available:</dt>
                      <dd className="font-medium text-gray-900 dark:text-gray-100">{results.efficiency.totalAvailable} addresses</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Wasted Addresses:</dt>
                      <dd className="font-medium text-red-600 dark:text-red-400">{results.efficiency.wastedAddresses} addresses</dd>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-800 mt-2">
                      <dt className="font-semibold text-gray-900 dark:text-gray-100">Efficiency:</dt>
                      <dd className="font-bold text-blue-600 dark:text-blue-400">{results.efficiency.percentage}%</dd>
                    </div>
                  </dl>
                  
                  <div className="mt-4">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500 dark:bg-blue-600" style={{ width: `${results.efficiency.percentage}%` }}></div>
                      <div className="h-full bg-red-400 dark:bg-red-500" style={{ width: `${100 - results.efficiency.percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                      <span>Used</span>
                      <span>Wasted</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-100 dark:border-blue-900">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" /> Recommendations
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-disc pl-5">
                    <li>Consider using a smaller base network (e.g., /25) to reduce wasted space.</li>
                    <li>{100 - results.efficiency.percentage}% of the address space is currently unused and reserved for future growth.</li>
                    <li>The current design is optimal for the given requirements.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex justify-start">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
