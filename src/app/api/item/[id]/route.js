// src/app/api/item/[id]/route.js - FIXED WITH AWAIT
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    // Await the params
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item ID is required" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    let item;
    try {
      item = await db.collection("item").findOne({
        _id: new ObjectId(id)
      });
    } catch (err) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid item ID format" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!item) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item not found" 
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      data: item
    }, { 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("GET by ID Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to fetch item"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    // Await the params
    const { id } = await params;
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item ID is required" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    // Build update object
    const updateData = {
      updatedAt: new Date()
    };
    
    if (data.name !== undefined) updateData.itemName = data.name;
    if (data.category !== undefined) updateData.itemCategory = data.category;
    if (data.price !== undefined) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { 
            success: false,
            message: "Price must be a valid positive number" 
          },
          { status: 400, headers: corsHeaders }
        );
      }
      updateData.itemPrice = price;
    }

    let result;
    try {
      result = await db.collection("item").updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
    } catch (err) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid item ID format" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item not found" 
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item updated successfully",
      modifiedCount: result.modifiedCount
    }, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to update item"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Await the params
    const { id } = await params;
    const data = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item ID is required" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate required fields
    if (!data.name || !data.price || !data.category) {
      return NextResponse.json(
        { 
          success: false,
          message: "Name, price, and category are required" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Price must be a valid positive number" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const itemData = {
      itemName: data.name.trim(),
      itemCategory: data.category,
      itemPrice: price,
      status: data.status || "ACTIVE",
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: new Date()
    };

    let result;
    try {
      result = await db.collection("item").updateOne(
        { _id: new ObjectId(id) },
        { $set: itemData }
      );
    } catch (err) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid item ID format" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item not found" 
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item replaced successfully",
      modifiedCount: result.modifiedCount
    }, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to replace item"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Await the params
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item ID is required" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    let result;
    try {
      result = await db.collection("item").deleteOne({
        _id: new ObjectId(id)
      });
    } catch (err) {
      return NextResponse.json(
        { 
          success: false,
          message: "Invalid item ID format" 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: "Item not found" 
        },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully",
      deletedCount: result.deletedCount
    }, { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to delete item"
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}