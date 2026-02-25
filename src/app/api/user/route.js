import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const result = await db.collection("user")
      .find({})
      .project({ password: 0 })
      .toArray();
    
    console.log("==> Users fetched:", result.length);
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

export async function POST(req) {
  const data = await req.json();
  const { 
    username, 
    email, 
    password, 
    firstname, 
    lastname,
    status = "ACTIVE" 
  } = data;

  if (!username || !email || !password) {
    return NextResponse.json({
      message: "Missing mandatory data (username, email, password)"
    }, {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    
    const result = await db.collection("user").insertOne({
      username: username,
      email: email,
      password: await bcrypt.hash(password, 10),
      firstname: firstname || "",
      lastname: lastname || "",
      status: status,
      profileImage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      id: result.insertedId,
      message: "User created successfully"
    }, {
      status: 200,
      headers: corsHeaders
    });
  } catch (exception) {
    console.log("exception", exception.toString());
    const errorMsg = exception.toString();
    let displayErrorMsg = "Failed to create user";
    
    if (errorMsg.includes("duplicate")) {
      if (errorMsg.includes("username")) {
        displayErrorMsg = "Duplicate Username!!";
      } else if (errorMsg.includes("email")) {
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