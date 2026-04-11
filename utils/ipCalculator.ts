export function ipToBinary(ip: string): string {
  return ip.split('.').map(octet => parseInt(octet, 10).toString(2).padStart(8, '0')).join('.');
}

export function binaryToIp(binary: string): string {
  return binary.split('.').map(bin => parseInt(bin, 2).toString(10)).join('.');
}

export function cidrToMask(cidr: number): string {
  const mask = [];
  for (let i = 0; i < 4; i++) {
    const n = Math.min(cidr, 8);
    mask.push(256 - Math.pow(2, 8 - n));
    cidr -= n;
  }
  return mask.join('.');
}

export function maskToCidr(mask: string): number {
  return mask.split('.').reduce((acc, octet) => {
    return acc + parseInt(octet, 10).toString(2).split('1').length - 1;
  }, 0);
}

export function getWildcardMask(subnetMask: string): string {
  return subnetMask.split('.').map(octet => 255 - parseInt(octet, 10)).join('.');
}

export function getNetworkAddress(ip: string, mask: string): string {
  const ipParts = ip.split('.');
  const maskParts = mask.split('.');
  return ipParts.map((part, i) => parseInt(part, 10) & parseInt(maskParts[i], 10)).join('.');
}

export function getBroadcastAddress(network: string, wildcard: string): string {
  const netParts = network.split('.');
  const wildParts = wildcard.split('.');
  return netParts.map((part, i) => parseInt(part, 10) | parseInt(wildParts[i], 10)).join('.');
}

export function getIpClass(ip: string): string {
  const firstOctet = parseInt(ip.split('.')[0], 10);
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'E (Experimental)';
  return 'Unknown';
}

export function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

export function analyzeNetwork(input: string) {
  let ip = '';
  let cidr = 0;
  let mask = '';

  if (input.includes('/')) {
    const parts = input.split('/');
    ip = parts[0];
    cidr = parseInt(parts[1], 10);
    mask = cidrToMask(cidr);
  } else if (input.includes(' ')) {
    const parts = input.split(' ');
    ip = parts[0];
    mask = parts[1];
    cidr = maskToCidr(mask);
  } else {
    throw new Error('Invalid input format. Use CIDR (e.g., 192.168.1.0/24) or IP and Mask (e.g., 192.168.1.0 255.255.255.0)');
  }

  const wildcardMask = getWildcardMask(mask);
  const networkId = getNetworkAddress(ip, mask);
  const broadcastAddress = getBroadcastAddress(networkId, wildcardMask);
  
  const netParts = networkId.split('.').map(Number);
  const broadParts = broadcastAddress.split('.').map(Number);
  
  const firstUsableHost = cidr < 31 ? `${netParts[0]}.${netParts[1]}.${netParts[2]}.${netParts[3] + 1}` : networkId;
  const lastUsableHost = cidr < 31 ? `${broadParts[0]}.${broadParts[1]}.${broadParts[2]}.${broadParts[3] - 1}` : broadcastAddress;
  
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr < 31 ? totalHosts - 2 : totalHosts;

  return {
    ipAddress: ip,
    subnetMask: mask,
    cidr: `/${cidr}`,
    networkId,
    broadcastAddress,
    firstUsableHost,
    lastUsableHost,
    totalHosts,
    usableHosts,
    wildcardMask,
    ipClass: getIpClass(ip),
    isPrivate: isPrivateIp(ip),
    binaryIp: ipToBinary(ip),
    binaryMask: ipToBinary(mask),
    binaryNetwork: ipToBinary(networkId),
    binaryBroadcast: ipToBinary(broadcastAddress)
  };
}

