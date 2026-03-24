"use client"
import { getGPUTier } from "detect-gpu"

export const getGpuInfo = async () => {
  return await getGPUTier();
};

