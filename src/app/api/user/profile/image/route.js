import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function parseMultipartFormData(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new Error("Invalid content-type");
  }
  const formData = await req.formData();
  return formData;
}

export async function POST(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  let formData;
  try {
    formData = await parseMultipartFormData(req);
  } catch (err) {
    return NextResponse.json(
      { message: "Invalid form data" },
      { status: 400, headers: corsHeaders }
    );
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { message: "No file uploaded" },
      { status: 400, headers: corsHeaders }
    );
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { message: "Only image files allowed (JPEG, PNG, GIF, WEBP)" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { message: "File size too large. Max 5MB allowed" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const currentUser = await db.collection("user").findOne({ email: user.email });

    if (currentUser && currentUser.profileImage) {
      try {
        const oldFilePath = path.join(process.cwd(), "public", currentUser.profileImage);
        await fs.rm(oldFilePath);
      } catch (err) {
        console.log("Error deleting old profile image:", err);
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "profile-images");
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const ext = file.name.split(".").pop();
    const filename = `${uuidv4()}.${ext}`;
    const savePath = path.join(uploadDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(savePath, Buffer.from(arrayBuffer));

    const imageUrl = `/profile-images/${filename}`;
    await db.collection("user").updateOne(
      { email: user.email },
      { 
        $set: { 
          profileImage: imageUrl,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json(
      { 
        imageUrl: imageUrl,
        message: "Profile image uploaded successfully" 
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.log("Error uploading profile image:", err);
    return NextResponse.json(
      { message: "Failed to upload profile image" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const profile = await db.collection("user").findOne({ email: user.email });
    
    if (profile && profile.profileImage) {
      const filePath = path.join(process.cwd(), "public", profile.profileImage);
      try {
        await fs.rm(filePath);
      } catch (err) {
        console.log("Error deleting profile image file:", err);
      }

      await db.collection("user").updateOne(
        { email: user.email },
        { 
          $set: { 
            profileImage: null,
            updatedAt: new Date()
          } 
        }
      );
    }

    return NextResponse.json(
      { message: "Profile image removed successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.log("Error deleting profile image:", error);
    return NextResponse.json(
      { message: error.toString() },
      { status: 500, headers: corsHeaders }
    );
  }
}