export function calculateSubnets(network: string, method: 'count' | 'hosts', value: number) {
  const base = analyzeNetwork(network);
  const currentCidr = parseInt(base.cidr.replace('/', ''), 10);
  
  let bitsBorrowed = 0;
  let newCidr = currentCidr;
  let subnetsCreated = 0;
  let hostsPerSubnet = 0;

  if (method === 'count') {
    bitsBorrowed = Math.ceil(Math.log2(value));
    newCidr = currentCidr + bitsBorrowed;
    if (newCidr > 32) throw new Error('Not enough bits to create requested subnets');
    subnetsCreated = Math.pow(2, bitsBorrowed);
    hostsPerSubnet = Math.pow(2, 32 - newCidr) - 2;
  } else {
    const requiredHosts = value + 2; // +2 for network and broadcast
    const hostBits = Math.ceil(Math.log2(requiredHosts));
    newCidr = 32 - hostBits;
    if (newCidr < currentCidr) throw new Error('Requested hosts exceed available space in base network');
    bitsBorrowed = newCidr - currentCidr;
    subnetsCreated = Math.pow(2, bitsBorrowed);
    hostsPerSubnet = Math.pow(2, 32 - newCidr) - 2;
  }

  const subnets = [];
  const baseIpParts = base.networkId.split('.').map(Number);
  let currentIpInt = (baseIpParts[0] << 24) | (baseIpParts[1] << 16) | (baseIpParts[2] << 8) | baseIpParts[3];
  const increment = Math.pow(2, 32 - newCidr);

  // Limit to 100 subnets for performance in UI
  const limit = Math.min(subnetsCreated, 100);

  for (let i = 0; i < limit; i++) {
    const netParts = [
      (currentIpInt >>> 24) & 255,
      (currentIpInt >>> 16) & 255,
      (currentIpInt >>> 8) & 255,
      currentIpInt & 255
    ];
    
    const broadcastInt = currentIpInt + increment - 1;
    const broadParts = [
      (broadcastInt >>> 24) & 255,
      (broadcastInt >>> 16) & 255,
      (broadcastInt >>> 8) & 255,
      broadcastInt & 255
    ];

    subnets.push({
      id: i + 1,
      network: `${netParts.join('.')}/${newCidr}`,
      first: `${netParts[0]}.${netParts[1]}.${netParts[2]}.${netParts[3] + 1}`,
      last: `${broadParts[0]}.${broadParts[1]}.${broadParts[2]}.${broadParts[3] - 1}`,
      broadcast: broadParts.join('.'),
      hosts: hostsPerSubnet
    });

    currentIpInt += increment;
  }

  return {
    originalCidr: base.cidr,
    newCidr: `/${newCidr}`,
    bitsBorrowed,
    subnetsCreated,
    hostsPerSubnet,
    subnets,
    isTruncated: subnetsCreated > 100
  };
}

export function calculateVLSM(baseNetwork: string, requirements: Array<{ name: string, hosts: number }>) {
  const base = analyzeNetwork(baseNetwork);
  const baseIpParts = base.networkId.split('.').map(Number);
  let currentIpInt = (baseIpParts[0] << 24) | (baseIpParts[1] << 16) | (baseIpParts[2] << 8) | baseIpParts[3];
  
  // Sort requirements descending by hosts
  const sortedReqs = [...requirements].sort((a, b) => b.hosts - a.hosts);
  
  const allocations = [];
  let totalAllocated = 0;

  for (const req of sortedReqs) {
    const requiredHosts = req.hosts + 2; // +2 for network and broadcast
    const hostBits = Math.ceil(Math.log2(requiredHosts));
    const cidr = 32 - hostBits;
    const blockSize = Math.pow(2, hostBits);
    const availableHosts = blockSize - 2;

    const netParts = [
      (currentIpInt >>> 24) & 255,
      (currentIpInt >>> 16) & 255,
      (currentIpInt >>> 8) & 255,
      currentIpInt & 255
    ];
    
    const broadcastInt = currentIpInt + blockSize - 1;
    const broadParts = [
      (broadcastInt >>> 24) & 255,
      (broadcastInt >>> 16) & 255,
      (broadcastInt >>> 8) & 255,
      broadcastInt & 255
    ];

    allocations.push({
      name: req.name,
      req: req.hosts,
      avail: availableHosts,
      network: netParts.join('.'),
      mask: `/${cidr}`,
      range: `${netParts[0]}.${netParts[1]}.${netParts[2]}.${netParts[3] + 1} - ${broadParts[0]}.${broadParts[1]}.${broadParts[2]}.${broadParts[3] - 1}`,
      blockSize
    });

    currentIpInt += blockSize;
    totalAllocated += blockSize;
  }

  const totalAvailable = base.totalHosts;
  const wastedAddresses = totalAvailable - totalAllocated;
  const percentage = ((totalAllocated / totalAvailable) * 100).toFixed(2);

  return {
    allocations,
    efficiency: {
      totalAllocated,
      totalAvailable,
      wastedAddresses,
      percentage
    }
  };
}

