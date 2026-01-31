// src/app/api/item/route.js - UPDATED WITH CORS
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

// Helper function for CORS headers
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
  
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// GET all items
export async function GET(request) {
  try {
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const headers = getCorsHeaders(origin);
    
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const items = await db.collection("item")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      items: items || []
    }, { 
      headers 
    });

  } catch (error) {
    console.error("GET Error:", error);
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const headers = getCorsHeaders(origin);
    
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to fetch items"
      },
      { status: 500, headers }
    );
  }
}

// POST create new item
export async function POST(request) {
  try {
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const headers = getCorsHeaders(origin);
    const data = await request.json();
    
    if (!data.name || !data.price || !data.category) {
      return NextResponse.json(
        { 
          success: false,
          message: "Name, price, and category are required" 
        },
        { status: 400, headers }
      );
    }

    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Price must be a positive number" 
        },
        { status: 400, headers }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const result = await db.collection("item").insertOne({
      itemName: data.name.trim(),
      itemCategory: data.category,
      itemPrice: price,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: "Item created successfully",
      id: result.insertedId
    }, { 
      status: 201, 
      headers 
    });

  } catch (error) {
    console.error("POST Error:", error);
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const headers = getCorsHeaders(origin);
    
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to create item"
      },
      { status: 500, headers }
    );
  }
}

// DELETE item by name
export async function DELETE(request) {
  try {
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const headers = getCorsHeaders(origin);
    
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    
    console.log("DELETE request for item name:", name);
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          message: "Item name is required. Use ?name=itemName" 
        },
        { status: 400, headers }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const result = await db.collection("item").deleteOne({
      itemName: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    console.log("Delete result:", result);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: `Item "${name}" not found` 
        },
        { status: 404, headers }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Item "${name}" deleted successfully`,
      deletedCount: result.deletedCount
    }, { 
      status: 200, 
      headers 
    });

  } catch (error) {
    console.error("DELETE Error:", error);
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const headers = getCorsHeaders(origin);
    
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to delete item"
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  const headers = getCorsHeaders(origin);
  
  return new Response(null, {
    status: 200,
    headers,
  });
}