import { NextResponse } from "next/server"
import si from 'systeminformation'
export async function GET() {
    try {
        const allInofo = await si.getAllData()
        return NextResponse.json({
            data:allInofo
        },{
            status:200
        })
    } catch (error) {
        console.log(error)
        return NextResponse.json({
            error:(error as Error).message
        },{
            status:500
        })
    }
}