import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  console.log('🔍 GET /api/item called');
  
  try {
    const client = await getClientPromise();
    console.log('✅ MongoDB client connected');
    
    // Check which databases are available
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log('📊 Available databases:', databases.databases.map(db => db.name));
    
    const db = client.db("wad-01");
    console.log('📁 Using database: wad-01');
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in wad-01:', collections.map(col => col.name));
    
    const items = await db.collection("item").find({}).toArray();
    console.log('🎯 Found items:', items.length);
    console.log('📦 Items data:', JSON.stringify(items, null, 2));
    
    return NextResponse.json(items, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/item:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: 'Check MongoDB connection and database name'
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}

export async function POST(request) {
  console.log('📝 POST /api/item called');
  
  try {
    const data = await request.json();
    console.log('📨 Received data:', data);
    
    if (!data.name || !data.category || !data.price) {
      return NextResponse.json(
        { error: "Missing required fields: name, category, price" },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const newItem = {
      itemName: data.name,
      itemCategory: data.category,
      itemPrice: parseFloat(data.price),
      status: "ACTIVE",
      createdAt: new Date()
    };
    
    console.log('💾 Inserting item:', newItem);
    
    const result = await db.collection("item").insertOne(newItem);
    
    console.log('✅ Item inserted, ID:', result.insertedId);
    
    return NextResponse.json(
      { 
        id: result.insertedId,
        message: "Item created successfully",
        item: newItem
      },
      { 
        status: 201,
        headers: corsHeaders 
      }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/item:', error);
    return NextResponse.json(
      { 
        error: error.message,
        step: "Failed to create item"
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}