export interface Audio {
  name?: string;
  manufacturer?: string;
}

export interface BaseBoard {
  manufacturer?: string;
  memSlots?: number;
  model?: string;
  serial?: string;
}

export interface BatteryModel {
  acConnected?: boolean;
  capacityUnit?: string;
  currentCapacity?: number;
  cycleCount?: number;
  designedCapacity?: number;
  isCharging?: boolean;
  maxCapacity?: number;
  model?: string;
  percent?: number;
}

export interface Bios {
  releaseDate?: string;
  serial?: string;
  vendor?: string;
  version?: string;
}

export interface CpuModel {
  brand?: string;
  cores?: number;
  manufacturer?: string;
  family?: string;
  flags?: string;
  performanceCores?: number;
  model?: string;
  physicalCores?: number;
  speed?: number;
}

export interface DiskLayout {
  bytesPerSector?: number;
  interfaceType?: string;
  name?: string;
  serialNumber?: string;
  size?: number;
  totalCylinders?: number;
  totalHeads?: number;
  totalSectors?: number;
  totalTracks?: number;
  tracksPerCylinder?: number;
  type?: string;
  vendor?: string;
}

export interface GpuControllers {
  bus?: string;
  clockCore?: number;
  clockMemory?: number;
  driverVersion?: string;
  memoryFree?: number;
  memoryTotal?: number;
  memoryUsed?: number;
  model?: string;
  name?: string;
  powerDraw?: number;
  temperatureGpu?: number;
  vendor?: string;
  utilizationMemory?: number;
  vram?: number;
  vramDynamic?: boolean;
}

export interface GpuDisplays {
  builtin?: boolean;
  currentRefreshRate?: number;
  currentResX?: number;
  currentResY?: number;
  model?: string;
  pixelDepth?: number;
  resolutionX?: number;
  resolutionY?: number;
  sizeX?: number;
  sizeY?: number;
}

export interface GPUmodelWithDisplay {
  controllers?: GpuControllers[];
  displays?: GpuDisplays[];
}

export interface MemoryLayout {
  clockSpeed?: number;
  manufacturer?: string;
  formFactor?: string;
  partNum?: string;
  serialNum?: string;
  size?: number;
  type?: string;
}

export interface OperatingSystem {
  distro?: string;
  fqdn?: string;
  hostname?: string;
  platform?: string;
  serial?: string;
}

export interface SystemInformation {
  manufacturer?: string;
  model?: string;
  serial?: string;
  uuid?: string;
  virtual?: boolean;
}

export interface TimeInfomation {
  current?: number;
  timezone?: string;
  timezoneName?: string;
  uptime?: number;
}

export interface DeviceInfoInterface {
  audio?: Audio[];
  baseboard?: BaseBoard | undefined;
  battery?: BatteryModel;
  bios?: Bios;
  cpu?: CpuModel;
  diskLayout?: DiskLayout[];
  graphics?: GPUmodelWithDisplay;
  memLayout?: MemoryLayout[];
  os?: OperatingSystem;
  system?: SystemInformation;
  time?: TimeInfomation;
}
