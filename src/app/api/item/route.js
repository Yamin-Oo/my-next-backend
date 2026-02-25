import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const cacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  ...corsHeaders
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5;
    const skip = (page - 1) * limit;

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const items = await db.collection("item").find({}).skip(skip).limit(limit).toArray();
    const total = await db.collection("item").countDocuments();

    return NextResponse.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    }, { headers: cacheHeaders });
  } catch (err) {
    return NextResponse.json({ message: err.toString() }, { status: 400, headers: corsHeaders });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const result = await db.collection("item").insertOne({
      itemName: data.name,
      itemCategory: data.category,
      itemPrice: data.price,
      status: "ACTIVE",
    });
    return NextResponse.json({ id: result.insertedId }, { status: 200, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ message: err.toString() }, { status: 400, headers: corsHeaders });
  }
}