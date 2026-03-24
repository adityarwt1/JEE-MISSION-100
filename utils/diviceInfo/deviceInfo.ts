import {UAParser} from 'ua-parser-js';

const parser = new UAParser();           // auto-reads navigator.userAgent
export const deviceInfo = parser.getResult();     
 
export const getDeviceInfo  = ()=>{
    return parser.getResult();
}