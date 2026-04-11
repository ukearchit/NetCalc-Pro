import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Network, Calculator, Layers, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const [networkInput, setNetworkInput] = useState('');

  const handleAnalyze = () => {
    if (networkInput.trim()) {
      navigate(`/analyzer?network=${encodeURIComponent(networkInput.trim())}`);
    } else {
      navigate('/analyzer');
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Network Analysis Made Simple</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Enter an IP address or CIDR block to instantly calculate subnets, analyze network boundaries, and design complex VLSM architectures.
        </p>
        
        <div className="max-w-xl mx-auto flex gap-4">
          <Input 
            placeholder="Enter Network (e.g., 192.168.1.0/24)" 
            className="h-12 text-lg"
            value={networkInput}
            onChange={(e) => setNetworkInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <Button size="lg" className="h-12 px-8" onClick={handleAnalyze}>
            Analyze
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard 
          title="Network Analyzer"
          description="Detailed breakdown of any IPv4 address or subnet."
          icon={Activity}
          onClick={() => navigate('/analyzer')}
        />
        <FeatureCard 
          title="Subnet Calculator"
          description="Divide networks by required hosts or subnet count."
          icon={Calculator}
          onClick={() => navigate('/subnet')}
        />
        <FeatureCard 
          title="VLSM Designer"
          description="Optimize address space with Variable Length Subnet Masks."
          icon={Network}
          onClick={() => navigate('/vlsm')}
        />
        <FeatureCard 
          title="Supernet Calculator"
          description="Combine multiple contiguous networks into a single route."
          icon={Layers}
          onClick={() => navigate('/supernet')}
        />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Calculations</CardTitle>
            <CardDescription>Your recently analyzed networks and designs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'Analysis', network: '10.0.0.0/8', date: '2 hours ago' },
                { type: 'VLSM', network: '192.168.1.0/24', date: 'Yesterday' },
                { type: 'Subnet', network: '172.16.0.0/16', date: '3 days ago' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {item.type === 'Analysis' ? <Activity size={20} /> : item.type === 'VLSM' ? <Network size={20} /> : <Calculator size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.network}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.type}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{item.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">1</div>
                <p>Use CIDR notation (e.g., /24) for faster input instead of full subnet masks.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">2</div>
                <p>In VLSM, always allocate the largest subnets first to minimize wasted space.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">3</div>
                <p>Supernetting requires contiguous networks that align on bit boundaries.</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon, onClick }: any) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 group-hover:bg-blue-600 dark:group-hover:bg-blue-600 transition-colors">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
          Open Tool <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
