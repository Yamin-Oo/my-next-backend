import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs/promises";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req, { params }) {
  const { id } = await params;

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        message: "Invalid user ID format"
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const result = await db.collection("user").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    if (!result) {
      return NextResponse.json({
        message: "User not found"
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return NextResponse.json(result, {
      headers: corsHeaders
    });
  } catch (exception) {
    console.log("exception", exception.toString());
    return NextResponse.json({
      message: exception.toString()
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const data = await req.json();

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({
      message: "Invalid user ID format"
    }, {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");

    const updateData = {};
    
    if (data.username != null) updateData.username = data.username;
    if (data.email != null) updateData.email = data.email;
    if (data.firstname != null) updateData.firstname = data.firstname;
    if (data.lastname != null) updateData.lastname = data.lastname;
    if (data.status != null) updateData.status = data.status;
    if (data.password != null) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    updateData.updatedAt = new Date();

    const updatedResult = await db.collection("user").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (updatedResult.matchedCount === 0) {
      return NextResponse.json({
        message: "User not found"
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return NextResponse.json({
      message: "User updated successfully",
      modifiedCount: updatedResult.modifiedCount
    }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (exception) {
    console.log("exception", exception.toString());
    let displayErrorMsg = "Failed to update user";
    
    if (exception.toString().includes("duplicate")) {
      if (exception.toString().includes("username")) {
        displayErrorMsg = "Duplicate Username!!";
      } else if (exception.toString().includes("email")) {
        displayErrorMsg = "Duplicate Email!!";
      }
    }

    return NextResponse.json({
      message: displayErrorMsg
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({
      message: "Invalid user ID format"
    }, {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");

    const user = await db.collection("user").findOne(
      { _id: new ObjectId(id) }
    );

    if (user && user.profileImage) {
      try {
        const filePath = path.join(process.cwd(), "public", user.profileImage);
        await fs.rm(filePath);
      } catch (err) {
        console.log("Error deleting profile image:", err);
      }
    }

    const result = await db.collection("user").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        message: "User not found"
      }, {
        status: 404,
        headers: corsHeaders
      });
    }

    return NextResponse.json({
      message: "User deleted successfully",
      deletedCount: result.deletedCount
    }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (exception) {
    console.log("exception", exception.toString());
    return NextResponse.json({
      message: exception.toString()
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
}