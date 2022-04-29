import { BigNumber, ethers } from "ethers";

export const shorten = (hex:string) => 
    hex.toLocaleLowerCase().startsWith("0x") ? hex.substring(0,6) + "..." + hex.substring(hex.length-4) : hex

export const env = (varName:string, val:string|undefined) =>{
    if (val)
        return val;
    throw "Missing environment variable: " + varName
}

export const percentage = (total:BigNumber|undefined, part:BigNumber|undefined):number => 
    part && total && total.gt(ethers.constants.Zero) ? 
        part.mul(1_000_000).div(total).toNumber()/10_000
        : 0
