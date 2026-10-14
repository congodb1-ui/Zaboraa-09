/**
 * Integer-Based IPv4 CIDR Math & Cloud Network Allocation Engine
 * Pure TypeScript utilities for address range calculations, cloud-reserved IP deductions,
 * network boundary validation, and bitwise subnet collision/overlap detection.
 */

export type CloudPlatformNetworkType = 'azure' | 'aws' | 'gcp' | 'on-premise' | 'avs' | 'gcve';

export interface CidrParsedResult {
  isValid: boolean;
  cidr: string;
  networkAddress: string;
  prefixLength: number;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalAddresses: number;
  usableAddresses: number;
  reservedAddresses: number;
  cloudPlatform: CloudPlatformNetworkType;
  startInt: number;
  endInt: number;
  error?: string;
  warnings?: string[];
}

export interface SubnetOverlapResult {
  hasOverlap: boolean;
  overlapDescription?: string;
  conflictingCidrs: [string, string];
}

/**
 * Converts a dotted-quad IPv4 string into a 32-bit unsigned integer.
 */
export function ipToInteger(ip: string): number {
  const octets = ip.trim().split('.');
  if (octets.length !== 4) {
    throw new Error(`Invalid IPv4 address format: "${ip}"`);
  }

  let result = 0;
  for (let i = 0; i < 4; i++) {
    const octet = Number(octets[i]);
    if (isNaN(octet) || octet < 0 || octet > 255 || !Number.isInteger(octet)) {
      throw new Error(`Invalid octet value "${octets[i]}" in IPv4 address "${ip}"`);
    }
    result = (result << 8) | octet;
  }
  // Convert signed 32-bit to unsigned integer
  return result >>> 0;
}

/**
 * Converts a 32-bit unsigned integer into a dotted-quad IPv4 string.
 */
export function integerToIp(intVal: number): string {
  const unsigned = intVal >>> 0;
  return [
    (unsigned >>> 24) & 255,
    (unsigned >>> 16) & 255,
    (unsigned >>> 8) & 255,
    unsigned & 255
  ].join('.');
}

/**
 * Number of addresses reserved by cloud infrastructure provider.
 * - Azure vNet / Subnet: 5 reserved (.0 network, .1 gateway, .2 DNS, .3 DNS, .255 broadcast)
 * - AWS VPC / Subnet: 5 reserved (.0 network, .1 router, .2 DNS, .3 future use, .255 broadcast)
 * - GCP VPC / Subnet: 4 reserved (.0 network, .1 gateway, .2 second-to-last, .255 broadcast)
 * - On-Premises: 2 reserved (.0 network, .255 broadcast)
 */
export function getReservedAddressCount(
  platform: CloudPlatformNetworkType,
  prefix: number
): number {
  if (prefix >= 31) {
    return 0; // RFC 3021 / host route
  }
  switch (platform) {
    case 'azure':
    case 'avs':
    case 'aws':
      return 5;
    case 'gcp':
    case 'gcve':
      return 4;
    case 'on-premise':
    default:
      return 2;
  }
}

/**
 * Parses and validates an IPv4 CIDR string according to cloud provider rules.
 */
