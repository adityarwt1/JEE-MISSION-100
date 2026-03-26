"use client"
import {UAParser} from 'ua-parser-js';
import si from "systeminformation"
const parser = new UAParser();           // auto-reads navigator.userAgent
export const deviceInfo = parser.getResult();     
 
export const getDeviceInfo  = ()=>{
    return parser.getResult();
}

export const getAllInformation = async ()=>{
    return await si.getAllData()
}