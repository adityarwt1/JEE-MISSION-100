"use client"

import {  getDeviceInfo } from "@/utils/diviceInfo/deviceInfo"
import { getGpuInfo } from "@/utils/getGpuInfor/getGpuInfo"
import { getSystemInfo } from "@/utils/systemInformation/systemInformation"
import { useEffect } from "react"

const HomePage = ()=>{
  useEffect(()=>{
    const consoleGpuInfo = async ()=>{
      console.log(await getGpuInfo(), getDeviceInfo(),await getSystemInfo())
    }
    consoleGpuInfo()
  },[])
  return (
    <div>check console</div>
  )
}
export default HomePage