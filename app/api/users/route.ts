import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const usersFilePath = path.join(process.cwd(), "data", "website-users.json");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function readUsers() {
  try {
    const usersRaw = await readFile(usersFilePath, "utf8");
    return JSON.parse(usersRaw);
  } catch {
    return [];
  }
}

async function writeUsers(users: unknown[]) {
  await mkdir(path.dirname(usersFilePath), { recursive: true });
  await writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

export async function GET() {
  const users = await readUsers();

  return NextResponse.json(users, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const nextUser = await request.json();
  const currentUsers = await readUsers();
  const nextUsers = [
    nextUser,
    ...currentUsers.filter((user: { email?: string }) => user.email !== nextUser.email),
  ];

  await writeUsers(nextUsers);

  return NextResponse.json(nextUser, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
