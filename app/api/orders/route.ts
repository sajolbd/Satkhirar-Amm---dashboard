import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const ordersFilePath = path.join(process.cwd(), "data", "website-orders.json");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function readOrders() {
  try {
    const ordersRaw = await readFile(ordersFilePath, "utf8");
    return JSON.parse(ordersRaw);
  } catch {
    return [];
  }
}

async function writeOrders(orders: unknown[]) {
  await mkdir(path.dirname(ordersFilePath), { recursive: true });
  await writeFile(ordersFilePath, JSON.stringify(orders, null, 2));
}

export async function GET() {
  const orders = await readOrders();

  return NextResponse.json(orders, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const nextOrder = await request.json();
  const currentOrders = await readOrders();
  const nextOrders = [
    nextOrder,
    ...currentOrders.filter((order: { id?: string }) => order.id !== nextOrder.id),
  ];

  await writeOrders(nextOrders);

  return NextResponse.json(nextOrder, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
