import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ArrowRightLeft, CheckCircle2, AlertCircle, Download, Printer } from 'lucide-react';
import { ipToBinary, binaryToIp, cidrToMask, maskToCidr, getWildcardMask, analyzeNetwork } from '../../utils/ipCalculator';
import { downloadCsvFile } from '@/utils/exportUtils';

export function Utilities() {
  const [activeTab, setActiveTab] = useState('binary');
  
  // Binary Converter State
  const [ip, setIp] = useState('192.168.1.1');
  const [binary, setBinary] = useState('11000000.10101000.00000001.00000001');
  
  // Mask Converter State
  const [cidr, setCidr] = useState('/24');
  const [mask, setMask] = useState('255.255.255.0');
  const [maskInfo, setMaskInfo] = useState<any>(null);

  // IP Checker State
  const [checkIp, setCheckIp] = useState('192.168.1.100');
  const [checkNetwork, setCheckNetwork] = useState('192.168.1.0/24');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkError, setCheckError] = useState('');

  const tabs = [
    { id: 'binary', label: 'Binary Converter' },
    { id: 'mask', label: 'Mask Converter' },
    { id: 'checker', label: 'IP Checker' },
    { id: 'reference', label: 'Reference Tables' },
  ];

  // Binary Converter Handlers
  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIp(val);
    try {
      if (val.split('.').length === 4) {
        setBinary(ipToBinary(val));
      }
    } catch (e) {}
  };

  const handleBinaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBinary(val);
    try {
      if (val.split('.').length === 4) {
        setIp(binaryToIp(val));
      }
    } catch (e) {}
  };

  // Mask Converter Handlers
  useEffect(() => {
    try {
      const cidrVal = parseInt(cidr.replace('/', ''), 10);
      if (cidrVal >= 0 && cidrVal <= 32) {
        const calculatedMask = cidrToMask(cidrVal);
        if (mask !== calculatedMask) setMask(calculatedMask);
        
        const totalAddresses = Math.pow(2, 32 - cidrVal);
        setMaskInfo({
          networkBits: cidrVal,
          hostBits: 32 - cidrVal,
          totalAddresses,
          usableHosts: cidrVal < 31 ? totalAddresses - 2 : totalAddresses,
          wildcard: getWildcardMask(calculatedMask),
          binary: ipToBinary(calculatedMask)
        });
      }
    } catch (e) {}
  }, [cidr]);

  const handleMaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMask(val);
    try {
      if (val.split('.').length === 4) {
        const calculatedCidr = `/${maskToCidr(val)}`;
        if (cidr !== calculatedCidr) setCidr(calculatedCidr);
      }
    } catch (e) {}
  };

  // IP Checker Handlers
  const handleCheckIp = () => {
    setCheckError('');
    setCheckResult(null);
    try {
      const netInfo = analyzeNetwork(checkNetwork);
      const ipParts = checkIp.split('.').map(Number);
      const netParts = netInfo.networkId.split('.').map(Number);
      const broadParts = netInfo.broadcastAddress.split('.').map(Number);
      
      const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
      const netInt = (netParts[0] << 24) | (netParts[1] << 16) | (netParts[2] << 8) | netParts[3];
      const broadInt = (broadParts[0] << 24) | (broadParts[1] << 16) | (broadParts[2] << 8) | broadParts[3];
      
      const isInside = ipInt >= netInt && ipInt <= broadInt;
      
      setCheckResult({
        isInside,
        networkId: netInfo.networkId,
        broadcast: netInfo.broadcastAddress,
        firstHost: netInfo.firstUsableHost,
        lastHost: netInfo.lastUsableHost,
        position: isInside ? ipInt - netInt : null
      });
    } catch (e) {
      setCheckError('Invalid IP or Network format');
    }
  };

  const referenceData = [
    { cidr: '/8', mask: '255.0.0.0', wildcard: '0.255.255.255', hosts: '16.7M', subnets: '1' },
    { cidr: '/16', mask: '255.255.0.0', wildcard: '0.0.255.255', hosts: '65,534', subnets: '256' },
    { cidr: '/24', mask: '255.255.255.0', wildcard: '0.0.0.255', hosts: '254', subnets: '65,536' },
    { cidr: '/25', mask: '255.255.255.128', wildcard: '0.0.0.127', hosts: '126', subnets: '131,072' },
    { cidr: '/26', mask: '255.255.255.192', wildcard: '0.0.0.63', hosts: '62', subnets: '262,144' },
    { cidr: '/27', mask: '255.255.255.224', wildcard: '0.0.0.31', hosts: '30', subnets: '524,288' },
    { cidr: '/28', mask: '255.255.255.240', wildcard: '0.0.0.15', hosts: '14', subnets: '1,048,576' },
    { cidr: '/29', mask: '255.255.255.248', wildcard: '0.0.0.7', hosts: '6', subnets: '2,097,152' },
    { cidr: '/30', mask: '255.255.255.252', wildcard: '0.0.0.3', hosts: '2', subnets: '4,194,304' },
  ];

  const handleDownloadReference = () => {
    downloadCsvFile(referenceData, 'cidr-reference.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit flex-wrap gap-1">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'binary' && (
        <Card className="animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Binary Conversion Tool</CardTitle>
            <CardDescription>Convert IP addresses to binary and vice versa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <div className="flex gap-2">
                  <Input value={ip} onChange={handleIpChange} />
                  <Button variant="outline" size="icon"><ArrowRightLeft className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Binary</Label>
                <Input value={binary} onChange={handleBinaryChange} className="font-mono" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Visual Breakdown</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-sm">
                {binary.split('.').map((bin, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700 shadow-sm">
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Octet {i + 1}:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">{bin}</span> = {parseInt(bin, 2)}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400">Integer Value:</span>
                  <span className="font-mono font-medium dark:text-gray-200">
                    {ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700 shadow-sm">
                  <span className="text-gray-500 dark:text-gray-400">Hexadecimal:</span>
                  <span className="font-mono font-medium dark:text-gray-200">
                    {ip.split('.').map(octet => parseInt(octet, 10).toString(16).padStart(2, '0').toUpperCase()).join('.')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(binary)}><Copy className="w-4 h-4 mr-2" /> Copy Binary</Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(ip)}><Copy className="w-4 h-4 mr-2" /> Copy Decimal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'mask' && (
        <Card className="animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Subnet Mask Converter</CardTitle>
            <CardDescription>Convert between CIDR, decimal, binary, and wildcard formats.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CIDR Notation</Label>
                  <div className="flex gap-2">
                    <Input value={cidr} onChange={e => setCidr(e.target.value)} />
                    <Button variant="outline" size="icon"><ArrowRightLeft className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Decimal Notation</Label>
                  <div className="flex gap-2">
                    <Input value={mask} onChange={handleMaskChange} />
                    <Button variant="outline" size="icon"><ArrowRightLeft className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Binary</Label>
                  <Input value={maskInfo?.binary || ''} readOnly className="font-mono bg-gray-50 dark:bg-gray-900" />
                </div>
                <div className="space-y-2">
                  <Label>Wildcard Mask</Label>
                  <Input value={maskInfo?.wildcard || ''} readOnly className="font-mono bg-gray-50 dark:bg-gray-900" />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-6 flex flex-col justify-center">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-4">Mask Information</h4>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-gray-700">
                    <dt className="text-gray-600 dark:text-gray-400">Network Bits:</dt>
                    <dd className="font-medium text-blue-700 dark:text-blue-400">{maskInfo?.networkBits}</dd>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-gray-700">
                    <dt className="text-gray-600 dark:text-gray-400">Host Bits:</dt>
                    <dd className="font-medium text-blue-700 dark:text-blue-400">{maskInfo?.hostBits}</dd>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-gray-700">
                    <dt className="text-gray-600 dark:text-gray-400">Total Addresses:</dt>
                    <dd className="font-medium dark:text-gray-200">{maskInfo?.totalAddresses?.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-gray-700">
                    <dt className="text-gray-600 dark:text-gray-400">Usable Hosts:</dt>
                    <dd className="font-medium dark:text-gray-200">{maskInfo?.usableHosts?.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm border border-blue-100 dark:border-gray-700">
                    <dt className="text-gray-600 dark:text-gray-400">Block Size:</dt>
                    <dd className="font-medium dark:text-gray-200">{maskInfo?.totalAddresses}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'checker' && (
        <Card className="animate-in fade-in slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>IP Address Checker</CardTitle>
            <CardDescription>Check if an IP belongs to a specific network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <Label>IP Address</Label>
                <Input value={checkIp} onChange={e => setCheckIp(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Network (CIDR)</Label>
                <Input value={checkNetwork} onChange={e => setCheckNetwork(e.target.value)} />
              </div>
            </div>
            <Button className="w-full md:w-auto" onClick={handleCheckIp}>Check IP</Button>

            {checkError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {checkError}
              </div>
            )}

            {checkResult && (
              <div className={`${checkResult.isInside ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'} border rounded-lg p-6`}>
                <div className={`flex items-center font-medium mb-4 ${checkResult.isInside ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {checkResult.isInside ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                  {checkIp} IS {checkResult.isInside ? '' : 'NOT '}in network {checkNetwork}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                  <div className={`flex justify-between bg-white dark:bg-gray-800 p-3 rounded-md border shadow-sm ${checkResult.isInside ? 'border-green-100 dark:border-green-900/50' : 'border-red-100 dark:border-red-900/50'}`}>
                    <span className="text-gray-500 dark:text-gray-400">Network ID:</span>
                    <span className="font-mono font-medium dark:text-gray-200">{checkResult.networkId}</span>
                  </div>
                  <div className={`flex justify-between bg-white dark:bg-gray-800 p-3 rounded-md border shadow-sm ${checkResult.isInside ? 'border-green-100 dark:border-green-900/50' : 'border-red-100 dark:border-red-900/50'}`}>
                    <span className="text-gray-500 dark:text-gray-400">Broadcast:</span>
                    <span className="font-mono font-medium dark:text-gray-200">{checkResult.broadcast}</span>
                  </div>
                  <div className={`flex justify-between bg-white dark:bg-gray-800 p-3 rounded-md border shadow-sm ${checkResult.isInside ? 'border-green-100 dark:border-green-900/50' : 'border-red-100 dark:border-red-900/50'}`}>
                    <span className="text-gray-500 dark:text-gray-400">First Host:</span>
                    <span className="font-mono font-medium dark:text-gray-200">{checkResult.firstHost}</span>
                  </div>
                  <div className={`flex justify-between bg-white dark:bg-gray-800 p-3 rounded-md border shadow-sm ${checkResult.isInside ? 'border-green-100 dark:border-green-900/50' : 'border-red-100 dark:border-red-900/50'}`}>
                    <span className="text-gray-500 dark:text-gray-400">Last Host:</span>
                    <span className="font-mono font-medium dark:text-gray-200">{checkResult.lastHost}</span>
                  </div>
                  {checkResult.isInside && (
                    <div className="col-span-1 sm:col-span-2 flex justify-between bg-white dark:bg-gray-800 p-3 rounded-md border border-green-100 dark:border-green-900/50 shadow-sm">
                      <span className="text-gray-500 dark:text-gray-400">Your IP Position:</span>
                      <span className="font-medium text-green-700 dark:text-green-400">{checkResult.position}th address in subnet</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reference' && (
        <Card className="animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>CIDR Quick Reference</CardTitle>
              <CardDescription>Common subnet masks and their properties.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" title="Download CSV" onClick={handleDownloadReference}><Download className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" title="Print" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border dark:border-gray-800 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">CIDR</th>
                    <th className="px-4 py-3 font-medium">Mask</th>
                    <th className="px-4 py-3 font-medium">Wildcard</th>
                    <th className="px-4 py-3 font-medium text-right">Hosts</th>
                    <th className="px-4 py-3 font-medium text-right">Subnets</th>
                  </tr>
                </thead>
                <tbody>
                  {referenceData.map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-400">{row.cidr}</td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{row.mask}</td>
                      <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-500">{row.wildcard}</td>
                      <td className="px-4 py-3 text-right font-medium dark:text-gray-200">{row.hosts}</td>
                      <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{row.subnets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
