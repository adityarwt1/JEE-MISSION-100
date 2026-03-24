"use client"
import { GetGPUTier,getGPUTier} from "detect-gpu"
export const getGpuInfo = async ()=>{
    return await getGPUTier()
}