export function calculateSupernet(networks: string[]) {
  if (!networks || networks.length === 0) {
    throw new Error('No networks provided');
  }

  // Parse networks
  const parsedNetworks = networks.map(net => {
    const parts = net.split('/');
    if (parts.length !== 2) throw new Error(`Invalid network format: ${net}`);
    return {
      ip: parts[0],
      cidr: parseInt(parts[1], 10),
      ipParts: parts[0].split('.').map(Number)
    };
  });

  // Basic validation: all networks must have the same CIDR for simple supernetting
  const firstCidr = parsedNetworks[0].cidr;
  const allSameCidr = parsedNetworks.every(n => n.cidr === firstCidr);
  
  if (!allSameCidr) {
    throw new Error('All networks must have the same subnet mask for basic supernetting');
  }

  // Find common bits
  let commonBits = 32;
  const firstIpParts = parsedNetworks[0].ipParts;

  for (let i = 1; i < parsedNetworks.length; i++) {
    const currentIpParts = parsedNetworks[i].ipParts;
    let matchingBits = 0;
    
    for (let j = 0; j < 4; j++) {
      const xor = firstIpParts[j] ^ currentIpParts[j];
      if (xor === 0) {
        matchingBits += 8;
      } else {
        // Find the most significant bit that differs
        let diffBit = 7;
        while (diffBit >= 0 && ((xor >> diffBit) & 1) === 0) {
          matchingBits++;
          diffBit--;
        }
        break;
      }
    }
    
    commonBits = Math.min(commonBits, matchingBits);
  }

  const supernetCidr = commonBits;
  const supernetMask = cidrToMask(supernetCidr);
  const supernetNetworkId = getNetworkAddress(parsedNetworks[0].ip, supernetMask);
  const wildcardMask = getWildcardMask(supernetMask);
  const broadcastAddress = getBroadcastAddress(supernetNetworkId, wildcardMask);
  
  const totalAddresses = Math.pow(2, 32 - supernetCidr);
  const usableHosts = supernetCidr < 31 ? totalAddresses - 2 : totalAddresses;

  // Binary analysis for UI
  const targetOctetIndex = Math.floor(supernetCidr / 8);
  const commonBitsInOctet = supernetCidr % 8;
  const commonBitsStr = firstIpParts[targetOctetIndex].toString(2).padStart(8, '0').substring(0, commonBitsInOctet) + 'x'.repeat(8 - commonBitsInOctet);

  return {
    originalCount: networks.length,
    totalAddresses,
    supernet: `${supernetNetworkId}/${supernetCidr}`,
    subnetMask: supernetMask,
    wildcardMask,
    range: `${supernetNetworkId} - ${broadcastAddress}`,
    usableHosts,
    reduction: Math.round((1 - (1 / networks.length)) * 100),
    binary: {
      commonBits: commonBitsStr,
      matchCount: commonBits,
      cidr: `/${supernetCidr} (${firstCidr} - ${firstCidr - supernetCidr} = ${supernetCidr})`
    }
  };
}