export function parseAndValidateCidr(
  cidrInput: string,
  platform: CloudPlatformNetworkType = 'azure'
): CidrParsedResult {
  const trimmed = (cidrInput || '').trim();
  const parts = trimmed.split('/');

  if (parts.length !== 2) {
    return {
      isValid: false,
      cidr: trimmed,
      networkAddress: '',
      prefixLength: 0,
      broadcastAddress: '',
      firstUsableIp: '',
      lastUsableIp: '',
      totalAddresses: 0,
      usableAddresses: 0,
      reservedAddresses: 0,
      cloudPlatform: platform,
      startInt: 0,
      endInt: 0,
      error: `CIDR notation must be in the format IP/prefix (e.g. 10.10.0.0/16 or 10.240.0.0/22).`
    };
  }

  const [ipPart, prefixStr] = parts;
  const prefix = Number(prefixStr);

  if (isNaN(prefix) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return {
      isValid: false,
      cidr: trimmed,
      networkAddress: ipPart,
      prefixLength: prefix || 0,
      broadcastAddress: '',
      firstUsableIp: '',
      lastUsableIp: '',
      totalAddresses: 0,
      usableAddresses: 0,
      reservedAddresses: 0,
      cloudPlatform: platform,
      startInt: 0,
      endInt: 0,
      error: `Invalid CIDR prefix length "/${prefixStr}". Prefix must be an integer between 0 and 32.`
    };
  }

  let ipInt = 0;
  try {
    ipInt = ipToInteger(ipPart);
  } catch (err: any) {
    return {
      isValid: false,
      cidr: trimmed,
      networkAddress: ipPart,
      prefixLength: prefix,
      broadcastAddress: '',
      firstUsableIp: '',
      lastUsableIp: '',
      totalAddresses: 0,
      usableAddresses: 0,
      reservedAddresses: 0,
      cloudPlatform: platform,
      startInt: 0,
      endInt: 0,
      error: err.message
    };
  }

  // Calculate netmask
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | ~maskInt) >>> 0;
  const totalAddresses = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);

  const warnings: string[] = [];
  // Check if host bits are set in the supplied network address
  if (ipInt !== networkInt) {
    warnings.push(
      `Network address "${ipPart}" has active host bits for prefix /${prefix}. Correct aligned network base is "${integerToIp(networkInt)}/${prefix}".`
    );
  }

  const reservedCount = getReservedAddressCount(platform, prefix);
  const usableAddresses = Math.max(0, totalAddresses - reservedCount);

  const firstUsableInt = (networkInt + (prefix < 31 ? (platform === 'on-premise' ? 1 : 1) : 0)) >>> 0;
  const lastUsableInt = (broadcastInt - (prefix < 31 ? (platform === 'on-premise' ? 1 : 1) : 0)) >>> 0;

  return {
    isValid: true,
    cidr: `${integerToIp(networkInt)}/${prefix}`,
    networkAddress: integerToIp(networkInt),
    prefixLength: prefix,
    broadcastAddress: integerToIp(broadcastInt),
    firstUsableIp: integerToIp(firstUsableInt),
    lastUsableIp: integerToIp(lastUsableInt),
    totalAddresses,
    usableAddresses,
    reservedAddresses: reservedCount,
    cloudPlatform: platform,
    startInt: networkInt,
    endInt: broadcastInt,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Checks whether two CIDRs intersect using unsigned integer interval math.
 */
export function checkSubnetOverlap(cidrA: string, cidrB: string): SubnetOverlapResult {
  const parsedA = parseAndValidateCidr(cidrA);
  const parsedB = parseAndValidateCidr(cidrB);

  if (!parsedA.isValid || !parsedB.isValid) {
    return {
      hasOverlap: false,
      conflictingCidrs: [cidrA, cidrB]
    };
  }

  // Interval intersection: max(startA, startB) <= min(endA, endB)
  const maxStart = Math.max(parsedA.startInt, parsedB.startInt);
  const minEnd = Math.min(parsedA.endInt, parsedB.endInt);

  if (maxStart <= minEnd) {
    return {
      hasOverlap: true,
      overlapDescription: `CIDR "${cidrA}" (${integerToIp(parsedA.startInt)} - ${integerToIp(parsedA.endInt)}) collides with "${cidrB}" (${integerToIp(parsedB.startInt)} - ${integerToIp(parsedB.endInt)}).`,
      conflictingCidrs: [cidrA, cidrB]
    };
  }

  return {
    hasOverlap: false,
    conflictingCidrs: [cidrA, cidrB]
  };
}

/**
 * Validates platform-specific SDDC management CIDR requirements.
 * - Azure VMware Solution (AVS): Requires non-overlapping RFC 1918 block of exactly /22.
 * - Google Cloud VMware Engine (GCVE): Requires dynamic sizing (/20, /21, /22, /23, /24) based on cluster node count.
 */
export function validateSddcPlatformCidr(
  cidr: string,
  platform: 'AVS' | 'GCVE' | 'VMC' | 'NC2',
  nodeCount: number = 3
): { isValid: boolean; message: string; recommendedPrefix?: number } {
  const parsed = parseAndValidateCidr(cidr);
  if (!parsed.isValid) {
    return { isValid: false, message: parsed.error || 'Invalid CIDR format' };
  }

  if (platform === 'AVS') {
    if (parsed.prefixLength !== 22) {
      return {
        isValid: false,
        message: `Azure VMware Solution requires an exact /22 CIDR block (1,024 addresses) for management. Found /${parsed.prefixLength}.`,
        recommendedPrefix: 22
      };
    }
    return { isValid: true, message: `Valid AVS SDDC /22 management block (${parsed.totalAddresses} total IPs, ${parsed.usableAddresses} usable).` };
  }

  if (platform === 'GCVE') {
    // GCVE dynamic prefix requirements based on node count:
    let minPrefix = 24; // up to 4 nodes
    if (nodeCount > 32) minPrefix = 20;
    else if (nodeCount > 16) minPrefix = 21;
    else if (nodeCount > 8) minPrefix = 22;
    else if (nodeCount > 4) minPrefix = 23;

    if (parsed.prefixLength > minPrefix) {
      return {
        isValid: false,
        message: `GCVE cluster with ${nodeCount} nodes requires at least a /${minPrefix} block to support internal ESXi, vCenter, and NSX subnets. Found /${parsed.prefixLength}.`,
        recommendedPrefix: minPrefix
      };
    }
    return { isValid: true, message: `Valid GCVE /${parsed.prefixLength} management block supporting up to ${nodeCount} nodes.` };
  }

  if (platform === 'VMC') {
    if (parsed.prefixLength > 26 || parsed.prefixLength < 16) {
      return {
        isValid: false,
        message: `VMware Cloud on AWS SDDC management network must be between /16 and /26 (recommended /20 or /23). Found /${parsed.prefixLength}.`,
        recommendedPrefix: 23
      };
    }
    return { isValid: true, message: `Valid VMC SDDC /${parsed.prefixLength} management block.` };
  }

  // NC2 Azure / native
  return { isValid: true, message: `Valid CIDR block /${parsed.prefixLength}.` };
}
